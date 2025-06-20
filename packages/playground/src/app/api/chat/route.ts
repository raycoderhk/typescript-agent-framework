import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { MCPClientManager } from 'agents/mcp/client';

interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  mcpProxyId?: string; // Optional MCP proxy session ID
}

// Dynamic provider factory with dynamic imports
async function createProvider(provider: 'openai' | 'anthropic', apiKey: string) {
  switch (provider) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey });
    }
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey });
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Global MCP client manager instance
let mcpClientManager: MCPClientManager | null = null;

// Function to get or create MCP client manager
function getMCPClientManager(): MCPClientManager {
  if (!mcpClientManager) {
    mcpClientManager = new MCPClientManager('playground-chat', '1.0.0');
    mcpClientManager.connect("http://localhost:8787/sse?sessionId=localhost")
  }
  return mcpClientManager;
}

// Function to connect to MCP server
async function connectToMCPServer(proxyId: string, mcpProxyUrl: string): Promise<string | null> {
  try {
    const manager = getMCPClientManager();
    
    // Use SSE endpoint for MCP connection (not WebSocket)
    // The MCPClientManager expects SSE transport
    const sseUrl = new URL(mcpProxyUrl);
    // Use the /sse endpoint for MCP connections
    sseUrl.pathname = '/sse';
    // Add sessionId parameter for the MCP connection
    sseUrl.searchParams.set('sessionId', proxyId);
    
    console.log(`Connecting to MCP server for proxy ID: ${proxyId}, URL: ${sseUrl.toString()}`);
    
    // Connect to the MCP server using the manager
    const { id } = await manager.connect(sseUrl.toString());
    console.log(`MCP server connected successfully with ID: ${id}`);
    
    return id;
  } catch (error) {
    console.error('Failed to connect to MCP server:', error);
    // Don't throw - just return null so the chat can continue without MCP
    return null;
  }
}

// Function to get MCP tools from the manager
async function getMCPTools() {
  try {
    const manager = getMCPClientManager();
    
    // Get AI SDK compatible tools from the manager
    const tools = manager.unstable_getAITools();
    console.log('Available MCP tools:', Object.keys(tools));
    
    return tools;
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, provider, model, mcpProxyId, ...otherParams } = body;

    // Get API key from Authorization header instead of environment variables
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return Response.json(
        { error: 'API key required in Authorization header' },
        { status: 401 }
      );
    }

    // Create the provider
    const providerInstance = await createProvider(provider, apiKey);

    // Figure out proxy id later, for now just use localhost
    // Connect to MCP server if proxy ID is provided
    
    // Get MCP tools if connected
    const mcpTools = await getMCPTools();

    const result = await streamText({
      model: providerInstance(model),
      messages,
      temperature: otherParams.temperature,
      maxTokens: otherParams.maxTokens,
      maxSteps: 15,
      toolCallStreaming: true,
      // Include MCP tools if available
      tools: Object.keys(mcpTools).length > 0 ? mcpTools : undefined,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 