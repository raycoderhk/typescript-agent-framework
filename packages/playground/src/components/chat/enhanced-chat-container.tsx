import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChatConfiguration } from "./chat-configuration";
import { ChatMessage } from "./chat-message";
import { ModelSelectorDropdown } from "./model-selector-dropdown";
import { ChatInput } from "./chat-input";
import { DateDivider } from "./date-divider";
import { useChat, type Message as UIMessage } from "@ai-sdk/react";
import { usePathname } from "next/navigation";
import { 
  saveAIModelConfig, 
  loadAIModelConfig, 
  AIModelConfig,
  saveChat,
  loadChat
} from "@/lib/storage";
import { MessageSquare, Settings2 } from "lucide-react";

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  systemPrompt?: string;
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string | Date;
  sender: "user" | "agent" | "error";
  isThinking?: boolean;
  isStreaming?: boolean;
  showTaskList?: boolean;
  taskSteps?: Array<{
    id: string;
    title: string;
    status: "pending" | "in-progress" | "completed";
  }>;
  error?: {
    error: string;
    userMessage: string;
    errorType: string;
    details?: string;
    suggestions?: string[];
  };
}

interface DateDividerItem {
  id: string;
  type: 'date-divider';
  date: Date;
}

interface EnhancedChatContainerProps {
  className?: string;
  title?: string;
  showHeader?: boolean;
  userAvatar?: string;
  onModelConfigChange?: (config: ModelConfig | null) => void;
  enableSessionManagement?: boolean; // New prop to enable session features
  sessionId?: string; // For existing sessions
}

// Extract session ID from URL path
function getSessionIdFromPath(path: string): string | null {
  const match = path.match(/\/chat\/([^\/]+)/);
  return match ? match[1] : null;
}

// Check if this is a new chat
function isNewChat(sessionId: string | null): boolean {
  return sessionId === 'new';
}

// Helper function to check if two dates are on different days
function isDifferentDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

export function EnhancedChatContainer({
  className,
  title = "Playground Chat",
  showHeader = true,
  userAvatar = "/images/default-avatar.png",
  onModelConfigChange,
  enableSessionManagement = false,
  sessionId: propSessionId
}: EnhancedChatContainerProps) {
  const pathname = usePathname();
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<Message | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>({
    id: "claude-4-opus",
    name: "Claude - 4 - Opus",
    provider: "Anthropic"
  });

  // Session management (only if enabled)
  const urlSessionId = enableSessionManagement ? (propSessionId || getSessionIdFromPath(pathname || "")) : null;
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [displaySessionId, setDisplaySessionId] = useState<string | null>(
    enableSessionManagement && !isNewChat(sessionId) ? sessionId : null
  );

  // Chat hook - only initialize if we have a valid model config
  const {
    messages: aiMessages,
    handleInputChange,
    handleSubmit,
    append,
    status,
    error,
  } = useChat({
    api: modelConfig ? '/api/chat' : undefined,
    id: enableSessionManagement ? 'session-chat' : 'enhanced-chat-session',
    streamProtocol: 'data' as const,
    initialMessages: (enableSessionManagement && sessionId && !isNewChat(sessionId) ? loadChat(sessionId) : []) as UIMessage[],
    headers: modelConfig ? {
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    } : {},
    body: modelConfig ? {
      provider: modelConfig.provider.toLowerCase(),
      model: selectedModel.id,
      temperature: modelConfig.temperature || 0.7,
      maxTokens: modelConfig.maxTokens || 2000,
    } : {} as Record<string, unknown>,
    onError: (error) => {
      console.error('Chat error:', error);
      setCurrentError(error.message);
      
      // Try to parse structured error response
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.userMessage && errorData.errorType) {
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            content: errorData.userMessage,
            timestamp: new Date(),
            sender: "error",
            error: errorData
          };
          setErrorMessage(errorMessage);
          return;
        }
      } catch {
        // Not a structured error, continue with generic handling
      }
    },
  });

  // Handle configuration completion
  const handleConfigurationComplete = (config: { provider: string; version: string; apiKey: string }) => {
    const modelConfig: ModelConfig = {
      provider: config.provider.toLowerCase() as 'openai' | 'anthropic',
      apiKey: config.apiKey,
      model: config.version,
      temperature: 0.7,
      maxTokens: 2000,
    };
    
    // Save to localStorage for persistence
    const aiModelConfig: AIModelConfig = {
      provider: modelConfig.provider,
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    };
    saveAIModelConfig(aiModelConfig);
    
    setModelConfig(modelConfig);
    setCurrentError(null);
    setErrorMessage(null);
    onModelConfigChange?.(modelConfig);
  };

  // Load existing configuration on mount
  useEffect(() => {
    const existingConfig = loadAIModelConfig();
    if (existingConfig && existingConfig.apiKey && existingConfig.model) {
      const modelConfig: ModelConfig = {
        provider: existingConfig.provider,
        apiKey: existingConfig.apiKey,
        model: existingConfig.model,
        temperature: existingConfig.temperature || 0.7,
        maxTokens: existingConfig.maxTokens || 2000,
      };
      setModelConfig(modelConfig);
      onModelConfigChange?.(modelConfig);
    }
  }, [onModelConfigChange]);

  // Session management effects (only if enabled)
  useEffect(() => {
    if (!enableSessionManagement) return;
    
    // Only handle new chat session creation
    if (!isNewChat(sessionId) || aiMessages.length === 0) return;
    
    // Generate a new session ID only once when we transition from new to having messages
    const newSessionId = crypto.randomUUID();
    
    // Update URL directly with History API to prevent navigation
    const newUrl = window.location.pathname.replace('/chat/new', `/chat/${newSessionId}`);
    window.history.replaceState({}, '', newUrl);
    
    // Update session ID state
    setSessionId(newSessionId);
    setDisplaySessionId(newSessionId);
  }, [enableSessionManagement, sessionId, aiMessages.length]);

  // Save messages effect (only if session management enabled)
  useEffect(() => {
    if (!enableSessionManagement) return;
    
    // Don't save for new chats until they have a proper ID
    if (isNewChat(sessionId) || !sessionId) return;
    
    // Don't save empty message arrays
    if (aiMessages.length === 0) return;
    
    // Use a timeout to debounce rapid saves
    const saveTimeout = setTimeout(() => {
      console.log(`Saving messages for session ${sessionId}`, aiMessages);
      saveChat(sessionId, aiMessages);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(saveTimeout);
  }, [enableSessionManagement, sessionId, aiMessages]);

  // Handle model selection
  const handleModelSelect = (model: ModelOption) => {
    setSelectedModel(model);
  };

  // Clear error
  const handleClearError = () => {
    setCurrentError(null);
    setErrorMessage(null);
  };

  // Convert AI messages to display format
  const displayMessages = useMemo(() => {
    if (!modelConfig) return [];
    
    return aiMessages.map((msg, index) => {
      const isLatestAssistantMessage = msg.role === "assistant" && msg === aiMessages[aiMessages.length - 1];
      const isActivelyStreaming = status === 'streaming' && isLatestAssistantMessage && !!msg.content;
      const isThinking = status === 'submitted' && index === aiMessages.length - 1 && msg.role === 'assistant' && !msg.content;
      
      // Sample task steps for demo (would come from actual agent logic)
      const sampleTaskSteps = index === 1 && msg.role === 'assistant' ? [
        { id: "1", title: "Preparing agent to Fetch Website Data", status: "completed" as const },
        { id: "2", title: "Getting high on caffeine...", status: "completed" as const },
        { id: "3", title: "Coming up with instructions...", status: "completed" as const }
      ] : [];

      return {
        id: msg.id,
        content: msg.content || '',
        timestamp: new Date(msg.createdAt || new Date()),
        sender: msg.role === "user" ? "user" : "agent" as "user" | "agent",
        isStreaming: isActivelyStreaming,
        isThinking,
        showTaskList: sampleTaskSteps.length > 0,
        taskSteps: sampleTaskSteps
      };
    });
  }, [aiMessages, status, modelConfig]);

  // Add thinking message and error messages if needed
  const messagesWithThinking = useMemo(() => {
    const messages: Message[] = [...displayMessages];
    
    // Add error message if present
    if (errorMessage) {
      messages.push({
        ...errorMessage,
        timestamp: new Date(errorMessage.timestamp)
      });
    }
    
    // Add thinking indicator if we're in submitted state and last message is from user
    if (status === 'submitted' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'user') {
        messages.push({
          id: "thinking",
          content: "",
          timestamp: new Date(),
          sender: "agent",
          isThinking: true
        });
      }
    }
    
    return messages;
  }, [displayMessages, status, errorMessage]);

  // Group messages by date (only if session management enabled)
  const messagesWithDates = useMemo(() => {
    if (!enableSessionManagement) {
      return messagesWithThinking.map(msg => msg);
    }

    const result: (Message | DateDividerItem)[] = [];
    let lastDate: Date | null = null;
    
    messagesWithThinking.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      
      if (!lastDate || isDifferentDay(lastDate, messageDate)) {
        result.push({
          id: `date-${messageDate.toISOString()}`,
          type: 'date-divider',
          date: messageDate
        });
        lastDate = messageDate;
      }
      
      result.push(message);
    });
    
    return result;
  }, [messagesWithThinking, enableSessionManagement]);

  // Handle message send from chat input
  const handleSendMessage = (message: string) => {
    if (!message.trim() || !modelConfig) return;
    
    setCurrentError(null);
    setErrorMessage(null);
    
    // Add user message using the chat hook's append function
    append({ role: 'user', content: message });
  };

  // Title display
  const displayTitle = title || 
    (enableSessionManagement && displaySessionId ? `Chat #${displaySessionId}` : title);

  // Show configuration if no model config
  if (!modelConfig) {
    return (
      <div 
        className={cn("flex flex-col h-full w-full relative overflow-hidden", className)}
        style={{
          background: "transparent"
        }}
      >
        <ChatConfiguration onContinue={handleConfigurationComplete} />
      </div>
    );
  }

  // Main chat interface
  return (
    <div 
      className={cn("flex flex-col h-full w-full relative overflow-hidden", className)}
      style={{
        background: "transparent"
      }}
    >
      {/* Header - Matches Figma padding and spacing with full-width divider */}
      {showHeader && (
        <div className="border-b" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div 
            className="flex justify-between items-center gap-6"
            style={{
              padding: "20px 24px"
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/badge_light_bg.png" 
                  alt="Playground Chat"
                  className="w-full h-full object-cover"
                />
              </div>
              <span 
                className="text-white font-bold"
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: "1em"
                }}
              >
                {displayTitle}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 cursor-pointer">
                <MessageSquare 
                  size={24} 
                  stroke="white" 
                  strokeWidth={1.2}
                />
              </div>
              <div className="w-6 h-6 cursor-pointer">
                <Settings2 
                  size={24} 
                  stroke="white" 
                  strokeWidth={1.2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area with proper Figma spacing */}
      <div className="flex-1 flex flex-col">
        {/* Messages - Matches Figma padding (24px sides) and spacing (32px between groups) */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            padding: "24px 24px"
          }}
        >
          <div className="space-y-8">
            {(enableSessionManagement ? messagesWithDates : messagesWithThinking).map((item, index) => {
              // Handle date dividers (only for session management)
              if (enableSessionManagement && 'type' in item && item.type === 'date-divider') {
                return (
                  <div key={item.id}>
                    <DateDivider date={item.date} />
                  </div>
                );
              }
              
              const message = item as Message;
              
              return (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                  variant={message.sender}
                  avatar={userAvatar}
                  isThinking={message.isThinking}
                  isStreaming={message.isStreaming}
                  showTaskList={message.showTaskList}
                  taskSteps={message.taskSteps}
                  error={message.error}
                />
              );
            })}
          </div>
          {/* Bottom spacing for scroll */}
          <div className="h-6" />
        </div>

        {/* Input Area - Centered with proper spacing */}
        <div 
          className="flex justify-center"
          style={{
            padding: "0 24px 24px 24px"
          }}
        >
          <ChatInput
            onSend={handleSendMessage}
            disabled={status === 'submitted' || status === 'streaming'}
            selectedModel={selectedModel}
            onModelChange={handleModelSelect}
            availableModels={[
              { id: "claude-4-opus", name: "Claude - 4 - Opus", provider: "Anthropic" },
              { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
              { id: "claude-3.5-sonnet", name: "Claude - 3.5 - Sonnet", provider: "Anthropic" }
            ]}
            error={currentError || error?.message}
            onClearError={handleClearError}
          />
        </div>
      </div>
    </div>
  );
} 