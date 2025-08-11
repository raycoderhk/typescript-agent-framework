import { AIModelOption } from '@/types/mcp-server';

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  {
    provider: 'openai',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable model, great for complex tasks',
        contextLength: 128000
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster and more affordable than GPT-4o',
        contextLength: 128000
      },
      {
        id: 'o1-preview',
        name: 'o1-preview',
        description: 'Reasoning model for complex problem solving',
        contextLength: 128000
      },
      {
        id: 'o1-mini',
        name: 'o1-mini',
        description: 'Smaller reasoning model, faster responses',
        contextLength: 128000
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous generation flagship model',
        contextLength: 128000
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for simpler tasks',
        contextLength: 16385
      }
    ]
  },
  {
    provider: 'anthropic',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model, best for complex tasks',
        contextLength: 200000
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest model, great for quick tasks',
        contextLength: 200000
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Previous top-tier model, very capable',
        contextLength: 200000
      }
    ]
  }
];

export const DEFAULT_MODEL_CONFIG = {
  openai: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    provider: 'anthropic' as const,
    model: 'claude-3-5-sonnet-20241022',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com'
  }
}; 