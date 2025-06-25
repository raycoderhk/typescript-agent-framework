# @xava-labs/server

A WebSocket server for managing MCP (Model Context Protocol) packages with SQLite persistence.

## Features

- 🚀 WebSocket API for MCP package management
- 📦 SQLite database integration
- 🧪 MCP server connection testing
- 🐳 Docker containerized
- ⚡ TypeScript with Node.js 22
- 🧶 Yarn package manager

## Quick Start

### Local Development

```bash
cd ../playground
pnpm i
pnpm dev
cd ../server
pnpm dev
```

### Docker Commands

```bash
# Build the Docker image (run from packages/server directory)
yarn docker:build

# Run the container with all necessary environment variables and volume mounts
yarn docker:run

# Build and run using docker-compose (recommended for development)
yarn docker:dev
```

**Command Details:**
- **`docker:build`**: Builds the Docker image from the monorepo root with the correct build context
- **`docker:run`**: Runs the container with host network access, environment variables, and data volume mounting
- **`docker:dev`**: Uses docker-compose to build and run the container with all configurations from `docker-compose.yml`


## WebSocket API

### Connection

```
ws://localhost:3000/ws
```

### Message Format

All messages must be valid JSON with this structure:

```json
{
  "verb": "add" | "delete" | "list",
  "data": { /* verb-specific data */ }
}
```

---

## API Reference

### 📦 `add` - Add MCP Package

**Request:**
```json
{
  "verb": "add",
  "data": {
    "unique-name": "my-mcp-server",
    "command": "npx",
    "args": ["-y", "some-mcp-package", "--stdio"],
    "env": {}
  }
}
```

**Success Response:**
```json
{
  "verb": "add",
  "success": true,
  "message": "MCP server 'my-mcp-server' added successfully",
  "data": {
    "id": 1,
    "name": "my-mcp-server",
    "command": "npx",
    "args": ["-y", "some-mcp-package", "--stdio"],
    "env": [],
    "installedAt": "2024-01-01T12:00:00.000Z"
  },
  "capabilities": {
    "tools": [{"name": "tool1", "description": "..."}],
    "resources": [],
    "prompts": []
  },
  "totalCapabilities": 5,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "verb": "add",
  "success": false,
  "error": "Failed to connect to MCP server",
  "details": "Connection timeout after 10000ms",
  "message": "The MCP server could not be reached or is not responding correctly.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 🗑️ `delete` - Remove MCP Package

**Request:**
```json
{
  "verb": "delete",
  "data": {
    "unique-name": "my-mcp-server"
  }
}
```

**Success Response:**
```json
{
  "verb": "delete",
  "success": true,
  "message": "Package 'my-mcp-server' removed successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "verb": "delete",
  "success": false,
  "error": "Package with unique-name 'my-mcp-server' not found",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 📋 `list` - List All Packages

**Request:**
```json
{
  "verb": "list"
}
```

**Response:**
```json
{
  "verb": "list",
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "my-mcp-server",
      "command": "npx",
      "args": ["-y", "some-mcp-package", "--stdio"],
      "env": [],
      "installedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Behavior

### ✅ Success Flow
1. **`add`**: Tests MCP server connection before storing
2. **`delete`**: Removes from database if exists
3. **`list`**: Returns all stored packages

### ❌ Error Handling
- **Invalid JSON**: `"Invalid JSON format"`
- **Missing verb**: `"Invalid message format"`
- **Invalid verb**: `"Invalid message format"`
- **Validation errors**: `"Validation failed"` with details
- **MCP connection fails**: `"Failed to connect to MCP server"`
- **Duplicate name**: `"Package with unique-name 'X' already exists"`
- **Not found**: `"Package with unique-name 'X' not found"`

### 🔄 MCP Connection Testing
- Tests actual connection to MCP server before storing
- Validates server exposes tools, resources, or prompts
- 10-second timeout for connections
- Only stores packages that successfully connect

---

## Examples

### JavaScript/Node.js
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  // Add Figma MCP
  ws.send(JSON.stringify({
    verb: 'add',
    data: {
      'unique-name': 'figma-mcp',
      command: 'npx',
      args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-KEY', '--stdio'],
      env: {}
    }
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Response:', response);
});

// List packages
ws.send(JSON.stringify({ verb: 'list' }));

// Delete package
ws.send(JSON.stringify({
  verb: 'delete', 
  data: { 'unique-name': 'figma-mcp' }
}));
```

### Browser
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to MCP server');
  
  // List existing packages
  ws.send(JSON.stringify({ verb: 'list' }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Server response:', response);
};
```

### curl (via websocat)
```bash
# Install websocat
curl -L https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-unknown-linux-musl > websocat
chmod +x websocat

# Add package
echo '{"verb":"add","data":{"unique-name":"test","command":"echo","args":["hello"],"env":{}}}' | ./websocat ws://localhost:3000/ws

# List packages  
echo '{"verb":"list"}' | ./websocat ws://localhost:3000/ws

# Delete package
echo '{"verb":"delete","data":{"unique-name":"test"}}' | ./websocat ws://localhost:3000/ws
```

---

## Configuration

Configure via `.env`:
```env
PORT=3000
DB_PATH=./data/packages.db
```

## Development

```bash
# Start server
yarn dev

# Run tests
yarn test:mcp

# Send test message
yarn send

# Build for production
yarn build

# Start production server
yarn start
```

## Database

- **File**: `./data/packages.db` (SQLite)
- **Schema**: `packages` table with id, uniqueName, command, args, env, installedAt
- **Persistence**: Database file is mounted as volume in Docker

## Health Check

```bash
curl http://localhost:3000/
```

```json
{
  "status": "ok",
  "message": "MCP WebSocket Server",
  "websocket": "ws://localhost:3000/ws",
  "version": "0.1.0"
}