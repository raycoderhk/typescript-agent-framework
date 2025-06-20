import { JSONRPCMessage, Implementation } from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { IMcpServer } from './mcp-server-interface';

/**
 * Simple MCP Server Proxy that acts like McpServer but forwards messages to a remote container
 * This implements the minimal IMcpServer interface used by McpServerDO
 */
export class McpServerProxy implements IMcpServer {
  private proxyConnection: WebSocket | null = null;
  private connectedTransport: Transport | null = null;
  private isProxyConnected = false;

  constructor() {
  }

  /**
   * Set the proxy connection to the remote container
   */
  public setProxyConnection(webSocket: WebSocket): void {
    this.proxyConnection = webSocket;
    this.isProxyConnected = true;
  }

  /**
   * Handle messages from the remote container
   */
  public handleProxyMessage(data: string | ArrayBuffer): void {
    try {
      // Handle both string and ArrayBuffer data
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const message = JSON.parse(messageStr) as JSONRPCMessage;
      
      // Forward the message to the connected transport
      if (this.connectedTransport) {
        this.connectedTransport.send?.(message).catch((error: unknown) => {
          console.error('Error forwarding message to transport:', error);
        });
      }
    } catch (error) {
      console.error('Error parsing proxy message:', error);
    }
  }

  /**
   * This is the key method that McpServerDO calls to connect transports
   * We mimic the McpServer.connect() behavior but add our proxy logic
   */
  async connect(transport: Transport): Promise<void> {
    // Boot off the previous transport if one exists
    if (this.connectedTransport) {
      console.log('New transport connecting, disconnecting previous transport');
      
      // Send a notification message to the previous transport before disconnecting
      const disconnectMessage: JSONRPCMessage = {
        jsonrpc: "2.0",
        method: "notifications/cancelled",
        params: {
          reason: "New client connected, previous connection terminated"
        }
      };
      
      this.connectedTransport.send?.(disconnectMessage).catch((error: unknown) => {
        console.error('Error sending disconnect message to previous transport:', error);
      }).finally(() => {
        // Close the previous transport
        this.connectedTransport?.close?.();
      });
    }

    // Set the new transport as the active one
    this.connectedTransport = transport;
    
    transport.onmessage = (message: JSONRPCMessage) => {
      this.forwardToProxy(JSON.stringify(message));
    };
  }

  /**
   * Forward a` message to the remote proxy
   */
  private forwardToProxy(data: string | ArrayBuffer): void {
    if (this.isProxyConnected && this.proxyConnection) {
      try {
        this.proxyConnection.send(data);
      } catch (error) {
        console.error('Error sending message to proxy:', error);
      }
    } else {
      console.warn('Cannot forward message - proxy not connected:', data);
    }
  }
} 