import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorDropdownProps {
  selectedModel?: ModelOption;
  onModelSelect: (model: ModelOption) => void;
  className?: string;
}

const availableModels: ModelOption[] = [
  { id: "gpt-4.1", name: "GPT 4.1", provider: "OpenAI" },
  { id: "claude-4-sonnet", name: "Claude -4 - Sonnet", provider: "Anthropic" },
  { id: "claude-4-opus", name: "Claude - 4 - Opus", provider: "Anthropic" },
  { id: "claude-3.5-sonnet", name: "Claude - 3.5 - Sonnet", provider: "Anthropic" },
];

export function ModelSelectorDropdown({ 
  selectedModel = availableModels[2], // Default to Claude 4 Opus
  onModelSelect,
  className 
}: ModelSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModelSelect = (model: ModelOption) => {
    onModelSelect(model);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 py-1 bg-gradient-to-br from-white to-black border border-[rgba(255,255,255,0.2)] rounded text-[#7E98FF] text-xs font-medium hover:opacity-90 transition-opacity"
      >
        {/* Brain Icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <path 
            d="M7 1.5C8.5 1.5 10 2.5 10.5 4C11 4.5 11.5 5.5 11.5 6.5C11.5 7.5 11 8.5 10.5 9C10 10.5 8.5 11.5 7 11.5C5.5 11.5 4 10.5 3.5 9C3 8.5 2.5 7.5 2.5 6.5C2.5 5.5 3 4.5 3.5 4C4 2.5 5.5 1.5 7 1.5Z"
            stroke="#7E98FF" 
            strokeWidth="1.2"
          />
          <path d="M5.5 6L7 7.5L8.5 6" stroke="#7E98FF" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        
        <span>{selectedModel.name}</span>
        
        {/* Chevron Icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <path 
            d="M10.5 5.25L7 8.75L3.5 5.25" 
            stroke="rgba(255,255,255,0.6)" 
            strokeWidth="1.33" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute bottom-full left-0 mb-2 min-w-[200px] bg-[#222531] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-lg z-20">
            {/* Header */}
            <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.2)]">
              <span className="text-white text-sm font-bold">Select Model</span>
            </div>
            
            {/* Options */}
            <div className="py-3 px-1">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className={cn(
                    "w-full flex items-center px-3 py-1 text-left text-sm hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors",
                    model.id === selectedModel.id 
                      ? "text-white" 
                      : "text-[rgba(255,255,255,0.8)]"
                  )}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 