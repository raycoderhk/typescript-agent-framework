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
    console.log('🔧 Creating new MCP Client using AI SDK...');
    
    // Use the built-in SSE transport from AI SDK
    mcpClient = await createMCPClient({
      transport: {
        type: 'sse',
        url: 'http://localhost:6050/sse?sessionId=localhost',
        // Optional headers for authentication
        headers: {}
      }
    });
    
    console.log('✅ MCP Client created successfully');
  }
  
  return mcpClient;
}

export async function POST(request: NextRequest) {
  let body: ChatRequest | null = null;
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
  
  try {
    console.log('🚀 Starting chat request...');
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

    console.log('🤖 Creating provider:', provider, model);
    // Create the provider
    const providerInstance = await createProvider(provider, apiKey);

    console.log('🔧 Getting MCP client and tools...');
    // Get MCP client and tools
    mcpClient = await getMCPClient();
    
    // Get tools from MCP client - the AI SDK handles all the transformation
    console.log('📋 Getting tools from MCP client...');
    const mcpTools = await mcpClient.tools();
    
    console.log('🎯 MCP tools loaded:', {
      toolCount: Object.keys(mcpTools).length,
      toolNames: Object.keys(mcpTools)
    });

    // Debug: Log the messages being sent to the AI
    console.log('📨 Messages being sent to AI:', JSON.stringify(messages, null, 2));
    console.log('📨 Message count:', messages.length);
    console.log('📨 Last message:', messages[messages.length - 1]);

    // Determine if we should force tool usage
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
    
    console.log('🔍 Tool choice analysis:', {
      lastMessage: lastMessage.substring(0, 100),
      shouldForceCloudflareSearch,
      cloudflareToolName,
      willUseToolChoice: shouldForceCloudflareSearch && cloudflareToolName
    });

    console.log('🚀 About to call streamText...');
    console.log('🔍 Model configuration:', {
      provider,
      model,
      providerInstance: typeof providerInstance(model),
      modelName: model,
      hasTools: Object.keys(mcpTools).length > 0,
      toolCount: Object.keys(mcpTools).length,
      isO1Model: model.includes('o1'),
      modelSupportsTools: !model.includes('o1') // o1 models don't support tools
    });
    
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
      onStepFinish: (step) => {
        console.log('🔍 Step finish:', {
          stepType: step.stepType,
          text: step.text,
          toolCalls: step.toolCalls?.length || 0,
          toolResults: step.toolResults?.length || 0,
          finishReason: step.finishReason,
          usage: step.usage,
          warnings: step.warnings
        });
        
        // Log tool calls in detail if they exist
        if (step.toolCalls && step.toolCalls.length > 0) {
          console.log('🔧 Tool calls in step:', step.toolCalls.map(tc => ({
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args
          })));
        }
        
        // Log tool results in detail if they exist
        if (step.toolResults && step.toolResults.length > 0) {
          console.log('🔧 Tool results in step:', step.toolResults.length, 'results');
          console.log('🔧 Tool results details:', JSON.stringify(step.toolResults, null, 2));
        }
      },
      onFinish: async (result) => {
        console.log('🏁 Final result:', {
          finishReason: result.finishReason,
          usage: result.usage,
          toolCalls: result.toolCalls?.length || 0,
          steps: result.steps?.length || 0,
          warnings: result.warnings
        });
        
        // Log tool calls in detail if they exist
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log('🔧 Final tool calls:', result.toolCalls.map(tc => ({
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args
          })));
        }
        
        // Log steps in detail if they exist
        if (result.steps && result.steps.length > 0) {
          console.log('📊 Final steps:', result.steps.map(step => ({
            stepType: step.stepType,
            text: step.text?.substring(0, 100) + '...',
            toolCalls: step.toolCalls?.length || 0,
            finishReason: step.finishReason
          })));
        }
        
        // Close the MCP client when the response is finished
        console.log('🔒 Closing MCP client...');
        try {
          await mcpClient?.close();
          console.log('✅ MCP client closed successfully');
        } catch (error) {
          console.error('❌ Error closing MCP client:', error);
        }
      }
    });

    console.log('✅ streamText call completed successfully');
    console.log('🔍 Result type:', typeof result);
    console.log('🔍 Result properties:', Object.getOwnPropertyNames(result));

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('❌ Chat API error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    });
    
    // Close MCP client on error
    try {
      await mcpClient?.close();
    } catch (closeError) {
      console.error('Error closing MCP client:', closeError);
    }
    
    // Check for specific AI SDK errors
    if (error instanceof Error) {
      // Log the full error object
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Check if it's a tool-related error
      if (error.message.includes('tool') || error.message.includes('Tool')) {
        console.error('⚠️ This appears to be a tool-related error');
      }
      
      // Check if it's a model-related error
      if (error.message.includes('model') || error.message.includes('Model')) {
        console.error('⚠️ This appears to be a model-related error');
        // Only log body details if body is not null
        if (body) {
          console.error('🔍 Model:', body.model);
          console.error('🔍 Provider:', body.provider);
        }
      }
      
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