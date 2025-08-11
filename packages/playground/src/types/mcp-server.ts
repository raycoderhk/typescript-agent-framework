export interface MCPServerVersion {
  hash: string;
  date: string;
  tag?: string;
}

// VSCode MCP input format
export interface MCPServerInput {
  type: "promptString";
  id: string;
  description: string;
  password?: boolean;
  required?: boolean;
  default?: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// New nested MCP server config structure
export interface MCPServerConfigNested {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MCPServerRepository {
  type: "git";
  url: string;
  directory?: string;
}

// Configuration storage for installed MCPs
export interface MCPServerConfigData {
  serverId: string;
  inputs: Record<string, string>; // Maps input.id to user-provided value
  isConfigured: boolean;
  isEnabled: boolean;
  configuredAt: string;
  lastUpdated?: string;
}

// MCP Server installation and runtime states
export type MCPServerInstallationState = 'not-installed' | 'installed-disabled' | 'installed-enabled';

export interface MCPServerRuntimeState {
  installationState: MCPServerInstallationState;
  isRunning: boolean; // From WebSocket/backend
  hasConfiguration: boolean; // From localStorage
  isConfigured: boolean; // Has all required configuration
  isLoading: boolean; // Currently being installed/uninstalled
}

export interface MCPServer {
  id: string; // UUID
  git_repository: string; // GitHub repository URL
  unique_name: string; // Formatted as owner/repo
  short_description: string; // Longer description text
  versions: MCPServerVersion[]; // Array of versions
  keywords: string[]; // Array of keyword strings
  license: string; // License name (e.g., "MIT License")
  license_url: string; // URL to license file
  mcp_server_config: MCPServerConfigNested; // Nested configuration
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  mcp_server_inputs: string; // Stringified JSON array of MCPServerInput[]
  tags: string; // Stringified JSON array of category tags
  
  // Computed/derived fields for backward compatibility and display
  name?: string; // Derived from unique_name
  shortDescription?: string; // Alias for short_description
  mcpServerConfig?: MCPServerConfig; // Flattened config for compatibility
  inputs?: MCPServerInput[]; // Parsed from mcp_server_inputs
  parsedTags?: string[]; // Parsed from tags
  licenses?: string[]; // Converted from license for compatibility
  category?: string; // Derived from first tag
  author?: string; // Derived from unique_name
  homepage?: string; // Derived from git_repository
  documentation?: string; // Derived from git_repository
  // Search optimization fields
  searchText?: string; // Combined searchable text
  popularity?: number; // For ranking
  lastUpdated?: string; // Alias for updated_at
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