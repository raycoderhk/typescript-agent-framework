import { McpServerProxyDO } from './server-proxy';

// Export the Durable Object class for deployment
export { McpServerProxyDO };

// Export the handler for deployment
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    console.log('🌐 MCP Proxy Worker:', request.method, url.pathname, url.search);
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Route to the Durable Object
    const id = env.MCP_SERVER_PROXY.idFromName("localhost");
    const proxy = env.MCP_SERVER_PROXY.get(id);
    
    console.log('🔄 Routing to McpServerProxyDO...');
    const response = await proxy.fetch(request);
    console.log('✅ McpServerProxyDO response:', response.status, response.statusText);
    
    return response;
  }
} satisfies ExportedHandler<Env>; 