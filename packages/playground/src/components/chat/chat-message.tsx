import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface ChatMessageProps {
  content: string;
  timestamp: string | Date;
  variant: "user" | "agent" | "error";
  className?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  avatar?: string;
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

export function ChatMessage({
  content,
  timestamp,
  variant,
  className,
  isThinking = false,
  isStreaming = false,
  avatar = "/images/default-avatar.png",
  showTaskList = false,
  taskSteps = [],
  error,
}: ChatMessageProps) {
  // User bubble style - matches Figma design with purple gradient
  const userBubbleStyle = {
    background: "linear-gradient(135deg, #7849EF 0%, #326CD8 100%)",
    border: "1px solid transparent",
    borderImage: "linear-gradient(135deg, #7849EF 0%, #326CD8 100%) 1",
    borderRadius: "4px",
    padding: "8px 12px",
    maxWidth: "324px"
  };
  
  // Agent bubble style - matches Figma purple gradient  
  const agentBubbleStyle = {
    background: "linear-gradient(135deg, #7849EF 0%, #326CD8 100%)",
    border: "1px solid transparent",
    borderRadius: "4px",
    padding: "8px 12px",
    maxWidth: "324px"
  };

  // Error bubble style with red accent
  const errorBubbleStyle = {
    background: "rgba(253, 83, 83, 0.12)",
    border: "1px solid #FD5353",
    borderRadius: "4px",
    padding: "8px 12px",
    maxWidth: "324px"
  };

  // New style for thinking state with pulsing animation
  const thinkingBubbleStyle = {
    ...agentBubbleStyle,
    animation: "pulse 1.5s infinite ease-in-out",
  };

  // Determine which style to use
  const bubbleStyle = variant === "user" 
    ? userBubbleStyle 
    : variant === "error"
    ? errorBubbleStyle
    : (isThinking ? thinkingBubbleStyle : agentBubbleStyle);

  // Error icon component
  const ErrorIcon = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden mt-1 bg-red-500/20 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="rgba(255, 114, 114, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  // Task List component (moved inline to avoid external dependency)
  const TaskList = ({ steps }: { steps: Array<{ id: string; title: string; status: "pending" | "in-progress" | "completed" }> }) => (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            step.status === "completed" 
              ? "bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.12)]"
              : step.status === "in-progress"
              ? "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] animate-pulse"
              : "bg-transparent border border-[rgba(255,255,255,0.2)]"
          )}>
            {step.status === "completed" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className={cn(
            "text-[12px] leading-[1.33] font-normal",
            step.status === "completed" ? "text-[rgba(255,255,255,0.8)]" : "text-[rgba(255,255,255,0.6)]"
          )}>
            {step.title}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        variant === "user" ? "justify-end" : "justify-start",
        className
      )}
    >
      {variant === "agent" && (
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded overflow-hidden mt-1",
          isThinking && "animate-pulse"
        )}>
          <div className="w-8 h-8 bg-[#E1E7FF] rounded flex items-center justify-center">
            <svg className="w-4 h-5" viewBox="0 0 15.29 19.4" fill="none">
              <path 
                d="M8.32 6.32L15.29 19.4L8.32 6.32Z" 
                fill="url(#agentGradient)"
              />
              <defs>
                <linearGradient id="agentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7849EF" />
                  <stop offset="100%" stopColor="#326CDB" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}
      
      {variant === "error" && <ErrorIcon />}
      
      <div className="flex flex-col">
        <div
          className={cn(
            "font-[var(--font-space-grotesk)]",
            variant === "error" ? "text-[#FD5353]" : "text-[rgba(255,255,255,0.8)]",
            isThinking && "chat-thinking-animation",
            isStreaming && "chat-text-streaming"
          )}
          style={bubbleStyle}
        >
          {isThinking ? (
            <div className="flex items-center space-x-1 h-5 mb-1">
              <div className="w-2 h-2 bg-[rgba(255,255,255,0.5)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-[rgba(255,255,255,0.5)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-[rgba(255,255,255,0.5)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          ) : variant === "error" && error ? (
            <div className="space-y-3">
              <div className="text-[14px] leading-[1.4] font-normal">
                {error.userMessage}
              </div>
              
              {error.suggestions && error.suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[12px] font-medium text-[rgba(255,114,114,0.7)]">
                    Suggestions:
                  </div>
                  <ul className="text-[12px] space-y-1 text-[rgba(255,114,114,0.8)]">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-[rgba(255,114,114,0.6)] mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {error.details && (
                <details className="text-[10px] text-[rgba(255,114,114,0.6)]">
                  <summary className="cursor-pointer hover:text-[rgba(255,114,114,0.8)] transition-colors">
                    Technical details
                  </summary>
                  <div className="mt-1 p-2 bg-black/20 rounded text-[9px] font-mono break-all">
                    {error.details}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cn(
                "text-[14px] leading-[1.4] font-normal",
                isStreaming && "chat-text-typing"
              )}>{content}</div>
              
              {/* Task List */}
              {showTaskList && taskSteps.length > 0 && (
                <div className="pt-4 border-t border-[rgba(255,255,255,0.2)]">
                  <TaskList steps={taskSteps} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {variant === "user" && (
        <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden mt-1">
          <Image 
            src={avatar} 
            alt="User" 
            width={32} 
            height={32}
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
} 