"use client";

import React, { createContext, useContext, ReactNode } from 'react';

export interface PlaygroundConfig {
  mcpProxyUrl: string;
  mcpProxyWsUrl: string;
  apiBaseUrl?: string;
  defaultModelConfig?: {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    model: string;
  };
  theme?: 'dark' | 'light';
  enabledFeatures?: {
    chat?: boolean;
    mcpServerDirectory?: boolean;
    modelSelector?: boolean;
  };
}

const DEFAULT_CONFIG: PlaygroundConfig = {
  mcpProxyUrl: process.env.NEXT_PUBLIC_MCP_PROXY_URL || 'http://localhost:6050',
  mcpProxyWsUrl: process.env.NEXT_PUBLIC_MCP_PROXY_WS_URL || 'ws://localhost:6050/client/ws',
  apiBaseUrl: '/api',
  theme: 'dark',
  enabledFeatures: {
    chat: true,
    mcpServerDirectory: true,
    modelSelector: true,
  },
};

const PlaygroundContext = createContext<PlaygroundConfig>(DEFAULT_CONFIG);

export interface PlaygroundProviderProps {
  children: ReactNode;
  config: Partial<PlaygroundConfig>;
}

export function PlaygroundProvider({ children, config }: PlaygroundProviderProps) {
  const mergedConfig: PlaygroundConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    enabledFeatures: {
      ...DEFAULT_CONFIG.enabledFeatures,
      ...config.enabledFeatures,
    },
  };

  return (
    <PlaygroundContext.Provider value={mergedConfig}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlaygroundConfig(): PlaygroundConfig {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlaygroundConfig must be used within a PlaygroundProvider');
  }
  return context;
} 