import { JSONRPCMessage, Implementation } from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { IMcpServer } from '@xava-labs/mcp/src/mcp/mcp-server-interface';

/**
 * Simple MCP Server Proxy that acts like McpServer but forwards messages to a remote container
 * This implements the minimal IMcpServer interface used by McpServerDO
 * 
 * CONNECTION STATE MANAGEMENT:
 * - isConnected() is the SINGLE SOURCE OF TRUTH for connection state checks
 * - Handles hibernated WebSocket connections properly for Cloudflare Workers
 * - All methods should use isConnected() rather than manual connection checks
 */
export class McpServerProxy implements IMcpServer {
  private proxyConnection: WebSocket | null = null;
  private connectedTransport: Transport | null = null;
  private isProxyConnected = false;
  private lastConnectionTime: number = 0;

  constructor() {
  }

  /**
   * Set the proxy connection to the remote container
   */
  public setProxyConnection(webSocket: WebSocket | null): void {
    if (!webSocket) {
      console.log('🔗 Setting proxy connection to null');
      this.proxyConnection = null;
      this.isProxyConnected = false;
      return;
    }

    console.log('🔗 Setting proxy connection, WebSocket readyState:', webSocket?.readyState);
    this.proxyConnection = webSocket;
    this.isProxyConnected = true;
    this.lastConnectionTime = Date.now();
    
    // Add listeners to track connection state
    webSocket.addEventListener('close', () => {
      console.log('❌ Proxy WebSocket connection closed');
      this.isProxyConnected = false;
      this.proxyConnection = null;
    });
    
    webSocket.addEventListener('error', (error) => {
      console.log('❌ Proxy WebSocket error:', error);
      this.isProxyConnected = false;
    });    
  }

  /**
   * Check if the proxy is currently connected - Single Source of Truth for connection state
   * 
   * IMPORTANT: This is the single source of truth for connection state!
   * All other methods should use this method rather than checking connection state manually.
   * Properly handles hibernated WebSocket connections in Cloudflare Workers.
   */
  public isConnected(): boolean {
    const hasConnection = this.proxyConnection !== null;
    const isMarkedConnected = this.isProxyConnected;
    const readyState = this.proxyConnection?.readyState;
    
    // For hibernated WebSockets in Cloudflare Workers, readyState might not be reliable
    // So we'll primarily rely on our internal tracking, but also check for obviously closed states
    if (this.proxyConnection && (readyState === 3 || readyState === 2) && this.isProxyConnected) {
      console.log('🔄 Updating connection state - WebSocket is CLOSED or CLOSING');
      this.isProxyConnected = false;
    }
    
    // Consider connected if we have a connection object and it's marked as connected
    // and not in a definitely closed state
    const actuallyConnected = hasConnection && isMarkedConnected && readyState !== 3;
    
    // Only log detailed connection info if there's an issue or state change
    if (!actuallyConnected || readyState !== 1) {
      const timeSinceConnection = Date.now() - this.lastConnectionTime;
      console.log('🔍 Connection check (detailed):', {
        hasConnection,
        isMarkedConnected,
        readyState,
        readyStateText: readyState === 0 ? 'CONNECTING' : 
                       readyState === 1 ? 'OPEN' : 
                       readyState === 2 ? 'CLOSING' : 
                       readyState === 3 ? 'CLOSED' : 'UNKNOWN',
        lastConnectionTime: new Date(this.lastConnectionTime).toISOString(),
        timeSinceConnectionMs: timeSinceConnection,
        result: actuallyConnected
      });
    }
    
    return actuallyConnected;
  }

  /**
   * Debug helper to force-log detailed connection state
   * Useful for troubleshooting connection issues
   */
  public debugConnectionState(): void {
    const hasConnection = this.proxyConnection !== null;
    const isMarkedConnected = this.isProxyConnected;
    const readyState = this.proxyConnection?.readyState;
    const timeSinceConnection = Date.now() - this.lastConnectionTime;
    
    console.log('🐛 DEBUG - Full connection state:', {
      hasConnection,
      isMarkedConnected,
      readyState,
      readyStateText: readyState === 0 ? 'CONNECTING' : 
                     readyState === 1 ? 'OPEN' : 
                     readyState === 2 ? 'CLOSING' : 
                     readyState === 3 ? 'CLOSED' : 'UNKNOWN',
      lastConnectionTime: new Date(this.lastConnectionTime).toISOString(),
      timeSinceConnectionMs: timeSinceConnection,
      isConnectedResult: this.isConnected()
    });
  }

  /**
   * Handle messages from the remote container
   */
  public handleProxyMessage(data: string | ArrayBuffer): void {
    try {
      // Handle both string and ArrayBuffer data
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
      console.log('🔄 McpServerProxy handling proxy message:', messageStr.substring(0, 200) + (messageStr.length > 200 ? '...' : ''));
      
      const message = JSON.parse(messageStr) as JSONRPCMessage;
      
      // Forward the message to the connected transport
      if (this.connectedTransport) {
        console.log('📤 Forwarding message to transport:', {
          method: 'method' in message ? message.method : undefined,
          id: 'id' in message ? message.id : undefined,
          hasResult: 'result' in message && !!message.result,
          hasError: 'error' in message && !!message.error
        });
        
        this.connectedTransport.send?.(message).catch((error: unknown) => {
          console.error('❌ Error forwarding message to transport:', error);
        });
      } else {
        console.warn('⚠️ No connected transport to forward message to');
      }
    } catch (error) {
      console.error('❌ Error parsing proxy message:', error);
    }
  }

  /**
   * This is the key method that McpServerDO calls to connect transports
   * We mimic the McpServer.connect() behavior but add our proxy logic
   */
  async connect(transport: Transport): Promise<void> {
    console.log('🔗 McpServerProxy.connect() called - new transport connecting');
    console.log('🔍 Transport type:', transport.constructor.name);
    console.log('🔍 Current proxy connection state:', this.isConnected());
    
    // Boot off the previous transport if one exists
    // if (this.connectedTransport) {
    //   console.log('🔄 New transport connecting, disconnecting previous transport');
      
    //   // Send a notification message to the previous transport before disconnecting
    //   const disconnectMessage: JSONRPCMessage = {
    //     jsonrpc: "2.0",
    //     method: "notifications/cancelled",
    //     params: {
    //       reason: "New client connected, previous connection terminated"
    //     }
    //   };
      
      
    //   this.connectedTransport.send?.(disconnectMessage).catch((error: unknown) => {
    //     console.error('❌ Error sending disconnect message to previous transport:', error);
    //   }).finally(() => {
    //     // Close the previous transport
    //    // this.connectedTransport?.close?.();
    //   });
    // }

    // Set the new transport as the active one
    this.connectedTransport = transport;
    
    try {
      console.log('🚀 Starting transport...');
      await this.connectedTransport.start();
      console.log('✅ Transport started successfully');
    } catch (error) {
      console.error('❌ Failed to start transport:', error);
      throw error;
    }
    
    console.log('🔍 Setting Transport for proxy - transport connected');
    transport.onmessage = (message: JSONRPCMessage) => {
      const isRequest = 'method' in message;
      const isResponse = 'result' in message || 'error' in message;
      
      console.log('📨 Transport onmessage received:', {
        messageType: isRequest ? 'request' : isResponse ? 'response' : 'unknown',
        method: 'method' in message ? message.method : undefined,
        id: 'id' in message ? message.id : undefined,
        hasParams: 'params' in message && !!message.params,
        hasResult: 'result' in message && !!message.result,
        hasError: 'error' in message && !!message.error,
        resultType: 'result' in message ? typeof message.result : undefined
      });
      
      console.log('📤 Forwarding complete message to proxy:', JSON.stringify(message).substring(0, 200) + '...');
      this.forwardToProxy(JSON.stringify(message));
    };
    
    // Add error handling for the transport
    transport.onerror = (error: unknown) => {
      console.error('❌ Transport error:', error);
    };
    
    transport.onclose = () => {
      console.log('🔌 Transport closed');
      this.connectedTransport = null;
    };
    
    console.log('✅ Transport setup complete for proxy');
  }

  /**
   * Forward a message to the remote proxy
   */
  public forwardToProxy(data: string | ArrayBuffer): void {
    const messagePreview = typeof data === 'string' ? data.substring(0, 200) + (data.length > 200 ? '...' : '') : '[Binary Data]';
    console.log('📤 Attempting to forward message to proxy:', messagePreview);
    
    // Use the single source of truth for connection checking
    const isConnected = this.isConnected();
    console.log('🔍 Connection status from isConnected():', isConnected);
    console.log('🔍 Proxy connection details:', {
      hasProxyConnection: !!this.proxyConnection,
      readyState: this.proxyConnection?.readyState,
      readyStateText: this.proxyConnection?.readyState === 0 ? 'CONNECTING' : 
                     this.proxyConnection?.readyState === 1 ? 'OPEN' : 
                     this.proxyConnection?.readyState === 2 ? 'CLOSING' : 
                     this.proxyConnection?.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
    });
    
    if (isConnected && this.proxyConnection) {
      try {
        console.log('✅ Sending message to proxy WebSocket');
        this.proxyConnection.send(data);
        console.log('✅ Message sent successfully to proxy');
      } catch (error) {
        console.error('❌ Error sending message to proxy:', error);
        // If sending fails, update our connection state
        this.isProxyConnected = false;
      }
    } else {
      console.warn('❌ Cannot forward message - proxy not connected:', messagePreview);
      this.debugConnectionState();
    }
  }
} 