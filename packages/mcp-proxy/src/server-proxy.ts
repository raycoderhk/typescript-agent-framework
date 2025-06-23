import { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerDO, MCP_SUBPROTOCOL } from "@xava-labs/mcp/src/mcp/server";
import { McpServerProxy } from "./mcp-server-proxy";

const REMOTE_CONTAINER_WS_ENDPOINT = "/remote-container/ws";

/**
 * Interface for the remote container WebSocket attachment data
 */
interface RemoteContainerAttachment {
  isRemoteContainer: boolean;
}

/**
 * McpServerProxyDO extends McpServerDO to add remote container proxy capabilities.
 * It provides an additional WebSocket endpoint that can connect to remote containers
 * and proxy MCP messages bidirectionally.
 */
export class McpServerProxyDO extends McpServerDO {
 
  private mcpProxy: McpServerProxy;
  
  constructor(ctx: DurableObjectState, env: any) {
    console.log('🏗️ McpServerProxyDO constructor called - Durable Object created/recreated');
    const proxy = new McpServerProxy();
    super(ctx, env, proxy);
    this.mcpProxy = proxy;
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
   * Process a remote container WebSocket connection
   */
  protected processRemoteContainerConnection(request: Request): Response {
    console.log("Accepting WebSocket connection");

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

    console.log("Accepting WebSocket connection");
    // Accept WebSocket with hibernation support
    this.ctx.acceptWebSocket(server);

    // Set this as the proxy connection
    this.mcpProxy.setProxyConnection(server);

    console.log('Remote container connection accepted');

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Override webSocketMessage to handle message forwarding
   */
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | { sessionId: string } | null;
    
    // Check if this is a remote container connection
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
        console.log('🔍 Received message from remote container');
        this.mcpProxy.handleProxyMessage(data);
    } else {
        // Process the message via transport for consistency
        super.webSocketMessage(ws, data);
    }
  }

  /**
   * Override webSocketClose to handle remote container disconnections
   */
  override async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | { sessionId: string } | null;
    
    // Check if this is a remote container connection
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
      console.log('🔌 Remote container WebSocket closed:', { code, reason, wasClean });
      this.mcpProxy.setProxyConnection(null);
      console.log('Remote container disconnected:', reason);
    }
    
    // Delegate to parent for regular client handling
    return super.webSocketClose(ws, code, reason, wasClean);
  }

  /**
   * Override webSocketError to handle remote container errors
   */
  override async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | { sessionId: string } | null;
    
    // Check if this is a remote container connection
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
      console.log('❌ Remote container WebSocket error:', error);
      this.mcpProxy.setProxyConnection(null);
    }
    
    // Delegate to parent for regular client handling
    return super.webSocketError(ws, error);
  }

  /**
   * Handle add server requests
   */
  private async handleAddServer(request: Request): Promise<Response> {
    console.log('handleAddServer: Processing request...');
    try {
      // Read request body
      const body = await request.json();
      console.log('handleAddServer: Received body:', JSON.stringify(body, null, 2));
      
      // Forward the message to the remote container via WebSocket
      console.log('handleAddServer: Forwarding to proxy...');
      this.mcpProxy.forwardToProxy(JSON.stringify(body));
      
      // Return a success response for now
      const response = {
        success: true,
        message: 'Add request forwarded to remote container',
        receivedData: body
      };
      
      console.log('handleAddServer: Returning success response');
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('handleAddServer: Error occurred:', error);
      const errorResponse = {
        success: false,
        error: 'Failed to process add request',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle list servers requests
   */
  private async handleListServers(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      
      // Forward the message to the remote container via WebSocket
      this.mcpProxy.forwardToProxy(JSON.stringify(body));
      
      // Return a success response for now
      // In a real implementation, you might want to wait for a response from the container
      return new Response(JSON.stringify({
        success: true,
        message: 'List request forwarded to remote container',
        data: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to process list request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle delete server requests
   */
  private async handleDeleteServer(request: Request): Promise<Response> {
    console.log('handleDeleteServer: Processing request...');
    try {
      // Read request body
      const body = await request.json();
      console.log('handleDeleteServer: Received body:', JSON.stringify(body, null, 2));
      
      // Forward the message to the remote container via WebSocket
      console.log('handleDeleteServer: Forwarding to proxy...');
      this.mcpProxy.forwardToProxy(JSON.stringify(body));
      
      // Return a success response for now
      const response = {
        success: true,
        message: 'Delete request forwarded to remote container',
        receivedData: body
      };
      
      console.log('handleDeleteServer: Returning success response');
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('handleDeleteServer: Error occurred:', error);
      const errorResponse = {
        success: false,
        error: 'Failed to process delete request',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle status check requests
   */
  private async handleStatus(request: Request): Promise<Response> {
    console.log('handleStatus: Processing request...');
    try {
      // No need to read request body for GET requests
      
      // Check if we have any hibernated WebSocket connections
      const hibernatedSockets = this.ctx.getWebSockets();
      const remoteContainerSockets = hibernatedSockets.filter(ws => {
        const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | null;
        return attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer;
      });
      
      console.log('🔍 Hibernated WebSocket check:', {
        totalSockets: hibernatedSockets.length,
        remoteContainerSockets: remoteContainerSockets.length
      });
      
      // If we have hibernated remote container sockets but no active connection, restore it
      if (remoteContainerSockets.length > 0 && !this.mcpProxy.isConnected()) {
        console.log('🔄 Restoring connection from hibernated WebSocket');
        this.mcpProxy.setProxyConnection(remoteContainerSockets[0]);
      }
      
      // Check if we have an active proxy connection
      const isConnected = this.mcpProxy.isConnected();
      
      const response = {
        success: true,
        connected: isConnected,
        message: isConnected ? 'Remote container is connected' : 'Remote container is not connected',
        timestamp: new Date().toISOString()
      };
      
      console.log('handleStatus: Returning status response:', response);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('handleStatus: Error occurred:', error);
      const errorResponse = {
        success: false,
        connected: false,
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Main fetch handler - adds remote container endpoint, delegates rest to parent
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    console.log(`McpServerProxyDO: ${method} ${path} (full URL: ${url.toString()})`);

    // Process remote container WebSocket upgrade requests
    if (path === REMOTE_CONTAINER_WS_ENDPOINT || path.endsWith(REMOTE_CONTAINER_WS_ENDPOINT)) {
      console.log('Handling WebSocket upgrade request');
      return this.processRemoteContainerConnection(request);
    }

    // Handle add server requests - use exact match
    if (path === '/add-server' && method === 'POST') {
      console.log('Handling add server request - exact match');
      return this.handleAddServer(request);
    }

    // Handle list servers requests - use exact match  
    if (path === '/list-servers' && method === 'POST') {
      console.log('Handling list servers request - exact match');
      return this.handleListServers(request);
    }

    // Handle delete server requests - use exact match
    if (path === '/delete-server' && method === 'POST') {
      console.log('Handling delete server request - exact match');
      return this.handleDeleteServer(request);
    }

    // Handle status check requests - use exact match
    if (path === '/status' && method === 'GET') {
      console.log('Handling status check request - exact match');
      return this.handleStatus(request);
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
      method: method
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 