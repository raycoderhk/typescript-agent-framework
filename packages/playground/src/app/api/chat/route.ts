import { streamText, experimental_createMCPClient as createMCPClient } from 'ai';
import { NextRequest } from 'next/server';

interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  systemPrompt?: string;
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

// Global MCP client instance
let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

// Function to get or create MCP client using AI SDK's built-in support
async function getMCPClient() {
  // If client exists but is closed, reset it
  if (mcpClient) {
    try {
      // Try to use the client to check if it's still alive
      await mcpClient.tools();
    } catch {
      console.log('MCP client is closed, creating new one...');
      mcpClient = null;
    }
  }
  
  if (!mcpClient) {
    // Use the built-in SSE transport from AI SDK
    mcpClient = await createMCPClient({
      transport: {
        type: 'sse',
        url: 'http://localhost:6050/sse?sessionId=localhost',
        // Optional headers for authentication
        headers: {}
      }
    });
  }
  
  return mcpClient;
}

export async function POST(request: NextRequest) {
  let body: ChatRequest | null = null;
  
  try {
    body = await request.json();
    
    if (!body) {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { messages, provider, model, ...otherParams } = body;

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

    // Get MCP client and tools
    const client = await getMCPClient();
    
    // Get tools from MCP client - the AI SDK handles all the transformation
    const mcpTools = await client.tools();

    const result = streamText({
      model: providerInstance(model),
      system: otherParams.systemPrompt,
      messages,
      temperature: otherParams.temperature,
      maxTokens: otherParams.maxTokens,
      maxSteps: otherParams.maxSteps || 10,
      // Include MCP tools if available and model supports tools
      tools: mcpTools,
      // Don't close the client - keep it alive for reuse
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // If there's a critical error with the MCP client, reset it
    if (error instanceof Error && error.message.includes('closed client')) {
      console.error('MCP client error detected, resetting client...');
      mcpClient = null;
    }
    
    // Check for specific AI SDK errors
    if (error instanceof Error) {
      console.error('Chat API error:', error.message);
      
      // Return more specific error response
      return Response.json(
        { 
          error: 'AI SDK Error', 
          details: error.message,
          errorType: error.name || 'MCPClientError'
        },
        { status: 500 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 