import { streamText } from 'ai';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { messages, provider, model, ...otherParams } = body;

    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!apiKey) {
      return new Response('API key is required in Authorization header', { status: 400 });
    }

    if (!provider) {
      return new Response('Provider is required', { status: 400 });
    }

    if (!model) {
      return new Response('Model is required', { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Create provider instance with explicit provider type
    const providerInstance = await createProvider(provider, apiKey);

    console.log(`Using ${provider} provider for model: ${model}`);

    const result = await streamText({
      model: providerInstance(model),
      messages,
      temperature: otherParams.temperature,
      maxTokens: otherParams.maxTokens,
      maxSteps: 15,
      toolCallStreaming: true,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response('Invalid API key', { status: 401 });
      }
      if (error.message.includes('model')) {
        return new Response('Invalid model specified', { status: 400 });
      }
      if (error.message.includes('rate')) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
    }
    
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
} 