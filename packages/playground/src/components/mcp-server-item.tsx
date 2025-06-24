"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MCPServer } from "@/types/mcp-server";

export interface MCPServerItemProps {
  server: MCPServer;
  isEnabled?: boolean;
  isLoading?: boolean;
  onToggle?: (server: MCPServer, enabled: boolean) => void;
  className?: string;
}

export function MCPServerItem({
  server,
  isEnabled = false,
  isLoading = false,
  onToggle,
  className
}: MCPServerItemProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(server, !isEnabled);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all duration-200 hover:border-[rgba(255,255,255,0.2)] relative bg-[#17181A] border-[rgba(255,255,255,0.1)]",
        isEnabled && !isLoading && "ring-2 ring-[rgba(114,255,192,0.3)] border-[rgba(114,255,192,0.3)]",
        isLoading && "ring-2 ring-yellow-400/40 border-yellow-400/40 shadow-lg shadow-yellow-400/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-white/95 truncate">
            {server.name}
          </h3>
          {server.author && (
            <p className="text-sm text-white/60 truncate mt-1">
              by {server.author}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {server.popularity && (
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-xs text-white/60">{server.popularity}</span>
            </div>
          )}
          
          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(114,255,192,0.5)] focus:ring-offset-2 focus:ring-offset-[#09090B]",
              isLoading && "animate-pulse ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-400/30",
              isEnabled && !isLoading && "bg-[#72FFC0]",
              isLoading && "bg-yellow-400",
              !isEnabled && !isLoading && "bg-[rgba(255,255,255,0.1)]",
              isLoading && "cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "inline-block h-3 w-3 transform rounded-full transition-all duration-300",
                isLoading && "bg-white animate-spin border border-yellow-600",
                !isLoading && "bg-white",
                isEnabled && !isLoading ? "translate-x-5" : "translate-x-1"
              )}
            >
              {isLoading && (
                <div className="absolute inset-0 rounded-full border-t-2 border-yellow-600 animate-spin" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/75 mb-4 line-clamp-2 leading-relaxed">
        {server.shortDescription}
      </p>

      {/* Keywords */}
      {server.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {server.keywords.slice(0, 4).map((keyword, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-[rgba(255,255,255,0.05)] text-xs text-white/60 rounded-md"
            >
              {keyword}
            </span>
          ))}
          {server.keywords.length > 4 && (
            <span className="text-xs text-white/40">
              +{server.keywords.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-2">
          {server.category && (
            <span className="bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">
              {server.category}
            </span>
          )}
          {server.licenses.length > 0 && (
            <span>{server.licenses[0]}</span>
          )}
        </div>
        {server.lastUpdated && (
          <span>{formatDate(server.lastUpdated)}</span>
        )}
      </div>


    </div>
  );
} 