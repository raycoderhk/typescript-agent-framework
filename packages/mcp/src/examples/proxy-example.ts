import { McpServerProxyDO } from '../mcp/server-proxy';
import { Implementation } from '@modelcontextprotocol/sdk/types.js';

/**
 * Example MCP Server Proxy implementation
 * This demonstrates how to extend McpServerProxyDO to create a proxy server
 * that can forward MCP messages to a remote container
 */
export class ExampleMcpServerProxy extends McpServerProxyDO {
  
  /**
   * Provide implementation details for this MCP server proxy
   */
  getImplementation(): Implementation {
    return {
      name: 'ExampleMcpServerProxy',
      version: '1.0.0',
      vendor: 'Example Corp'
    };
  }
}

/**
 * Example usage:
 * 
 * 1. Deploy this as a Durable Object:
 *    - Add binding in wrangler.jsonc:
 *      "durable_objects": {
 *        "bindings": [
 *          {
 *            "name": "EXAMPLE_MCP_PROXY",
 *            "class_name": "ExampleMcpServerProxy"
 *          }
 *        ]
 *      }
 * 
 * 2. Clean interface-based approach:
 *    - Uses IMcpServer interface that extracts only methods McpServerDO needs
 *    - McpServerProxy implements IMcpServer interface
 *    - McpServerDO constructor accepts IMcpServer instead of concrete McpServer
 *    - Extends McpServerDO (reuses all existing transport logic)
 *    - Only adds the /remote-container/ws endpoint
 *    - All SSE and WebSocket client handling is inherited from parent
 * 
 * 3. Access the proxy endpoints:
 *    - Regular MCP clients connect to: /ws or /sse (handled by parent McpServerDO)
 *    - Remote containers connect to: /remote-container/ws (new endpoint)
 * 
 * 4. Message flow:
 *    - Client → McpServerDO (transport) → McpServerProxy → Remote Container
 *    - Remote Container → McpServerProxyDO → McpServerProxy → Client (transport)
 * 
 * 5. Single client connection policy:
 *    - Only ONE transport can be connected at a time
 *    - When a new client connects, the previous client receives a disconnect notification
 *    - Previous client is automatically disconnected to make room for the new one
 *    - Console logs will show when clients are being replaced
 * 
 * 6. WebSocket upgrade for remote containers:
 *    - URL: wss://your-worker.your-subdomain.workers.dev/remote-container/ws
 *    - Protocol: mcp
 *    - Headers: Sec-WebSocket-Protocol: mcp
 */

// Export the handler for deployment
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Route to the Durable Object
    const id = env.EXAMPLE_MCP_PROXY.newUniqueId();
    const proxy = env.EXAMPLE_MCP_PROXY.get(id);
    return proxy.fetch(request);
  }
} satisfies ExportedHandler; 