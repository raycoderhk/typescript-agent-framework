# MCP Proxy Example

This example demonstrates how to use the MCP Server Proxy functionality to create a Cloudflare Worker that can proxy MCP (Model Context Protocol) requests to remote containers.

## Overview

The MCP Proxy allows you to:
- Deploy a Cloudflare Worker that acts as an MCP server proxy
- Connect to remote containers running MCP servers
- Forward MCP messages bidirectionally between clients and remote servers

## Project Structure

```
mcp-proxy/
├── src/
│   └── index.ts          # Main worker entry point
├── package.json          # Project dependencies and scripts
├── wrangler.jsonc        # Cloudflare Workers configuration
├── tsconfig.json         # TypeScript configuration
└── worker-configuration.d.ts  # Generated type definitions
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate types (if needed):
   ```bash
   npm run types
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Usage

Once deployed, the worker provides:

- **Main endpoint**: Routes requests to the MCP Server Proxy Durable Object
- **Remote container endpoint**: `/remote-container/ws` - WebSocket endpoint for connecting remote containers

## Architecture

The proxy uses:
- **McpServerProxyDO**: A Durable Object that extends the base MCP server functionality
- **WebSocket connections**: For real-time bidirectional communication
- **Message forwarding**: Transparent proxy between clients and remote MCP servers

## Dependencies

- `@xava-labs/mcp`: The main MCP package providing server and proxy functionality
- `@cloudflare/workers-types`: TypeScript definitions for Cloudflare Workers
- `wrangler`: Cloudflare Workers CLI tool 