import { AIModelOption } from '@/types/mcp-server';
import { AI_MODEL_OPTIONS } from '@/data/ai-models';

// API response interfaces
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

// Model validation and sync utilities
export interface ModelValidationResult {
  provider: string;
  modelId: string;
  available: boolean;
  lastChecked: string;
  error?: string;
}

// Cache model validation results in localStorage
const MODEL_VALIDATION_CACHE_KEY = 'playground-model-validation';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedModelValidation(): ModelValidationResult[] {
  try {
    const cached = localStorage.getItem(MODEL_VALIDATION_CACHE_KEY);
    if (!cached) return [];
    
    const data = JSON.parse(cached);
    const now = Date.now();
    
    // Filter out expired cache entries
    return data.filter((result: ModelValidationResult) => {
      const lastChecked = new Date(result.lastChecked).getTime();
      return (now - lastChecked) < CACHE_DURATION;
    });
  } catch (error) {
    console.error('Failed to load cached model validation:', error);
    return [];
  }
}

export function setCachedModelValidation(results: ModelValidationResult[]): void {
  try {
    localStorage.setItem(MODEL_VALIDATION_CACHE_KEY, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to cache model validation:', error);
  }
}

// Validate OpenAI models using their API
export async function validateOpenAIModels(apiKey: string): Promise<ModelValidationResult[]> {
  const results: ModelValidationResult[] = [];
  const now = new Date().toISOString();
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json() as OpenAIModelsResponse;
    const availableModelIds = new Set(data.data?.map((model) => model.id) || []);
    
    // Check our hardcoded models against what's actually available
    const openaiProvider = AI_MODEL_OPTIONS.find(p => p.provider === 'openai');
    if (openaiProvider) {
      for (const model of openaiProvider.models) {
        results.push({
          provider: 'openai',
          modelId: model.id,
          available: availableModelIds.has(model.id),
          lastChecked: now,
        });
      }
    }
  } catch (error) {
    console.error('Failed to validate OpenAI models:', error);
    // Return all as unavailable on error
    const openaiProvider = AI_MODEL_OPTIONS.find(p => p.provider === 'openai');
    if (openaiProvider) {
      for (const model of openaiProvider.models) {
        results.push({
          provider: 'openai',
          modelId: model.id,
          available: false,
          lastChecked: now,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  return results;
}

// Validate Anthropic models using their API
export async function validateAnthropicModels(apiKey: string): Promise<ModelValidationResult[]> {
  const results: ModelValidationResult[] = [];
  const now = new Date().toISOString();
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json() as AnthropicModelsResponse;
    const availableModelIds = new Set(data.data?.map((model) => model.id) || []);
    
    // Check our hardcoded models against what's actually available
    const anthropicProvider = AI_MODEL_OPTIONS.find(p => p.provider === 'anthropic');
    if (anthropicProvider) {
      for (const model of anthropicProvider.models) {
        results.push({
          provider: 'anthropic',
          modelId: model.id,
          available: availableModelIds.has(model.id),
          lastChecked: now,
        });
      }
    }
  } catch (error) {
    console.error('Failed to validate Anthropic models:', error);
    // Return all as unavailable on error
    const anthropicProvider = AI_MODEL_OPTIONS.find(p => p.provider === 'anthropic');
    if (anthropicProvider) {
      for (const model of anthropicProvider.models) {
        results.push({
          provider: 'anthropic',
          modelId: model.id,
          available: false,
          lastChecked: now,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  return results;
}

// Get enriched model options with availability status
export function getEnrichedModelOptions(validationResults?: ModelValidationResult[]): AIModelOption[] {
  if (!validationResults || validationResults.length === 0) {
    return AI_MODEL_OPTIONS;
  }
  
  const validationMap = new Map(
    validationResults.map(result => [`${result.provider}:${result.modelId}`, result])
  );
  
  return AI_MODEL_OPTIONS.map(provider => ({
    ...provider,
    models: provider.models.map(model => {
      const validation = validationMap.get(`${provider.provider}:${model.id}`);
      return {
        ...model,
        available: validation?.available ?? true,
        lastValidated: validation?.lastChecked,
        validationError: validation?.error,
      };
    }),
  }));
}

// Background sync function (call this when API keys are updated)
export async function syncModelAvailability(
  openaiApiKey?: string, 
  anthropicApiKey?: string
): Promise<ModelValidationResult[]> {
  const allResults: ModelValidationResult[] = [];
  
  if (openaiApiKey) {
    const openaiResults = await validateOpenAIModels(openaiApiKey);
    allResults.push(...openaiResults);
  }
  
  if (anthropicApiKey) {
    const anthropicResults = await validateAnthropicModels(anthropicApiKey);
    allResults.push(...anthropicResults);
  }
  
  // Cache the results
  setCachedModelValidation([...getCachedModelValidation(), ...allResults]);
  
  return allResults;
} 