import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { getCurrentModelConfig, loadAIModelConfig } from "@/lib/storage";

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
  onClearError?: () => void;
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
            {error}
          </span>
          
          {onClearError && (
            <button 
              onClick={onClearError}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3L9 9" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
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
              <div 
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0',
                  marginBottom: '8px',
                  minWidth: '200px',
                  zIndex: 99999,
                  backgroundColor: '#222531',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  // Force opaque background by removing all possible transparencies
                  backgroundImage: 'none',
                  backgroundAttachment: 'initial',
                  backgroundOrigin: 'initial',
                  backgroundClip: 'initial',
                  backgroundSize: 'initial',
                  backgroundPosition: 'initial',
                  backgroundRepeat: 'initial',
                  backdropFilter: 'none',
                  opacity: '1'
                }}
              >
                {loadingModels ? (
                  <div 
                    style={{ 
                      padding: '12px 16px',
                      fontFamily: "Space Grotesk",
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      backgroundColor: '#222531'
                    }}
                  >
                    Loading models...
                  </div>
                ) : (
                  <>
                    <div 
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'stretch',
                        backgroundColor: '#222531'
                      }}
                    >
                      <span 
                        style={{
                          fontFamily: 'Space Grotesk',
                          fontSize: '14px',
                          fontWeight: '700',
                          lineHeight: '1.276',
                          color: '#FFFFFF',
                          textAlign: 'left',
                          flex: '1'
                        }}
                      >
                        Select Model
                      </span>
                    </div>
                    
                    <div 
                      style={{
                        padding: '12px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        backgroundColor: '#222531'
                      }}
                    >
                      {modelsToShow.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            onModelChange?.({ 
                              id: model.id, 
                              name: model.name, 
                              provider: getCurrentModelConfig()?.provider || 'anthropic' 
                            });
                            setShowModelDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Space Grotesk',
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '1.276',
                            color: 'rgba(255, 255, 255, 0.8)',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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