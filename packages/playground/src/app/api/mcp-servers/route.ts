import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';


interface AddMcpServerRequest {
  uniqueName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface McpServerMessage {
  verb: 'add' | 'delete' | 'list' | 'status';
  data?: {
    'unique-name': string;
    command: string;
    args: string[];
    env: Record<string, string>;
  };
}

interface DeleteMcpServerRequest {
  uniqueName: string;
}





/**
 * POST /api/mcp-servers - Add a new MCP server
 * GET /api/mcp-servers - List all MCP servers  
 * DELETE /api/mcp-servers - Remove an MCP server
 */

export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const body = await request.json() as AddMcpServerRequest;
    
    // Validate request body
    if (!body.uniqueName || !body.command) {
      return NextResponse.json(
        { success: false, error: 'uniqueName and command are required' },
        { status: 400 }
      );
    }

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

    console.log('Using service binding, calling /add-server');
    console.log('Message payload:', message);

    // Send the add message to the proxy via service binding
    const response = await env.MCP_PROXY.fetch('https://do/add-server', {
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
    const { env } = getCloudflareContext();

    // Prepare the list message
    const message: McpServerMessage = {
      verb: 'list'
    };

    console.log('Using service binding, calling /list-servers');

    // Send the list message to the proxy via service binding
    const response = await env.MCP_PROXY.fetch('https://do/list-servers', {
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

export async function DELETE(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const body = await request.json() as DeleteMcpServerRequest;
    
    // Validate request body
    if (!body.uniqueName) {
      return NextResponse.json(
        { success: false, error: 'uniqueName is required' },
        { status: 400 }
      );
    }

    // Prepare the message payload for the server
    const message: McpServerMessage = {
      verb: 'delete',
      data: {
        'unique-name': body.uniqueName,
        command: '', // Not needed for delete
        args: [],
        env: {}
      }
    };

    console.log('Using service binding, calling /delete-server');
    console.log('Message payload:', message);

    // Send the delete message to the proxy via service binding
    const response = await env.MCP_PROXY.fetch('https://do/delete-server', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting MCP server:', error);
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

 