"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EnhancedChatContainer } from "@/components/chat";
import { MCPServerDirectory } from "@/components/mcp-server-directory";
import { ModelSelector } from "@/components/model-selector";
import { DockerInstallModal } from "@/components/docker-install-modal";
import { PlaygroundHeader } from "@/components/playground-header";
import { MCPServer } from "@/types/mcp-server";
import { LocalToolboxStatus } from "@/components/ui/local-toolbox-status";

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  systemPrompt?: string;
}

interface ToolboxStatusResponse {
  installed: boolean;
}

// Playground page component
export default function PlaygroundPage() {
  const [isToolboxInstalled, setIsToolboxInstalled] = useState(false);
  const [toolboxStatus, setToolboxStatus] = useState<LocalToolboxStatus>('disconnected');
  const [enabledServerCount, setEnabledServerCount] = useState(0);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  // Check for toolbox installation on mount
  useEffect(() => {
    const checkToolboxInstallation = async () => {
      try {
        const response = await fetch('/api/toolbox/status');
        const data = await response.json() as ToolboxStatusResponse;
        setIsToolboxInstalled(data.installed);
        setToolboxStatus(data.installed ? 'installed' : 'disconnected');
      } catch (error) {
        console.error('Failed to check toolbox status:', error);
        setToolboxStatus('disconnected');
      }
    };

    checkToolboxInstallation();
  }, []);

  const handleServerToggle = useCallback((server: MCPServer, enabled: boolean) => {
    console.log(`Server ${server.id} ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  const handleServerCountChange = useCallback((count: number) => {
    setEnabledServerCount(count);
  }, []);

  const handleInstallClick = useCallback(() => {
    setIsDockerModalOpen(true);
  }, []);

  const handleDockerInstallComplete = useCallback(() => {
    setIsToolboxInstalled(true);
    setToolboxStatus('installed');
    setIsDockerModalOpen(false);
  }, []);

  const handleModelChange = useCallback((config: ModelConfig | null) => {
    setModelConfig(config);
  }, []);

  // Display title (server-safe)
  const chatTitle = typeof window !== 'undefined' && window.location.pathname.includes('/chat/') 
    ? `Chat Session` 
    : "Playground Chat";

        return (
        <>
          <main className="mcp-playground-page flex h-screen overflow-hidden">
            {/* Left Side - MCP Server Directory (flex-1 to take most space) */}
            <div className="flex-1 flex flex-col" style={{ paddingLeft: '60px', paddingTop: '24px', paddingBottom: '24px' }}>
              {/* Playground Header */}
              <div className="pr-6 pb-5">
                <PlaygroundHeader 
                  isToolboxInstalled={isToolboxInstalled}
                  toolboxStatus={toolboxStatus}
                  onInstallClick={handleInstallClick}
                />
              </div>
              
              {/* MCP Server Directory */}
              <div className="flex-1 overflow-hidden pr-6">
                <MCPServerDirectory
                  onServerToggle={handleServerToggle}
                  onServerCountChange={handleServerCountChange}
                />
              </div>
            </div>

            {/* Right Side - Fixed Width Chat */}
            <div 
              className="flex-shrink-0 bg-[#14161D] border-l border-[rgba(255,255,255,0.12)] pb-6 px-6"
              style={{ width: '460px' }}
            >
              <EnhancedChatContainer 
                title={chatTitle}
                showHeader={true}
                className="h-full"
                userAvatar="/images/default-avatar.png"
                onModelConfigChange={handleModelChange}
                enableSessionManagement={false} // Main page doesn't need session management
              />
            </div>
          </main>

          {/* Docker Install Modal */}
          <DockerInstallModal
            isOpen={isDockerModalOpen}
            onClose={() => setIsDockerModalOpen(false)}
            onInstallationComplete={handleDockerInstallComplete}
          />
        </>
      );
}
