import { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerDO, MCP_SUBPROTOCOL } from "./server";
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
    // Verify the Upgrade header is present and is WebSocket
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected Upgrade: websocket', {
        status: 426,
      });
    }

    // Check for 'mcp' subprotocol
    const protocols = request.headers.get('Sec-WebSocket-Protocol');
    const acceptProtocol = protocols?.split(',').map(p => p.trim()).includes(MCP_SUBPROTOCOL);
    if (!acceptProtocol) {
      return new Response('Expected Sec-WebSocket-Protocol: mcp', {
        status: 426,
      });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Store marker that this is a remote container connection
    server.serializeAttachment({ isRemoteContainer: true } as RemoteContainerAttachment);

    // Accept WebSocket with hibernation support
    this.ctx.acceptWebSocket(server);

    // Set this as the proxy connection
    this.mcpProxy.setProxyConnection(server);

    // Return the client end of the WebSocket with the MCP subprotocol
    const headers = new Headers();
    headers.set('Sec-WebSocket-Protocol', MCP_SUBPROTOCOL);

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers,
    });
  }

  /**
   * Override webSocketMessage to handle message forwarding
   */
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as RemoteContainerAttachment | { sessionId: string } | null;
    
    // Check if this is a remote container connection
    if (attachment && 'isRemoteContainer' in attachment && attachment.isRemoteContainer) {
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
      console.log('Remote container disconnected');
      return;
    }
    
    // Delegate to parent for regular client handling
    return super.webSocketClose(ws, code, reason, wasClean);
  }

  /**
   * Main fetch handler - adds remote container endpoint, delegates rest to parent
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Process remote container WebSocket upgrade requests
    if (path.endsWith(REMOTE_CONTAINER_WS_ENDPOINT)) {
      return this.processRemoteContainerConnection(request);
    }

    // Delegate everything else to the parent McpServerDO
    return super.fetch(request);
  }
} 