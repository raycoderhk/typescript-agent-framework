import React from "react";
import { cn } from "@/lib/utils";

interface ErrorStatusProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorStatus({ message, onClose, className }: ErrorStatusProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 bg-[rgba(253,83,83,0.12)] border border-[#FD5353] rounded-full text-[#FD5353] text-xs",
      className
    )}>
      {/* Alert Icon */}
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6.5" stroke="#FD5353" strokeWidth="1.2"/>
        <path d="M7 3.5V7.5" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M7 10H7.01" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      
      {/* Message */}
      <span className="flex-1 opacity-80">{message}</span>
      
      {/* Close button (optional) */}
      {onClose && (
        <button 
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3L9 9" stroke="#FD5353" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
} 