import { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerDO, MCP_SUBPROTOCOL } from "@xava-labs/mcp/src/mcp/server";
import { McpServerProxy } from "./mcp-server-proxy";

const REMOTE_CONTAINER_WS_ENDPOINT = "/remote-container/ws";
const CLIENT_WS_ENDPOINT = "/client/ws";

/**
 * Interface for the remote container WebSocket attachment data
 */
interface RemoteContainerAttachment {
  isRemoteContainer: boolean;
}

/**
 * Interface for the client WebSocket attachment data
 */
interface ClientAttachment {
  isClient: boolean;
}

/**
 * McpServerProxyDO extends McpServerDO to add remote container proxy capabilities.
 * It provides WebSocket endpoints for both clients and remote containers,
 * facilitating bidirectional communication between them.
 */
export class McpServerProxyDO extends McpServerDO {
 
  private mcpProxy: McpServerProxy;
  private clientConnections: Set<WebSocket> = new Set();
  
  constructor(ctx: DurableObjectState, env: any) {
    console.log('🏗️ McpServerProxyDO constructor called - Durable Object created/recreated');
    const proxy = new McpServerProxy();
    super(ctx, env, proxy);
    this.mcpProxy = proxy;
    
    // Restore proxy connection state if Durable Object was hibernated and woke up
    this.restoreProxyConnectionFromHibernation();
  }

  getImplementation(): Implementation {
    return {
      name: "McpServerProxy",
      version: "1.0.0",
    };
  }

  /**
   * Abstract method that must be implemented by subclasses to configure the server instance.
   * For proxy, we override this to do nothing since we're forwarding to remote container.
   */
  configureServer(server: McpServer): void {
    // Override to do nothing - proxy forwards to remote container
    // Subclasses can still override this if they need custom configuration
  }

  /**
   * Process a client WebSocket connection
   */
  protected processClientConnection(request: Request): Response {
    console.log("Accepting client WebSocket connection");

    // Verify the Upgrade header is present and is WebSocket
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      console.log("Rejecting connection - Upgrade header is not websocket");
      return new Response('Expected Upgrade: websocket', {
        status: 426,
      });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Store marker that this is a client connection
    server.serializeAttachment({ isClient: true } as ClientAttachment);

    console.log("Accepting client WebSocket connection");
    // Accept WebSocket with hibernation support
    this.ctx.acceptWebSocket(server);

    // Add to client connections set
    this.clientConnections.add(server);

    console.log('Client connection accepted');

    // Auto-initialize the client with status and server list
    this.initializeNewClient(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Initialize a newly connected client by sending status and requesting server list
   */
  private initializeNewClient(clientWs: WebSocket): void {
    console.log('🚀 Initializing new client connection');
    
    // Send immediate status to the client
    const statusMessage = {
      verb: 'status',
      success: true,
      connected: this.mcpProxy.isConnected(),
      message: this.mcpProxy.isConnected() ? 'Connected to remote container' : 'Remote container not connected',
      timestamp: new Date().toISOString()
    };
    
    try {
      clientWs.send(JSON.stringify(statusMessage));
      console.log('✅ Sent status message to new client');
    } catch (error) {
      console.error('❌ Failed to send status message to client:', error);
    }

    // If remote container is connected, automatically request server list
    if (this.mcpProxy.isConnected()) {
      const listRequest = {
        verb: 'list'
      };
      
      try {
        this.mcpProxy.forwardToProxy(JSON.stringify(listRequest));
        console.log('✅ Automatically requested server list for new client');
      } catch (error) {
        console.error('❌ Failed to request server list for client:', error);
      }
    } else {
      // Send empty server list if remote container not connected
      const emptyListResponse = {
        verb: 'list',
        success: true,
        data: [],
        count: 0,
        timestamp: new Date().toISOString()
      };
      
      try {
        clientWs.send(JSON.stringify(emptyListResponse));
        console.log('✅ Sent empty server list to new client (remote container not connected)');
      } catch (error) {
        console.error('❌ Failed to send empty server list to client:', error);
      }
    }
  }

  /**
   * Restore proxy connection state after hibernation
   * When a Durable Object wakes up from hibernation, it needs to reconnect to existing WebSockets
   */
  private restoreProxyConnectionFromHibernation(): void {
    console.log('🔄 Checking for hibernated WebSocket connections to restore...');
    
    // Get all existing WebSocket connections
    const allWebSockets = this.ctx.getWebSockets();
    console.log(`📡 Found ${allWebSockets.length} existing WebSocket connections`);
    
    for (const ws of allWebSockets) {
      try {
        const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | ClientAttachment | { sessionId: string } | null;
        
        // Look for remote container connection
        if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
          console.log('🔗 Restoring remote container proxy connection from hibernation');
          this.mcpProxy.setProxyConnection(ws);
          console.log('✅ Successfully restored proxy connection state');
          break; // Only need one remote container connection
        }
        // Track client connections
        else if (attachment && 'isClient' in attachment && attachment.isClient) {
          console.log('👤 Restoring client connection from hibernation');
          this.clientConnections.add(ws);
        }
      } catch (error) {
        console.error('❌ Error restoring WebSocket connection:', error);
      }
    }
    
    console.log(`📊 Restoration complete - Proxy connected: ${this.mcpProxy.isConnected()}, Clients: ${this.clientConnections.size}`);
    
    // If we restored a proxy connection, broadcast the connected status to any existing clients
    if (this.mcpProxy.isConnected() && this.clientConnections.size > 0) {
      console.log('🔄 Broadcasting restored connection status to existing clients');
      this.broadcastConnectionStatus(true, 'Remote container connection restored from hibernation');
    }
  }

  /**
   * Debug helper for troubleshooting connection issues
   * Call this method when you need detailed connection state information
   */
  public debugConnectionState(): void {
    console.log('🐛 McpServerProxyDO - Debug connection state:');
    this.mcpProxy.debugConnectionState();
  }

  /**
   * Process a remote container WebSocket connection
   */
  protected processRemoteContainerConnection(request: Request): Response {
    console.log("Accepting remote container WebSocket connection");

    // Verify the Upgrade header is present and is WebSocket
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      console.log("Rejecting connection - Upgrade header is not websocket");
      return new Response('Expected Upgrade: websocket', {
        status: 426,
      });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Store marker that this is a remote container connection
    server.serializeAttachment({ isRemoteContainer: true } as RemoteContainerAttachment);

    console.log("Accepting remote container WebSocket connection");
    // Accept WebSocket with hibernation support
    this.ctx.acceptWebSocket(server);

    // Set this as the proxy connection
    this.mcpProxy.setProxyConnection(server);

    console.log('Remote container connection accepted');
    
    // Broadcast connection status to all clients
    this.broadcastConnectionStatus(true, 'Remote container connected');

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastToClients(message: string): void {
    console.log('📤 Broadcasting message to', this.clientConnections.size, 'clients');
    
    for (const client of this.clientConnections) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending message to client:', error);
        // Remove failed client connection
        this.clientConnections.delete(client);
      }
    }
  }

  /**
   * Broadcast connection status to all clients
   */
  private broadcastConnectionStatus(connected: boolean, message: string): void {
    const statusMessage = {
      verb: 'status',
      success: true,
      connected: connected,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📡 Broadcasting connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'} - ${message}`);
    this.broadcastToClients(JSON.stringify(statusMessage));
  }

  /**
   * Override webSocketMessage to handle message routing between clients and remote container
   */
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | ClientAttachment | { sessionId: string } | null;
    
    // Handle messages from remote container
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
      console.log('🔍 Received message from remote container - broadcasting to clients');
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
      
      // Check if this is a system message (shutdown notification, etc.)
      try {
        const messageData = JSON.parse(messageStr);
        if (messageData.type) {
          switch (messageData.type) {
            case 'client_ready':
              console.log(`📡 Remote container client ready: ${messageData.clientId}`);
              break;
            case 'client_shutdown':
              console.log(`👋 Remote container shutting down: ${messageData.clientId} - ${messageData.message}`);
              // Notify clients about container shutdown
              this.broadcastConnectionStatus(false, 'Remote container shutting down gracefully');
              // Don't broadcast the raw shutdown message to clients
              return;
            default:
              console.log(`🔍 Unknown system message type: ${messageData.type}`);
          }
        }
      } catch (error) {
        // Not JSON or not a system message, continue with normal broadcast
      }
      
      this.broadcastToClients(messageStr);
    }
    // Handle messages from clients
    else if (attachment && 'isClient' in attachment && attachment.isClient) {
      console.log('🔍 Received message from client - forwarding to remote container');
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
      
      // Check connection state before forwarding
      if (!this.mcpProxy.isConnected()) {
        console.warn('⚠️ Message forwarding failed - remote container not connected');
        console.log('🐛 Connection debug info:');
        this.mcpProxy.debugConnectionState();
        
        // Send error response back to client
        const errorResponse = {
          verb: 'error',
          success: false,
          message: 'Remote container not connected',
          timestamp: new Date().toISOString()
        };
        
        try {
          ws.send(JSON.stringify(errorResponse));
        } catch (error) {
          console.error('❌ Failed to send error response to client:', error);
        }
        return;
      }
      
      this.mcpProxy.forwardToProxy(messageStr);
    }
    else {
      // Process the message via transport for consistency (MCP client connections)
      super.webSocketMessage(ws, data);
    }
  }

  /**
   * Override webSocketClose to handle client and remote container disconnections
   */
  override async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | ClientAttachment | { sessionId: string } | null;
    
    // Handle remote container disconnection
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
      console.log('🔌 Remote container WebSocket closed:', { code, reason, wasClean });
      this.mcpProxy.setProxyConnection(null);
      
      // Determine disconnect reason and broadcast status
      const disconnectReason = wasClean 
        ? (code === 1000 ? 'Remote container disconnected gracefully' : `Remote container closed (code: ${code})`)
        : 'Remote container disconnected unexpectedly';
      
      console.log('Remote container disconnected:', reason);
      this.broadcastConnectionStatus(false, disconnectReason);
    }
    // Handle client disconnection
    else if (attachment && 'isClient' in attachment && attachment.isClient) {
      console.log('🔌 Client WebSocket closed:', { code, reason, wasClean });
      this.clientConnections.delete(ws);
      console.log('Client disconnected. Remaining clients:', this.clientConnections.size);
    }
    
    // Delegate to parent for regular client handling
    return super.webSocketClose(ws, code, reason, wasClean);
  }

  /**
   * Override webSocketError to handle client and remote container errors
   */
  override async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | ClientAttachment | { sessionId: string } | null;
    
    // Handle remote container error
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
      console.log('❌ Remote container WebSocket error:', error);
      this.mcpProxy.setProxyConnection(null);
      this.broadcastConnectionStatus(false, 'Remote container error occurred');
    }
    // Handle client error
    else if (attachment && 'isClient' in attachment && attachment.isClient) {
      console.log('❌ Client WebSocket error:', error);
      this.clientConnections.delete(ws);
      console.log('Client connection removed due to error. Remaining clients:', this.clientConnections.size);
    }
    
    // Delegate to parent for regular client handling
    return super.webSocketError(ws, error);
  }

  /**
   * Main fetch handler - handles client and remote container WebSocket endpoints
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    console.log(`McpServerProxyDO: ${method} ${path} (full URL: ${url.toString()})`);

    // Process client WebSocket upgrade requests
    if (path === CLIENT_WS_ENDPOINT || path.endsWith(CLIENT_WS_ENDPOINT)) {
      console.log('Handling client WebSocket upgrade request');
      return this.processClientConnection(request);
    }

    // Process remote container WebSocket upgrade requests
    if (path === REMOTE_CONTAINER_WS_ENDPOINT || path.endsWith(REMOTE_CONTAINER_WS_ENDPOINT)) {
      console.log('Handling remote container WebSocket upgrade request');
      return this.processRemoteContainerConnection(request);
    }

    // Only delegate to parent for MCP-related endpoints
    if (path.endsWith('/ws') || path.endsWith('/sse') || path.endsWith('/message')) {
      console.log(`Delegating MCP endpoint ${method} ${path} to parent McpServerDO`);
      return super.fetch(request);
    }

    // For any other paths, return 404
    console.log(`No handler found for ${method} ${path}, returning 404`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      path: path,
      method: method,
      availableEndpoints: [CLIENT_WS_ENDPOINT, REMOTE_CONTAINER_WS_ENDPOINT]
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 