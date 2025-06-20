# Server

HTTP server built with Hono and TypeScript for MCP (Model Context Protocol) operations and package management.

## Features

- **REST API** with Hono framework
- **JSON validation** with Zod schemas
- **TypeScript** with strict typing
- **Docker** ready
- **CORS** and logging middleware

## Endpoints

### `GET /`
Health check and API information.

### `POST /mcp`
Process MCP requests.

```json
{
  "action": "string (required)",
  "data": "any (optional)"
}
```

### `POST /add`
Add packages to the system.

```json
{
  "unique-name": "my-package",
  "command": "npm install",
  "args": ["--save", "express"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### `GET /packages`
List all registered packages.

## Development

### Prerequisites
- Node.js 22+
- Yarn
- Docker

### Local Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Docker Deployment

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Server runs on `http://localhost:3000`

## API Examples

```bash
# Health check
curl http://localhost:3000/

# Add package
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{
    "unique-name": "my-tool",
    "command": "npm install",
    "args": ["-g", "typescript"],
    "env": {"NODE_ENV": "production"}
  }'

# MCP request
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"action": "process-data", "data": {"key": "value"}}'

# List packages
curl http://localhost:3000/packages
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode

## Error Responses

```json
{
  "success": false,
  "error": "Error description",
  "details": []
}
```

**Status Codes:** 200 (Success), 400 (Bad Request), 404 (Not Found), 409 (Conflict), 500 (Server Error)

## License

MIT

```
npx @modelcontextprotocol/inspector
```