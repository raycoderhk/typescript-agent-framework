# Troubleshooting: Expense MCP Server Startup Issues

This guide documents the troubleshooting process and solutions for fixing startup issues with the Expense MCP example that was previously working but started failing with `npm run dev`.

## Problem Description

The Expense MCP server was failing to start properly with `npm run dev`, showing the following symptoms:

1. **MCP Inspector Connection Errors**: `Received 404 not found from MCP server. Does the MCP server support SSE?`
2. **Port Mismatch Issues**: Worker running on random ports while MCP inspector tried to connect to hardcoded port 8787
3. **404 Responses**: All endpoints returning 404 Not Found, including `/sse` endpoint
4. **Worker Not Responding**: Worker appeared to start but wasn't handling requests properly

## Root Cause Analysis

The main issues were:

### 1. **Incorrect Session Handling in Worker Entry Point**

**Problem**: The expense MCP server was using custom session management logic instead of following the MCP framework's expected pattern.

**Bad Code** (`src/index.ts`):
```typescript
// ❌ Custom session handling that breaks MCP framework
const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
const sessionKey = `client-${clientIP}-${url.searchParams.get('connectionId') || 'default'}`;
const id = env.EXPENSE_MCP_SERVER.idFromName(sessionKey);

// Don't modify the sessionId in the URL - let MCP handle it internally
return env.EXPENSE_MCP_SERVER.get(id).fetch(request);
```

**Good Code** (following CRUD MCP pattern):
```typescript
// ✅ Proper MCP session handling
const url = new URL(request.url);
const sessionIdStr = url.searchParams.get('sessionId')
const id = sessionIdStr
    ? env.EXPENSE_MCP_SERVER.idFromString(sessionIdStr)
    : env.EXPENSE_MCP_SERVER.newUniqueId();

url.searchParams.set('sessionId', id.toString());

return env.EXPENSE_MCP_SERVER.get(id).fetch(new Request(
    url.toString(),
    request
));
```

### 2. **Custom Route Overrides Conflicting with Base Framework**

**Problem**: The expense server had custom SSE handling and routing overrides that interfered with the base MCP framework.

**Bad Code** (`src/server.ts`):
```typescript
// ❌ Custom overrides that break MCP routing
async fetch(request: Request): Promise<Response> {
  // Custom logging and processing
  return super.fetch(request);
}

protected processSSEConnection(request: Request): Response {
  // Custom SSE handling
  return super.processSSEConnection(request);
}

protected setupRoutes(app: Hono<{ Bindings: any }>): void {
  super.setupRoutes(app);
  
  // Custom root route handling that conflicts with MCP
  app.get('/', (c) => {
    // Custom SSE logic
  });
}
```

**Good Code** (simplified like CRUD example):
```typescript
// ✅ Simple server that extends base class without overrides
export class ExpenseMcpServer extends McpHonoServerDO {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  getImplementation(): Implementation {
    return {
      name: 'ExpenseMcpServer',
      version: '1.0.0',
    };
  }

  configureServer(server: McpServer): void {
    const repository = new ExpenseRepository(this.ctx);
    this.ctx.blockConcurrencyWhile(async () => {
      repository.initializeDatabase();
    });

    setupServerTools(server, repository);
    setupServerResources(server, repository);
  }
}
```

## Step-by-Step Fix Process

### Step 1: Fix Worker Entry Point

Replace the custom session handling logic with the standard MCP pattern:

```bash
# Edit examples/expense-mcp/src/index.ts
```

**Changes**:
- Remove client IP-based session key generation
- Use `idFromString(sessionId)` or `newUniqueId()` pattern
- Ensure sessionId is set in URL before forwarding to Durable Object

### Step 2: Simplify Server Implementation

Remove all custom overrides that interfere with base MCP framework:

```bash
# Edit examples/expense-mcp/src/server.ts
```

**Changes**:
- Remove custom `fetch()` override
- Remove custom `processSSEConnection()` override  
- Remove custom `processMcpRequest()` override
- Remove custom `setupRoutes()` override
- Keep only the essential `configureServer()` method
- Re-enable `repository.initializeDatabase()` call

### Step 3: Clean Up Configuration

Ensure configuration matches working examples:

```bash
# Edit examples/expense-mcp/wrangler.jsonc and package.json
```

**Changes**:
- Remove custom port configuration from wrangler.jsonc
- Use standard dev script without custom environment variables
- Let worker use dynamic ports like other examples

## Testing the Fix

### Verify Worker Starts Correctly

```bash
cd examples/expense-mcp
npm run start
```

**Expected Output**:
```
⛅️ wrangler 4.25.0
───────────────────
Your Worker has access to the following bindings:
Binding                                        Resource            Mode
env.EXPENSE_MCP_SERVER (ExpenseMcpServer)      Durable Object      local

⎔ Starting local server...
[wrangler:info] Ready on http://localhost:XXXX
```

### Test with MCP Inspector

```bash
npm run dev
```

**Expected Behavior**:
- Worker starts on dynamic port
- MCP Inspector starts and opens browser
- SSE connections should work properly
- No 404 errors from MCP server

### Manual SSE Endpoint Test

```bash
# Test SSE endpoint directly (replace XXXX with actual port)
curl -H "Accept: text/event-stream" "http://localhost:XXXX/sse?sessionId=test123"
```

**Expected**: Should return SSE stream, not 404.

## Key Lessons Learned

### 1. **Follow Framework Patterns**

The MCP framework has specific expectations for:
- Session ID handling and propagation
- Durable Object ID generation
- Request routing and processing

**Don't**: Create custom session management logic
**Do**: Follow the established patterns from working examples

### 2. **Minimal Overrides**

When extending framework base classes:

**Don't**: Override core methods unless absolutely necessary
**Do**: Use the provided extension points (`configureServer()`, etc.)

### 3. **Configuration Consistency**

**Don't**: Add custom port configurations unless there's a specific need
**Do**: Use default dynamic port allocation like other examples

### 4. **Debugging Strategy**

When troubleshooting MCP servers:

1. **Start with worker alone**: Use `npm run start` to test worker in isolation
2. **Check request routing**: Verify worker responds to basic requests
3. **Test SSE endpoint**: Manually test `/sse` endpoint with proper headers
4. **Compare with working examples**: Use CRUD MCP as reference implementation

## Common Pitfalls to Avoid

### 1. **Session Management**
```typescript
// ❌ Don't create custom session keys
const sessionKey = `client-${clientIP}-${connectionId}`;

// ✅ Use MCP's sessionId pattern
const id = sessionIdStr ? env.SERVER.idFromString(sessionIdStr) : env.SERVER.newUniqueId();
```

### 2. **Route Handling**
```typescript
// ❌ Don't override core routing methods
protected setupRoutes(app: Hono) {
  super.setupRoutes(app);
  app.get('/', customHandler); // This can break MCP routing
}

// ✅ Let base class handle routing
// Only override configureServer() for tool/resource setup
```

### 3. **Port Configuration**
```json
// ❌ Don't hardcode ports in development
{
  "dev": {
    "port": 8787
  }
}

// ✅ Use dynamic ports
// No dev.port configuration needed
```

## Related Documentation

- [MCP Framework Documentation](../../packages/mcp/README.md)
- [CRUD MCP Example](../../examples/crud-mcp/README.md)
- [Cloudflare Workers Development Guide](https://developers.cloudflare.com/workers/)

## Prevention

To prevent similar issues in future:

1. **Use working examples as templates**: Base new MCP servers on CRUD example structure
2. **Minimal customization**: Only override what's necessary for your specific functionality
3. **Test frequently**: Run `npm run dev` after each significant change
4. **Follow naming conventions**: Use consistent patterns with other examples
