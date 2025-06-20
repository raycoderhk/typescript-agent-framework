# MCP Add Request Testing Guide

This document explains how to test the newly implemented MCP add request functionality, specifically focusing on the Time MCP server integration.

## Implementation Overview

The following components have been implemented:

### 1. API Endpoints (`/api/mcp-servers`)
- **POST** `/api/mcp-servers` - Add a new MCP server
- **GET** `/api/mcp-servers` - List all MCP servers

### 2. Server Proxy Updates (`McpServerProxyDO`)
- Added `/add-server` endpoint to handle add requests
- Added `/list-servers` endpoint to handle list requests
- Both endpoints forward messages to remote container via WebSocket

### 3. Frontend Integration
- Updated `MCPServerDirectory` component to call API when toggling servers
- Added proper TypeScript types for API responses
- Integrated with Cloudflare Worker environment

## Testing the Time MCP Server

### Prerequisites
1. Ensure the MCP proxy server is running (typically at `ws://localhost:8787/remote-container/ws`)
2. Ensure the package manager server is running (typically at `ws://localhost:3000/ws`)
3. The playground should be accessible at the appropriate URL

### Test Steps

1. **Navigate to the Playground**
   - Open the playground homepage where the MCP Server Directory is displayed

2. **Locate the Time MCP Server**
   - Find the "Time MCP Server" card in the directory
   - It should show:
     - Name: "Time MCP Server"
     - Command: `npx`
     - Args: `["-y", "@modelcontextprotocol/server-time"]`
     - Environment: `{}`

3. **Toggle the Server**
   - Click the toggle switch on the Time MCP Server card
   - This should trigger the add request

4. **Expected Behavior**
   - The toggle should call `POST /api/mcp-servers` with the Time MCP configuration
   - The request should be forwarded to the `McpServerProxyDO` at `/add-server`
   - The proxy should forward the message to the remote container via WebSocket
   - If successful, the server should remain toggled "on"
   - If failed, an alert should show the error message

### API Request Format

When toggling the Time MCP server, the following request is sent:

```json
POST /api/mcp-servers
{
  "uniqueName": "time-mcp-server",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-time"],
  "env": {}
}
```

### WebSocket Message Format

The message forwarded to the remote container:

```json
{
  "verb": "add",
  "data": {
    "unique-name": "time-mcp-server",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-time"],
    "env": {}
  }
}
```

## Debugging

### Check Browser Console
- Look for success/error messages when toggling servers
- Check for network request failures

### Check Server Logs
- Monitor the MCP proxy server logs for incoming WebSocket messages
- Monitor the package manager server logs for add/delete operations

### Verify WebSocket Connections
- Ensure the proxy has an active WebSocket connection to the package manager
- Verify that messages are being forwarded correctly

## Current Limitations

1. **Response Handling**: The current implementation doesn't wait for responses from the remote container - it immediately returns success
2. **Delete Functionality**: Delete operations are not yet implemented (marked as TODO)
3. **Error Handling**: Basic error handling is in place but could be enhanced

## Next Steps

1. Implement proper response handling from remote container
2. Add delete functionality for disabling MCP servers
3. Add loading states during server operations
4. Enhance error handling and user feedback

## File Structure

```
packages/playground/
├── src/app/api/mcp-servers/route.ts     # API endpoints
├── src/components/mcp-server-directory.tsx  # Frontend component
├── worker-configuration.d.ts            # TypeScript bindings
└── wrangler.jsonc                       # Durable Object configuration

packages/mcp/src/mcp/
└── server-proxy.ts                      # Server proxy with new endpoints
``` 