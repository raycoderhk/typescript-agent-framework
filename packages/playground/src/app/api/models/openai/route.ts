import { NextRequest, NextResponse } from 'next/server';

interface OpenAIModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' }, 
      { status: 401 }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json() as OpenAIModelsResponse;
    
    // Filter to only chat models (curated list of working models)
    const chatModelIds = new Set([
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
      'o1-preview', 'o1-mini', 'gpt-4-turbo-preview', 'gpt-4-0125-preview',
      'chatgpt-4o-latest'
    ]);
    
    const filteredModels = data.data
      .filter((model) => chatModelIds.has(model.id))
      .map((model) => ({
        id: model.id,
        name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      }));

    return NextResponse.json({ data: filteredModels });
    
  } catch (error) {
    console.error('OpenAI models fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 