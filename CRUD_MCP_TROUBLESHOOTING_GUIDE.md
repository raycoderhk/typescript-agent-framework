# CRUD MCP Troubleshooting Guide: Lessons Learned

A comprehensive guide documenting real-world troubleshooting scenarios and solutions encountered while setting up the CRUD MCP (Model Context Protocol) example on Cloudflare Workers.

## Table of Contents
- [Overview](#overview)
- [Common Setup Issues](#common-setup-issues)
- [SQL Parameter Binding Errors](#sql-parameter-binding-errors)
- [Testing Command Issues](#testing-command-issues)
- [MCP Inspector Connection Problems](#mcp-inspector-connection-problems)
- [Directory Context Issues](#directory-context-issues)
- [Package Manager Conflicts](#package-manager-conflicts)
- [Key Takeaways](#key-takeaways)

## Overview

This guide documents real troubleshooting scenarios encountered during CRUD MCP setup, providing solutions and prevention strategies for common issues.

**Original Repository:** [typescript-agent-framework](https://github.com/raycoderhk/tutorials/tree/main/crud-mcp-docs)

## Common Setup Issues

### Issue 1: SQL Parameter Binding Error

**Problem:**
```
Error: Wrong number of parameter bindings for SQL query
```

**Root Cause:**
Cloudflare Durable Objects SQLite API expects SQL parameters to be passed individually (spread), not as arrays.

**Location:** `src/repository.ts` lines 190 and 240

**Before (Broken):**
```typescript
const results = await this.ctx.storage.sql.exec(query, params);
```

**After (Fixed):**
```typescript
const results = await this.ctx.storage.sql.exec(query, ...params);
```

**Files Modified:**
- `examples/crud-mcp/src/repository.ts` (2 lines total)

**Impact:** 
- ✅ Restored full functionality for `listTodos` and `getTodaysTodos` functions
- ✅ Fixed filtering, searching, and pagination features

### Issue 2: Missing Dependencies

**Problem:**
```
Command "concurrently" not found
```

**Solution:**
```bash
# Install missing concurrently dependency
npx yarn add concurrently
```

**Prevention:** Always check `package.json` for required dependencies before running dev scripts.

## Testing Command Issues

### Issue 3: Missing Test Scripts

**Problem:**
```bash
npx yarn test:watch
error Command "test:watch" not found.
```

**Root Cause:** Test scripts weren't defined in `package.json`

**Solution:** Added comprehensive test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run test/integration",
    "test:perf": "vitest run test/performance",
    "test:setup": "wrangler d1 create test-database"
  }
}
```

**Working Commands:**
- ✅ `npm test` - Basic test execution
- ✅ `npx yarn test:watch` - Watch mode
- ✅ `npx yarn test:ui` - Visual test interface
- ✅ `npx vitest run --reporter=verbose todo-mcp-client` - Specific test files

### Issue 4: Vitest Coverage Compatibility

**Problem:**
```
Error: 'node:inspector' is not available in Cloudflare Workers
```

**Explanation:** 
- `@vitest/coverage-v8` has compatibility issues with Cloudflare Workers runtime
- Coverage tools require Node.js APIs not available in Workers

**Workaround:** Use basic testing without coverage for Cloudflare Workers projects.

## MCP Inspector Connection Problems

### Issue 5: Auto-Detection vs Manual Configuration

**Problem:** MCP Inspector required manual transport configuration with `npm run dev` but auto-detected with `npx yarn dev`.

**Solution:** Manual configuration when auto-detection fails:

**Transport Settings:**
- **Type:** SSE (Server-Sent Events)
- **URL:** `http://localhost:8787/sse`

**Expected Behavior:**
- ✅ Connected status (green indicator)
- ✅ Tools tab shows: `create_todo`, `updateTodo`, `deleteTodo`, `completeTodo`
- ✅ Resources tab shows: `d1://database/todos`, `d1://database/todos/stats`, `d1://database/todos/today`

### Issue 6: 404 Errors are Normal

**Important:** MCP servers return 404 for root paths (`/`, `/favicon.ico`) - this is **expected behavior**.

**Valid Endpoints:**
- `/sse` - Server-Sent Events transport
- `/ws` - WebSocket transport (if configured)

## Directory Context Issues

### Issue 7: Wrong Directory Execution

**Critical Issue:** Running commands from wrong directory causes multiple failures.

**Examples:**

❌ **Wrong (from monorepo root):**
```bash
/typescript-agent-framework $ npm run test:watch
# Error: Missing script
```

✅ **Correct (from crud-mcp directory):**
```bash
/typescript-agent-framework/examples/crud-mcp $ npm run test:watch
# Works correctly
```

**Rule:** Always run project-specific commands from the project directory, not the monorepo root.

## Package Manager Conflicts

### Issue 8: npm vs yarn Workspace Issues

**Problem:** Mixing npm and yarn in monorepo causes dependency conflicts.

**Symptoms:**
- Module resolution errors
- Version conflicts
- Caching issues

**Solution:**
1. Use yarn consistently in workspace projects
2. Clean up conflicting package-lock.json files
3. Install dependencies at workspace level first

**Commands:**
```bash
# Clean up conflicts
rm -rf node_modules package-lock.json

# Use yarn consistently
npx yarn install
npx yarn workspaces run build
```

### Issue 9: Permission Issues with Global Installs

**Problem:**
```
Permission denied: global package installation
```

**Solutions:**
1. **Use npx (Recommended):**
   ```bash
   npx yarn --version  # Instead of global yarn
   npx wrangler dev    # Instead of global wrangler
   ```

2. **Local project dependencies:**
   ```bash
   npm install --save-dev wrangler
   npx wrangler dev
   ```

## Key Takeaways

### 🎯 **Best Practices Learned**

1. **Always check directory context** - Most errors stem from running commands in wrong directories
2. **Use consistent package managers** - Don't mix npm and yarn in the same project
3. **Understand Cloudflare Workers limitations** - Some Node.js tools don't work in Workers runtime
4. **MCP Inspector configuration** - Know when to use manual vs auto-detection
5. **SQL parameter handling** - Spread parameters for Cloudflare Durable Objects

### 🔧 **Essential Debugging Steps**

1. **Verify current directory:** `pwd`
2. **Check available scripts:** `npm run` or `npx yarn run`
3. **Confirm dependencies:** Check `package.json` and `node_modules`
4. **Test basic functionality:** Run simple commands first
5. **Check MCP endpoints:** Test `/sse` endpoint specifically

### 📝 **Testing Strategy**

1. **Start simple:** Basic `npm test` first
2. **Use watch mode:** `npx yarn test:watch` for development
3. **Leverage UI mode:** `npx yarn test:ui` for visual debugging
4. **Run specific tests:** Target individual test files when debugging

### 🚀 **Success Metrics**

Final working state achieved:
- ✅ **13/13 tests passing** consistently
- ✅ **All CRUD operations** working via MCP Inspector
- ✅ **Development server** running on `localhost:8787`
- ✅ **MCP Inspector** connected on `localhost:6274`
- ✅ **Complete test suite** with watch and UI modes

## Resources

- **MCP Documentation:** Model Context Protocol specification
- **Cloudflare Workers:** [docs.cloudflare.com](https://docs.cloudflare.com)
- **Vitest Testing:** [vitest.dev](https://vitest.dev)
- **Original Tutorial Repository:** [raycoderhk/tutorials](https://github.com/raycoderhk/tutorials/tree/main/crud-mcp-docs)

---

*This guide was created from real troubleshooting sessions to help developers avoid common pitfalls and resolve issues quickly.*
