import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}


// Helper function to forward requests to the external Durable Object
async function forwardToDurableObject(request: NextRequest, params: RouteParams['params']) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    // Get the Durable Object instance
    const objectId = env.MCP_SERVER_PROXY.idFromName(id);
    const durableObject = env.MCP_SERVER_PROXY.get(objectId);
    
    // Forward the request to the Durable Object
    return await durableObject.fetch(request);
  } catch (error) {
    console.error('Error forwarding to Durable Object:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to forward request to MCP Server Proxy',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
// Handle POST requests (MCP JSON-RPC calls)
export async function POST(request: NextRequest, { params }: RouteParams) {
  return forwardToDurableObject(request, params);
}