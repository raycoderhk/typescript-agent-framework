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
  }
  return mcpClientManager;
}

// Function to connect to MCP server
async function connectToMCPServer(proxyId: string, baseUrl: string): Promise<string | null> {
  try {
    const manager = getMCPClientManager();
    
    // Convert HTTP URL to WebSocket URL for MCP connection
    const wsUrl = new URL(`/api/mcp-proxy/${proxyId}`, baseUrl);
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');
    
    console.log(`Connecting to MCP server for proxy ID: ${proxyId}, URL: ${wsUrl.toString()}`);
    
    // Connect to the MCP server using the manager
    const { id } = await manager.connect(wsUrl.toString());
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

    // Get environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    // Validate API key
    const apiKey = provider === 'openai' ? openaiApiKey : anthropicApiKey;
    if (!apiKey) {
      return Response.json(
        { error: `${provider.toUpperCase()}_API_KEY is not configured` },
        { status: 400 }
      );
    }

    // Create the provider
    const providerInstance = await createProvider(provider, apiKey);

    // Connect to MCP server if proxy ID is provided
    let mcpServerId: string | null = null;
    if (mcpProxyId) {
      const baseUrl = new URL(request.url).origin;
      mcpServerId = await connectToMCPServer(mcpProxyId, baseUrl);
    }

    // Get MCP tools if connected
    const mcpTools = mcpServerId ? await getMCPTools() : {};

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