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
  error,
}: ChatMessageProps) {
  // Use a fixed time format instead of locale-dependent formatting
  const formattedTime = typeof timestamp === 'string' 
    ? timestamp 
    : `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;

  // Consistent border radius for message bubbles
  const userBubbleStyle = {
    background: "linear-gradient(99deg, rgba(255, 255, 255, 0.08) -23.82%, rgba(0, 0, 0, 0.08) 128.39%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "14px 16px"
  };
  
  const agentBubbleStyle = {
    background: "linear-gradient(92deg, rgba(114, 255, 192, 0.10) 0%, rgba(32, 132, 95, 0.10) 99.74%)",
    border: "1px solid rgba(114, 255, 192, 0.2)",
    backdropFilter: "blur(40px)",
    borderRadius: "12px",
    padding: "14px 16px"
  };

  // Error bubble style with red accent
  const errorBubbleStyle = {
    background: "linear-gradient(92deg, rgba(255, 114, 114, 0.10) 0%, rgba(132, 32, 32, 0.10) 99.74%)",
    border: "1px solid rgba(255, 114, 114, 0.3)",
    backdropFilter: "blur(40px)",
    borderRadius: "12px",
    padding: "14px 16px"
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

  return (
    <div
      className={cn(
        "flex",
        variant === "user" ? "justify-end" : "justify-start",
        "gap-3 items-start",
        className
      )}
    >
      {variant === "agent" && (
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded overflow-hidden mt-1",
          isThinking && "animate-pulse"
        )}>
          <Image 
            src="/images/agent-avatar.png" 
            alt="Agent" 
            width={32} 
            height={32}
            className="object-cover"
          />
        </div>
      )}
      
      {variant === "error" && <ErrorIcon />}
      
      <div className="flex flex-col max-w-[75%]">
        <div
          className={cn(
            "font-[var(--font-space-grotesk)]",
            variant === "error" ? "text-[rgba(255,114,114,0.9)]" : "text-[rgba(255,255,255,0.8)]",
            isThinking && "chat-thinking-animation",
            isStreaming && "chat-text-streaming"
          )}
          style={bubbleStyle}
        >
          {isThinking ? (
            <div className="flex items-center space-x-1 h-5 mb-1">
              <div className="w-2 h-2 bg-[rgba(114,255,192,0.5)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-[rgba(114,255,192,0.5)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-[rgba(114,255,192,0.5)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          ) : variant === "error" && error ? (
            <div className="space-y-3">
              <div className="text-[13px] leading-[1.4] font-medium">
                {error.userMessage}
              </div>
              
              {error.suggestions && error.suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[rgba(255,114,114,0.7)]">
                    Suggestions:
                  </div>
                  <ul className="text-[11px] space-y-1 text-[rgba(255,114,114,0.8)]">
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
            <div className={cn(
              "mb-1 text-[13px] leading-[1.4]",
              isStreaming && "chat-text-typing"
            )}>{content}</div>
          )}
          <div
            className={cn(
              "text-[10px] text-right font-medium mt-1",
              variant === "error" ? "text-[rgba(255,114,114,0.4)]" : "text-[rgba(255,255,255,0.4)]"
            )}
          >
            {formattedTime}
          </div>
        </div>
      </div>
      
      {variant === "user" && (
        <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden mt-1">
          <Image 
            src="/images/user-avatar.png" 
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