import { McpServerProxyDO } from '@xava-labs/mcp';

// Export the Durable Object class for deployment
export { McpServerProxyDO };

// Export the handler for deployment
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Route to the Durable Object
    const id = env.MCP_SERVER_PROXY.idFromName("localhost");
    const proxy = env.MCP_SERVER_PROXY.get(id);
    return proxy.fetch(request);
  }
} satisfies ExportedHandler<Env>; 