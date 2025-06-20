// MCP package export file
// Force version to 0.1.0 for MCP
export * from './mcp/server.js'
export * from './mcp/hono-server.js'
export * from './mcp/sse-transport.js'
// export * from './mcp/interfaces.js'  // This file doesn't exist
export * from './mcp/websocket-transport.js';
// transport-factory removed - using direct imports
export * from './mcp/mcp-server-interface.js';
export * from './mcp/mcp-server-proxy.js';
export * from './mcp/server-proxy.js';

// Export the McpHonoServerDO class
export { McpHonoServerDO } from './mcp/hono-server';
export { McpServerDO } from './mcp/server';
export { McpServerProxyDO } from './mcp/server-proxy';
export { McpServerProxy } from './mcp/mcp-server-proxy';

// Default worker export for the proxy functionality
interface Env {
  MCP_SERVER_PROXY: DurableObjectNamespace<import('./mcp/server-proxy').McpServerProxyDO>;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response('MCP Proxy Worker - Use Durable Object bindings to access proxy functionality', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} satisfies ExportedHandler<Env>; 