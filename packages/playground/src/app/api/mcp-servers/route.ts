import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

interface Env {
  MCP_SERVER_PROXY: DurableObjectNamespace;
}

interface AddMcpServerRequest {
  uniqueName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface McpServerMessage {
  verb: 'add' | 'delete' | 'list';
  data?: {
    'unique-name': string;
    command: string;
    args: string[];
    env: Record<string, string>;
  };
}

/**
 * POST /api/mcp-servers - Add a new MCP server
 * GET /api/mcp-servers - List all MCP servers
 */

export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext() as { env: Env };
    const body = await request.json() as AddMcpServerRequest;
    
    // Validate request body
    if (!body.uniqueName || !body.command) {
      return NextResponse.json(
        { success: false, error: 'uniqueName and command are required' },
        { status: 400 }
      );
    }

    // Create DO ID for this operation (using a consistent name for singleton behavior)
    const id = env.MCP_SERVER_PROXY.idFromName('localhost');
    const stub = env.MCP_SERVER_PROXY.get(id);

    // Prepare the message payload for the server
    const message: McpServerMessage = {
      verb: 'add',
      data: {
        'unique-name': body.uniqueName,
        command: body.command,
        args: body.args || [],
        env: body.env || {}
      }
    };

    console.log('Using DO stub, calling /add-server');
    console.log('Message payload:', message);

    // Send the add message to the proxy via POST request
    const response = await stub.fetch('https://stub/add-server', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding MCP server:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { env } = getCloudflareContext() as { env: Env };
    
    // Create DO ID for this operation
    const id = env.MCP_SERVER_PROXY.idFromName('localhost');
    const stub = env.MCP_SERVER_PROXY.get(id);

    // Prepare the list message
    const message: McpServerMessage = {
      verb: 'list'
    };

    console.log('Using DO stub, calling /list-servers');

    // Send the list message to the proxy via POST request
    const response = await stub.fetch('https://stub/list-servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 