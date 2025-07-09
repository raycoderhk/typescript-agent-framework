# Expense Tracker MCP Example

This example demonstrates how to use Cloudflare Workflows via an MCP Server to track and approve expenses.

## Features

- Submit an expense (starts a workflow)
- Approve or reject an expense (triggers workflow event)
- List all expenses

## Running Locally

```sh
yarn install
cd examples/expense-mcp
yarn dev
# or: npx wrangler dev
```

## API Endpoints (PowerShell Examples)

### Submit an Expense

```powershell
Invoke-WebRequest -Uri http://localhost:8787/mcp/expense/submit `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "user": "alice", "amount": 42.5, "description": "Lunch with client" }'
```

### Approve an Expense

```powershell
Invoke-WebRequest -Uri http://localhost:8787/mcp/expense/approve `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "expenseId": "<id from submit response>" }'
```

### Reject an Expense

```powershell
Invoke-WebRequest -Uri http://localhost:8787/mcp/expense/reject `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "expenseId": "<id from submit response>" }'
```

### List Expenses

```powershell
Invoke-WebRequest -Uri http://localhost:8787/mcp/expense/list
```

## Notes

- This example uses an in-memory store for simplicity. In production, use D1 or KV for persistence.
- The workflow logic is in `src/workflow.ts`.
- The MCP server is in `src/server.ts`. 