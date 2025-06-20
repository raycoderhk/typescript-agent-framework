import { serve } from '@hono/node-server';
import app from './app.js';

const port = parseInt(process.env.PORT || '3000');

console.log(`Starting server on port ${port}`);
console.log(`Database path: ${process.env.DATABASE_PATH || './data/packages.db.sqlite'}`);

serve({
  fetch: app.fetch,
  port,
});