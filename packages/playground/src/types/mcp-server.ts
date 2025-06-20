export interface MCPServerVersion {
  hash: string;
  date: string;
  tag?: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPServerRepository {
  type: "git";
  url: string;
  directory?: string;
}

export interface MCPServer {
  id: string; // Unique identifier
  name: string; // Unique name
  shortDescription: string; // < 255 characters
  repository: MCPServerRepository;
  mcpServerConfig: MCPServerConfig;
  versions: MCPServerVersion[];
  keywords: string[];
  licenses: string[];
  category?: string;
  author?: string;
  homepage?: string;
  documentation?: string;
  // Search optimization fields
  searchText?: string; // Combined searchable text
  popularity?: number; // For ranking
  lastUpdated?: string;
}

export interface MCPServerDirectory {
  servers: MCPServer[];
  lastFetched: string;
  version: string;
}

// AI Model Configuration
export interface AIModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIModelOption {
  provider: 'openai' | 'anthropic';
  models: {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
    available?: boolean;
    lastValidated?: string;
    validationError?: string;
  }[];
} 