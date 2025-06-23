import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest } from 'next/server';


/**
 * GET /api/remote-container/ws - Forward WebSocket upgrade requests to mcp-proxy
 */
export async function GET(request: NextRequest) {
    console.log('GET /api/remote-container/ws');
  try {
    const { env } = getCloudflareContext();
    
    // Forward the request to the mcp-proxy service
    // The mcp-proxy service should handle the /remote-container/ws endpoint
    const response = await env.MCP_PROXY.fetch(new Request(
      `${request.url.replace('/api/remote-container/ws', '/remote-container/ws')}`,
      {
        method: request.method,
        headers: request.headers,
        // Forward any WebSocket upgrade headers
      }
    ));

    return response;
  } catch (error) {
    console.error('Error forwarding to mcp-proxy:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 