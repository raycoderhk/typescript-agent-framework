import React from "react";
import { cn } from "@/lib/utils";

export interface ChatHeaderProps {
  title?: string;
  className?: string;
}

export function ChatHeader({ 
  title = "Chat with Vista", 
  className
}: ChatHeaderProps) {

  return (
    <div 
      className={cn(
        "flex justify-between items-center border-b",
        className
      )}
      style={{
        background: "#151515",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "12px 24px"
      }}
    >
      <h2 className="font-bold text-[16px] text-[rgba(255,255,255,0.8)] font-[var(--font-space-grotesk)]">
        {title}
      </h2>
    </div>
  );
} 