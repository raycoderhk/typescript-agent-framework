import { MCPServer, MCPServerDirectory } from '@/types/mcp-server';

export const mockMCPServers: MCPServer[] = [
  {
    id: "figma-context-mcp",
    name: "Figma Context MCP",
    shortDescription: "MCP server to provide Figma layout information to AI coding agents like Cursor. Enables one-shot design implementation from Figma files.",
    repository: {
      type: "git",
      url: "https://github.com/GLips/Figma-Context-MCP.git"
    },
    inputs: [
      {
        type: "promptString",
        id: "figma_api_key",
        description: "Figma Personal Access Token (get from Figma Account Settings > Personal access tokens)",
        password: true
      }
    ],
    mcpServerConfig: {
      command: "npx",
      args: ["-y", "figma-developer-mcp", "--figma-api-key=${input:figma_api_key}", "--stdio"],
      env: {
        "FIGMA_API_KEY": "${input:figma_api_key}"
      }
    },
    versions: [
      {
        hash: "a1b2c3d4",
        date: "2025-01-15T10:30:00Z",
        tag: "v0.4.3"
      },
      {
        hash: "e5f6g7h8",
        date: "2025-01-10T14:20:00Z",
        tag: "v0.4.2"
      }
    ],
    keywords: ["figma", "design", "ui", "cursor", "ai", "layout", "frontend"],
    licenses: ["MIT"],
    category: "Design & Development",
    author: "GLips",
    homepage: "https://framelink.ai/",
    documentation: "https://github.com/GLips/Figma-Context-MCP#readme",
    searchText: "figma context mcp design ui cursor ai layout frontend framelink figma-developer-mcp",
    popularity: 95,
    lastUpdated: "2025-01-15T10:30:00Z"
  },
  {
    id: "cloudflare-docs-vectorize",
    name: "Cloudflare Docs Vectorize MCP",
    shortDescription: "MCP server for vectorizing and searching Cloudflare documentation. Provides semantic search capabilities for Cloudflare docs and examples.",
    repository: {
      type: "git",
      url: "https://github.com/cloudflare/mcp-server-cloudflare.git",
      directory: "apps/docs-vectorize"
    },
    mcpServerConfig: {
      command: "npx",
      args: ["mcp-remote", "https://docs.mcp.cloudflare.com/sse"],
      env: {}
    },
    versions: [
      {
        hash: "i9j0k1l2",
        date: "2025-01-12T08:45:00Z",
        tag: "v1.2.0"
      },
      {
        hash: "m3n4o5p6",
        date: "2025-01-05T16:30:00Z",
        tag: "v1.1.5"
      }
    ],
    keywords: ["cloudflare", "docs", "vectorize", "search", "documentation", "semantic"],
    licenses: ["Apache-2.0"],
    category: "Documentation & Search",
    author: "Cloudflare",
    homepage: "https://developers.cloudflare.com/",
    documentation: "https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/docs-vectorize#readme",
    searchText: "cloudflare docs vectorize search documentation semantic mcp server workers",
    popularity: 88,
    lastUpdated: "2025-01-12T08:45:00Z"
  },
  {
    id: "time-mcp-server",
    name: "Time MCP Server",
    shortDescription: "MCP server providing comprehensive time and date utilities. Supports timezone conversions, formatting, and temporal calculations.",
    repository: {
      type: "git",
      url: "https://github.com/modelcontextprotocol/servers.git",
      directory: "src/time"
    },
    mcpServerConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-time"],
      env: {}
    },
    versions: [
      {
        hash: "q7r8s9t0",
        date: "2025-01-08T12:15:00Z",
        tag: "v0.5.1"
      },
      {
        hash: "u1v2w3x4",
        date: "2024-12-28T09:20:00Z",
        tag: "v0.5.0"
      }
    ],
    keywords: ["time", "date", "timezone", "formatting", "temporal", "utilities"],
    licenses: ["MIT"],
    category: "Utilities",
    author: "Model Context Protocol",
    homepage: "https://modelcontextprotocol.io/",
    documentation: "https://github.com/modelcontextprotocol/servers/tree/main/src/time#readme",
    searchText: "time date timezone formatting temporal utilities mcp server modelcontextprotocol",
    popularity: 92,
    lastUpdated: "2025-01-08T12:15:00Z"
  }
];

export const mockMCPDirectory: MCPServerDirectory = {
  servers: mockMCPServers,
  lastFetched: new Date().toISOString(),
  version: "1.0.0"
}; 