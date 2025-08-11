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
        "flex justify-between items-center w-full",
        className
      )}
      style={{
        background: "#151515"
      }}
    >
      <h2 
        className="font-bold text-[rgba(255,255,255,0.8)]"
        style={{
          fontFamily: "Space Grotesk",
          fontSize: "16px",
          fontWeight: 700,
          lineHeight: "1em"
        }}
      >
        {title}
      </h2>
    </div>
  );
} 