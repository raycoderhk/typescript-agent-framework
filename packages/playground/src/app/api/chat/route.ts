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
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
  
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
    mcpClient = await getMCPClient();
    
    // Get tools from MCP client - the AI SDK handles all the transformation
    const mcpTools = await mcpClient.tools();

    // Determine if we should force tool usage for Cloudflare questions
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const shouldForceCloudflareSearch = lastMessage.includes('cloudflare') || 
                                       lastMessage.includes('vectorize') ||
                                       lastMessage.includes('workers') ||
                                       lastMessage.includes('pages') ||
                                       lastMessage.includes('r2') ||
                                       lastMessage.includes('kv') ||
                                       lastMessage.includes('d1') ||
                                       lastMessage.includes('durable');
    
    const cloudflareToolName = Object.keys(mcpTools).find(name => name.includes('search_cloudflare_documentation'));
    
    const result = streamText({
      model: providerInstance(model),
      system: `You are a helpful assistant with access to specialized tools. 

CRITICAL INSTRUCTIONS:
1. You MUST use the search_cloudflare_documentation tool for ANY question about Cloudflare products
2. The user just asked about "vectorize" - this is Cloudflare Vectorize, so you MUST use the tool
3. NEVER answer Cloudflare questions without using the tool first
4. If you see keywords like: Workers, Pages, R2, KV, D1, Durable Objects, Vectorize, AI - USE THE TOOL

Available tools:
- cloudflare-docs-vectorize__search_cloudflare_documentation: REQUIRED for Cloudflare questions
- figma-context-mcp__get_figma_data: For Figma file analysis  
- figma-context-mcp__download_figma_images: For downloading Figma assets

EXAMPLE: If user asks "what is vectorize?" you must call search_cloudflare_documentation with query "vectorize".`,
      messages,
      temperature: otherParams.temperature,
      maxTokens: otherParams.maxTokens,
      maxSteps: 15,
      // Force tool usage for Cloudflare questions
      toolChoice: shouldForceCloudflareSearch && cloudflareToolName ? { type: 'tool' as const, toolName: cloudflareToolName } : undefined,
      // Include MCP tools if available and model supports tools
      tools: (Object.keys(mcpTools).length > 0 && !model.includes('o1')) ? mcpTools : undefined,
      onFinish: async () => {
        // Close the MCP client when the response is finished
        try {
          await mcpClient?.close();
        } catch (error) {
          console.error('Error closing MCP client:', error);
        }
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Close MCP client on error
    try {
      await mcpClient?.close();
    } catch (closeError) {
      console.error('Error closing MCP client:', closeError);
    }
    
    // Check for specific AI SDK errors
    if (error instanceof Error) {
      console.error('Chat API error:', error.message);
      
      // Return more specific error response
      return Response.json(
        { 
          error: 'AI SDK Error', 
          details: error.message,
          errorType: error.name
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