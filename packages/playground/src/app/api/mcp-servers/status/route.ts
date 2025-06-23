import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

/**
 * GET /api/mcp-servers/status - Check proxy connection status
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext();

    console.log('Using service binding, calling /status');

    // Send a simple GET request to the proxy status endpoint
    const response = await env.MCP_PROXY.fetch('https://do/status', {
      method: 'GET',
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking MCP proxy status:', error);
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 