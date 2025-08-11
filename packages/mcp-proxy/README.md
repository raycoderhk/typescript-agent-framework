# MCP Proxy Example

This example demonstrates how to use the MCP Server Proxy functionality to create a Cloudflare Worker that can proxy MCP (Model Context Protocol) requests between web clients and remote containers.

## Overview

The MCP Proxy allows you to:
- Deploy a Cloudflare Worker that acts as an MCP server proxy
- Connect web clients to remote containers running MCP servers via WebSocket
- Forward MCP messages bidirectionally between clients and remote servers
- Support multiple concurrent client connections

## Architecture

The proxy provides two distinct WebSocket endpoints:

- **Client Endpoint** (`/client/ws`): For web application connections
- **Remote Container Endpoint** (`/remote-container/ws`): For remote container connections

Messages flow as follows:
1. Web clients connect to `/client/ws`
2. Remote containers connect to `/remote-container/ws`
3. Client messages are forwarded to the remote container
4. Remote container responses are broadcast to all connected clients

## Project Structure

```
mcp-proxy/
├── src/
│   ├── index.ts          # Main worker entry point
│   ├── server-proxy.ts   # Proxy implementation with dual endpoints
│   └── mcp-server-proxy.ts # Message forwarding logic
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

Once deployed, the worker provides WebSocket endpoints that require a `proxyId` parameter:

- **Client endpoint**: `/client/ws?proxyId=YOUR_UUID` - WebSocket endpoint for web application connections
- **Remote container endpoint**: `/remote-container/ws?proxyId=YOUR_UUID` - WebSocket endpoint for connecting remote containers

### ProxyId System

The proxy uses a `proxyId` parameter to create isolated instances. Each unique `proxyId` creates a separate Durable Object instance, allowing multiple independent proxy sessions.

- **ProxyId**: A unique identifier (typically a UUID) that isolates proxy sessions
- **Required**: All requests must include a `proxyId` search parameter
- **Format**: Any string, but UUIDs are recommended for uniqueness

## Client Connection

Web applications should connect to the client endpoint with a proxyId:

```javascript
const proxyId = 'your-unique-id-here'; // Generate or retrieve from storage
const ws = new WebSocket(`ws://localhost:6050/client/ws?proxyId=${proxyId}`);

// Send messages to remote container
ws.send(JSON.stringify({
  type: 'AddServerRequest',
  name: 'example-server',
  command: 'python',
  args: ['-m', 'example_mcp_server']
}));

// Receive responses from remote container
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Received from remote container:', response);
};
```

## Remote Container Connection

Remote containers should connect to the remote container endpoint with the same proxyId:

```javascript
const proxyId = 'your-unique-id-here'; // Same as used by client
const ws = new WebSocket(`ws://localhost:6050/remote-container/ws?proxyId=${proxyId}`);

// Handle messages from clients
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Process client requests and send responses
  ws.send(JSON.stringify({
    type: 'AddServerResponse',
    success: true,
    // ... response data
  }));
};
```

## Dependencies

- `@xava-labs/mcp`: The main MCP package providing server and proxy functionality
- `@cloudflare/workers-types`: TypeScript definitions for Cloudflare Workers
- `wrangler`: Cloudflare Workers CLI tool 