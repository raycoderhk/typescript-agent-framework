"use client";

import React, { useState, useEffect } from "react";
import { ChatContainer } from "@/components/chat";
import { MCPServerDirectory } from "@/components/mcp-server-directory";
import { ModelSelector } from "@/components/model-selector";
import { MCPServer } from "@/types/mcp-server";
import { getCurrentModelConfig } from "@/lib/storage";

// Simplified model config for API-driven approach
interface ModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

export default function Home() {
  const [enabledServers, setEnabledServers] = useState<Set<string>>(new Set());
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  // Load initial model config
  useEffect(() => {
    setModelConfig(getCurrentModelConfig());
  }, []);

  // Listen for localStorage changes to keep model config in sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key.startsWith('ai_model_config_') || 
        e.key === 'current_ai_provider'
      )) {
        setModelConfig(getCurrentModelConfig());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleServerToggle = (server: MCPServer, enabled: boolean) => {
    setEnabledServers(prev => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(server.id);
      } else {
        newSet.delete(server.id);
      }
      return newSet;
    });
  };

  const handleModelChange = (config: ModelConfig | null) => {
    console.log('Model config updated:', config);
    setModelConfig(config);
  };

  // Determine chat title based on selected server
  const chatTitle = enabledServers.size > 0
    ? `Chat with ${enabledServers.size} MCP Server${enabledServers.size > 1 ? 's' : ''}`
    : "Playground Chat";

      return (
      <main 
        className="flex h-screen overflow-hidden"
        style={{ background: "#09090B" }}
      >
        {/* Left Half - MCP Server Directory */}
        <div className="w-1/2 border-r border-[rgba(255,255,255,0.1)] flex-shrink-0">
          <MCPServerDirectory
            onServerToggle={handleServerToggle}
            enabledServerIds={enabledServers}
          />
        </div>

        {/* Right Half - Chat + Model Selector */}
        <div className="w-1/2 flex flex-col min-w-0">
          <div className="flex flex-1 min-h-0">
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl h-full">
                  <ChatContainer 
                    title={chatTitle}
                    showHeader={true}
                    className="h-full"
                    modelConfig={modelConfig}
                  />
                </div>
              </div>


            </div>

            {/* Model Selector */}
            <div className="border-l border-[rgba(255,255,255,0.1)] p-4 flex-shrink-0">
              <ModelSelector 
                onModelChange={handleModelChange}
                className="sticky top-4"
              />
            </div>
          </div>
        </div>
      </main>
    );
}
