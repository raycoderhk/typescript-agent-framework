import { McpServerProxyDO } from './server-proxy';

// Export the Durable Object class for deployment
export { McpServerProxyDO };

// Export the handler for deployment
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Extract proxyId from search parameters
    const proxyId = url.searchParams.get('proxyId');
    
    if (!proxyId) {
      return new Response(JSON.stringify({
        error: 'Missing proxyId parameter',
        message: 'Please provide a proxyId in the URL search parameters',
        example: `${url.origin}${url.pathname}?proxyId=your-uuid-here`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Route to the Durable Object using proxyId as the name
    const id = env.MCP_SERVER_PROXY.idFromName(proxyId);
    const proxy = env.MCP_SERVER_PROXY.get(id);
    
    return proxy.fetch(request);
  }
} satisfies ExportedHandler<Env>; 