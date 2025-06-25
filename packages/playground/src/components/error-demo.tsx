import React from 'react';
import { ChatMessage } from './chat/chat-message';

export function ErrorDemo() {
  const tokenLimitError = {
    error: 'Token limit exceeded',
    userMessage: "Your conversation is too long for this model. You're using 210147 tokens, but the maximum is 20000.",
    errorType: 'TOKEN_LIMIT_EXCEEDED',
    details: '[Error: AI_APICallError]: prompt is too long: 210147 tokens > 20000 maximum',
    suggestions: [
      'Try starting a new conversation',
      'Use a model with a larger context window',
      'Summarize your conversation and start fresh'
    ]
  };

  const rateLimitError = {
    error: 'Rate limit exceeded',
    userMessage: "You're sending requests too quickly. Please wait a moment before trying again.",
    errorType: 'RATE_LIMIT_EXCEEDED',
    details: 'Rate limit exceeded: 429 Too Many Requests',
    suggestions: [
      'Wait 30-60 seconds before retrying',
      'Consider upgrading your API plan for higher limits'
    ]
  };

  const apiKeyError = {
    error: 'Invalid API key',
    userMessage: 'Your API key is invalid or has expired. Please check your API key settings.',
    errorType: 'INVALID_API_KEY',
    details: 'Authentication failed: invalid_api_key',
    suggestions: [
      'Verify your API key is correct',
      'Check if your API key has expired',
      'Generate a new API key from your provider dashboard'
    ]
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">Error Handling Demo</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Token Limit Exceeded</h2>
          <ChatMessage
            content=""
            timestamp={new Date()}
            variant="error"
            error={tokenLimitError}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Rate Limit Exceeded</h2>
          <ChatMessage
            content=""
            timestamp={new Date()}
            variant="error"
            error={rateLimitError}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Invalid API Key</h2>
          <ChatMessage
            content=""
            timestamp={new Date()}
            variant="error"
            error={apiKeyError}
          />
        </div>
      </div>
    </div>
  );
} 