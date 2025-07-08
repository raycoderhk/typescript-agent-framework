import { MCPServer, MCPServerDirectory, MCPServerInput } from '@/types/mcp-server';

// Utility function to transform new format to old format for backward compatibility
export function transformMCPServer(server: MCPServer): MCPServer {
  const inputs: MCPServerInput[] = server.mcp_server_inputs 
    ? JSON.parse(server.mcp_server_inputs) 
    : [];
  
  const parsedTags: string[] = server.tags 
    ? JSON.parse(server.tags) 
    : [];

  // Extract the main server config (assuming single server in mcpServers)
  const configKeys = Object.keys(server.mcp_server_config.mcpServers);
  const mainConfigKey = configKeys[0];
  const mcpServerConfig = mainConfigKey 
    ? server.mcp_server_config.mcpServers[mainConfigKey]
    : { command: '', args: [], env: {} };

  return {
    ...server,
    // Backward compatibility fields
    name: server.unique_name.split('/')[1] || server.unique_name,
    shortDescription: server.short_description,
    mcpServerConfig,
    inputs,
    parsedTags,
    licenses: [server.license],
    category: parsedTags[0],
    author: server.unique_name.split('/')[0],
    homepage: server.git_repository.replace('.git', '').replace('github.com', 'github.com'),
    documentation: `${server.git_repository.replace('.git', '')}/blob/main/README.md`,
    lastUpdated: server.updated_at,
    searchText: `${server.unique_name} ${server.short_description} ${server.keywords.join(' ')} ${parsedTags.join(' ')}`.toLowerCase()
  };
}

export const mockMCPServers: MCPServer[] = [
  {
    id: "8ce4ffb3-b703-4baa-8a29-302726c33e77",
    git_repository: "https://github.com/albiemark/dbx-mcp-server",
    unique_name: "albiemark/dbx-mcp-server",
    short_description: "The MCP server provides integration between MCP-compatible clients and Dropbox, enabling access to Dropbox's file storage and sharing capabilities through a Model Context Protocol interface. It acts as a middleware that translates MCP client requests into Dropbox API operations, allowing applications to interact with Dropbox content through standardized MCP tools.",
    versions: [],
    keywords: [
      "dropbox",
      "mcp",
      "integration",
      "oauth",
      "file-management"
    ],
    license: "MIT License",
    license_url: "https://raw.githubusercontent.com/Albiemark/dbx-mcp-server/main/LICENSE",
    mcp_server_config: {
      mcpServers: {
        dbx: {
          command: "node",
          args: [
            "${input:server_path}/build/index.js"
          ],
          env: {
            "DROPBOX_APP_KEY": "${input:dropbox_app_key}",
            "DROPBOX_APP_SECRET": "${input:dropbox_app_secret}",
            "DROPBOX_REDIRECT_URI": "${input:dropbox_redirect_uri}",
            "TOKEN_ENCRYPTION_KEY": "${input:token_encryption_key}",
            "TOKEN_REFRESH_THRESHOLD_MINUTES": "${input:token_refresh_minutes}",
            "MAX_TOKEN_REFRESH_RETRIES": "${input:max_refresh_retries}",
            "TOKEN_REFRESH_RETRY_DELAY_MS": "${input:refresh_retry_delay}"
          }
        }
      }
    },
    created_at: "2025-07-02T02:33:26.038Z",
    updated_at: "2025-07-02T02:33:26.038Z",
    mcp_server_inputs: JSON.stringify([
      {
        type: "promptString",
        id: "server_path",
        description: "Full path to dbx-mcp-server installation directory",
        password: false,
        required: true
      },
      {
        type: "promptString",
        id: "dropbox_app_key",
        description: "Dropbox App Key from developer console",
        password: true,
        required: true
      },
      {
        type: "promptString",
        id: "dropbox_app_secret",
        description: "Dropbox App Secret from developer console",
        password: true,
        required: true
      },
      {
        type: "promptString",
        id: "dropbox_redirect_uri",
        description: "OAuth redirect URI",
        password: false,
        required: true,
        default: "http://localhost:3000/callback"
      },
      {
        type: "promptString",
        id: "token_encryption_key",
        description: "32+ character key for token encryption",
        password: true,
        required: true
      },
      {
        type: "promptString",
        id: "token_refresh_minutes",
        description: "Minutes before token expiration to refresh",
        password: false,
        required: false,
        default: "5"
      },
      {
        type: "promptString",
        id: "max_refresh_retries",
        description: "Maximum number of token refresh attempts",
        password: false,
        required: false,
        default: "3"
      },
      {
        type: "promptString",
        id: "refresh_retry_delay",
        description: "Delay between refresh attempts in milliseconds",
        password: false,
        required: false,
        default: "1000"
      }
    ]),
    tags: JSON.stringify(["Dev Tools", "Data", "Collaboration", "Productivity"]),
    popularity: 85
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    git_repository: "https://github.com/GLips/Figma-Context-MCP",
    unique_name: "GLips/Figma-Context-MCP",
    short_description: "MCP server to provide Figma layout information to AI coding agents like Cursor. Enables one-shot design implementation from Figma files with comprehensive layout data extraction and component analysis.",
    versions: [
      {
        hash: "a1b2c3d4",
        date: "2025-01-15T10:30:00Z",
        tag: "v0.4.3"
      }
    ],
    keywords: ["figma", "design", "ui", "cursor", "ai", "layout", "frontend"],
    license: "MIT License",
    license_url: "https://raw.githubusercontent.com/GLips/Figma-Context-MCP/main/LICENSE",
    mcp_server_config: {
      mcpServers: {
        figma: {
          command: "npx",
          args: ["-y", "figma-developer-mcp", "--figma-api-key=${input:figma_api_key}", "--stdio"],
          env: {
            "FIGMA_API_KEY": "${input:figma_api_key}"
          }
        }
      }
    },
    created_at: "2025-01-15T10:30:00.000Z",
    updated_at: "2025-01-15T10:30:00.000Z",
    mcp_server_inputs: JSON.stringify([
      {
        type: "promptString",
        id: "figma_api_key",
        description: "Figma Personal Access Token (get from Figma Account Settings > Personal access tokens)",
        password: true,
        required: true
      }
    ]),
    tags: JSON.stringify(["Design", "Dev Tools", "AI"]),
    popularity: 95
  },
  {
    id: "f1e2d3c4-b5a6-7890-cdef-123456789abc",
    git_repository: "https://github.com/cloudflare/mcp-server-cloudflare",
    unique_name: "cloudflare/mcp-server-cloudflare",
    short_description: "MCP server for vectorizing and searching Cloudflare documentation. Provides semantic search capabilities for Cloudflare docs, examples, and comprehensive developer resources with real-time updates.",
    versions: [
      {
        hash: "i9j0k1l2",
        date: "2025-01-12T08:45:00Z",
        tag: "v1.2.0"
      }
    ],
    keywords: ["cloudflare", "docs", "vectorize", "search", "documentation", "semantic"],
    license: "Apache License 2.0",
    license_url: "https://raw.githubusercontent.com/cloudflare/mcp-server-cloudflare/main/LICENSE",
    mcp_server_config: {
      mcpServers: {
        "cloudflare-docs": {
          command: "npx",
          args: ["mcp-remote", "https://docs.mcp.cloudflare.com/sse"],
          env: {}
        }
      }
    },
    created_at: "2025-01-12T08:45:00.000Z",
    updated_at: "2025-01-12T08:45:00.000Z",
    mcp_server_inputs: JSON.stringify([]),
    tags: JSON.stringify(["Documentation", "Search", "Cloud"]),
    popularity: 88
  },
  {
    id: "e4d3c2b1-a098-7654-fedc-ba9876543210",
    git_repository: "https://github.com/modelcontextprotocol/servers",
    unique_name: "modelcontextprotocol/servers",
    short_description: "Comprehensive time and date utilities MCP server supporting timezone conversions, formatting, temporal calculations, scheduling operations, and calendar integrations for enhanced productivity workflows.",
    versions: [
      {
        hash: "q7r8s9t0",
        date: "2025-01-08T12:15:00Z",
        tag: "v0.5.1"
      }
    ],
    keywords: ["time", "date", "timezone", "formatting", "temporal", "utilities"],
    license: "MIT License",
    license_url: "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/LICENSE",
    mcp_server_config: {
      mcpServers: {
        time: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-time"],
          env: {}
        }
      }
    },
    created_at: "2025-01-08T12:15:00.000Z",
    updated_at: "2025-01-08T12:15:00.000Z",
    mcp_server_inputs: JSON.stringify([]),
    tags: JSON.stringify(["Utilities", "Productivity", "Time Management"]),
    popularity: 92
  },
  {
    id: "d5c4b3a2-9087-6543-edcb-a98765432109",
    git_repository: "https://github.com/microsoft/vscode-mcp-github",
    unique_name: "microsoft/vscode-mcp-github",
    short_description: "Advanced GitHub integration MCP server providing comprehensive repository management, issue tracking, pull request automation, code review workflows, and collaborative development tools for seamless GitHub operations.",
    versions: [
      {
        hash: "x1y2z3a4",
        date: "2025-01-20T14:00:00Z",
        tag: "v2.1.0"
      }
    ],
    keywords: ["github", "git", "repository", "issues", "pull-requests", "code-review"],
    license: "MIT License",
    license_url: "https://raw.githubusercontent.com/microsoft/vscode-mcp-github/main/LICENSE",
    mcp_server_config: {
      mcpServers: {
        github: {
          command: "npx",
          args: ["@microsoft/mcp-github", "--token=${input:github_token}"],
          env: {
            "GITHUB_TOKEN": "${input:github_token}"
          }
        }
      }
    },
    created_at: "2025-01-20T14:00:00.000Z",
    updated_at: "2025-01-20T14:00:00.000Z",
    mcp_server_inputs: JSON.stringify([
      {
        type: "promptString",
        id: "github_token",
        description: "GitHub Personal Access Token for repository access",
        password: true,
        required: true
      }
    ]),
    tags: JSON.stringify(["Dev Tools", "Collaboration", "Version Control"]),
    popularity: 97
  }
];

// Transform servers for backward compatibility
const transformedServers = mockMCPServers.map(transformMCPServer);

export const mockMCPDirectory: MCPServerDirectory = {
  servers: transformedServers,
  lastFetched: new Date().toISOString(),
  version: "2.0.0"
}; 