import { Hono } from 'hono';
import { submitExpense, approveExpense, rejectExpense, listExpenses } from './tools';

const app = new Hono();

// Add a root route for a friendly message
app.get('/', (c) => c.text('Expense MCP API is running!'));

app.post('/mcp/expense/submit', async (c) => {
  const input = await c.req.json();
  const result = await submitExpense(input, c.env);
  return c.json(result);
});

app.post('/mcp/expense/approve', async (c) => {
  const input = await c.req.json();
  const result = await approveExpense(input, c.env);
  return c.json(result);
});

app.post('/mcp/expense/reject', async (c) => {
  const input = await c.req.json();
  const result = await rejectExpense(input, c.env);
  return c.json(result);
});

app.get('/mcp/expense/list', async (c) => {
  const result = await listExpenses({}, c.env);
  return c.json(result);
});

export default app; 