import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { getCurrentModelConfig, loadAIModelConfig, saveAIModelConfig } from "@/lib/storage";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  selectedModel?: {
    id: string;
    name: string;
    provider: string;
  };
  onModelChange?: (model: { id: string; name: string; provider: string }) => void;
  availableModels?: Array<{ id: string; name: string; provider: string }>;
  className?: string;
  error?: string;
  onClearError?: () => void; // Optional since we're not using it in the simplified error approach
}

export function ChatInput({
  onSend,
  disabled = false,
  selectedModel,
  onModelChange,
  availableModels = [],
  className,
  error,
  onClearError
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [providerModels, setProviderModels] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [defaultModel, setDefaultModel] = useState<{ id: string; name: string; provider: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load default model from local storage
  useEffect(() => {
    const loadDefaultModel = () => {
      const config = loadAIModelConfig();
      if (config && config.model) {
        setDefaultModel({
          id: config.model,
          name: config.model,
          provider: config.provider
        });
        
        // If no selected model is provided, use the default from storage
        if (!selectedModel && onModelChange) {
          onModelChange({
            id: config.model,
            name: config.model,
            provider: config.provider
          });
        }
      }
    };

    loadDefaultModel();
  }, [selectedModel, onModelChange]);

  useEffect(() => {
    const fetchProviderModels = async () => {
      const currentConfig = getCurrentModelConfig();
      if (!currentConfig || !currentConfig.apiKey) {
        setProviderModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const endpoint = currentConfig.provider === 'openai' 
          ? '/api/models/openai' 
          : '/api/models/anthropic';
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (currentConfig.provider === 'openai') {
          headers['Authorization'] = `Bearer ${currentConfig.apiKey}`;
        } else {
          headers['x-api-key'] = currentConfig.apiKey;
        }

        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json() as { data: Array<{ id: string; name: string }> };
        setProviderModels(data.data || []);
      } catch (error) {
        console.error('Error fetching provider models:', error);
        setProviderModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchProviderModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelDropdown && !(event.target as Element).closest('.model-dropdown')) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const modelsToShow = providerModels.length > 0 ? providerModels : availableModels;
  const displayModel = selectedModel || defaultModel;

  return (
    <div className={cn("figma-chat-input-container figma-override", className)}>
      {error && (
        <div className="figma-error-status">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#FD5353" strokeWidth="1.2"/>
            <path d="M7 3.5V7.5" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7 10H7.01" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          
          <span className="flex-1 opacity-80 font-normal">
            An error occurred
          </span>
        </div>
      )}

      <div className="figma-comment-box">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className="figma-message-input"
            rows={1}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="relative model-dropdown">
            <button
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="figma-model-selector-gradient"
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path 
                  d="M7 1.17C8.933 1.17 10.5 2.737 10.5 4.67V6.33C10.5 7.096 10.196 7.787 9.712 8.3C10.196 8.813 10.5 9.504 10.5 10.27V11.93C10.5 12.863 9.763 13.6 8.83 13.6H5.17C4.237 13.6 3.5 12.863 3.5 11.93V10.27C3.5 9.504 3.804 8.813 4.288 8.3C3.804 7.787 3.5 7.096 3.5 6.33V4.67C3.5 2.737 5.067 1.17 7 1.17Z"
                  stroke="#7E98FF" 
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>

              <span className="figma-model-selector-text">
                {displayModel?.name || "Claude - 4 - Opus"}
              </span>

              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path 
                  d="M3.5 5.25L7 8.75L10.5 5.25"
                  stroke="rgba(255, 255, 255, 0.6)" 
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showModelDropdown && modelsToShow.length > 0 && (
              <div className="figma-dropdown-menu absolute bottom-full left-0 mb-2 min-w-[200px] z-[99999]">
                {loadingModels ? (
                  <div className="p-3 text-sm text-white/60" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Loading models...
                  </div>
                ) : (
                  <>
                    <div className="figma-dropdown-header">
                      <span className="figma-dropdown-header-text">
                        Select Model
                      </span>
                    </div>
                    
                    <div className="figma-dropdown-content">
                      {modelsToShow.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            const selectedModel = { 
                              id: model.id, 
                              name: model.name, 
                              provider: getCurrentModelConfig()?.provider || 'anthropic' 
                            };
                            
                            // Save to localStorage for persistence
                            const currentConfig = getCurrentModelConfig();
                            if (currentConfig) {
                              saveAIModelConfig({
                                ...currentConfig,
                                model: model.id
                              });
                            }
                            
                            onModelChange?.(selectedModel);
                            setShowModelDropdown(false);
                          }}
                          className="figma-dropdown-item"
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            className="figma-send-button"
          >
            <Send size={16} color="#FFFFFF" strokeWidth={1.2} />
          </button>
        </div>
      </div>
    </div>
  );
} 