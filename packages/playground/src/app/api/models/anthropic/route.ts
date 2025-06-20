import { NextRequest, NextResponse } from 'next/server';

interface AnthropicModel {
  id: string;
  display_name: string;
  created_at: string;
  type: string;
}

interface AnthropicModelsResponse {
  data: AnthropicModel[];
  first_id?: string;
  has_more: boolean;
  last_id?: string;
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' }, 
      { status: 401 }
    );
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json() as AnthropicModelsResponse;
    
    const models = data.data.map((model) => ({
      id: model.id,
      name: model.display_name || model.id
    }));

    return NextResponse.json({ data: models });
    
  } catch (error) {
    console.error('Anthropic models fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 