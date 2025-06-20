import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { createPackageRepository, PackageRepository } from './persistence/index.js';

// Validation schemas
const AddRequestSchema = z.object({
  'unique-name': z.string().min(1, 'unique-name is required'),
  command: z.string().min(1, 'command is required'),
  args: z.array(z.string()).optional().default([]),
  env: z.record(z.string()).optional().default({})
});

const McpRequestSchema = z.object({
  action: z.string().min(1, 'action is required'),
  data: z.any().optional()
});

const app = new Hono();

// Initialize persistence layer
const packageRepo: PackageRepository = createPackageRepository('sqlite');

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Server is running',
    version: '0.1.0',
    endpoints: {
      mcp: 'POST /mcp',
      add: 'POST /add',
      remove: 'DELETE /remove/:name',
      packages: 'GET /packages',
      health: 'GET /'
    }
  });
});

// MCP endpoint
app.post('/mcp', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = McpRequestSchema.parse(body);
    
    return c.json({
      success: true,
      action: validatedData.action,
      result: `Processed MCP action: ${validatedData.action}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, 400);
    }
    
    console.error('MCP endpoint error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Add package endpoint
app.post('/add', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = AddRequestSchema.parse(body);
    
    const existing = await packageRepo.findByUniqueName(validatedData['unique-name']);
    if (existing) {
      return c.json({
        success: false,
        error: `Package with unique-name '${validatedData['unique-name']}' already exists`
      }, 409);
    }
    
    const pkg = await packageRepo.create({
      uniqueName: validatedData['unique-name'],
      command: validatedData.command,
      args: validatedData.args,
      env: validatedData.env
    });
    
    console.log(`Installing package: ${pkg.uniqueName}`);
    console.log(`Command: ${pkg.command}`, pkg.args);
    console.log('Environment variables:', pkg.env);
    
    return c.json({
      success: true,
      message: `Package '${pkg.uniqueName}' added successfully`,
      package: {
        id: pkg.id,
        name: pkg.uniqueName,
        command: pkg.command,
        args: pkg.args,
        env: Object.keys(pkg.env),
        installedAt: pkg.installedAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, 400);
    }
    
    console.error('Add endpoint error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Remove package endpoint
app.delete('/remove/:name', async (c) => {
  try {
    const name = c.req.param('name');
    
    if (!name) {
      return c.json({
        success: false,
        error: 'Package name is required'
      }, 400);
    }
    
    const removed = await packageRepo.deleteByUniqueName(name);
    
    if (!removed) {
      return c.json({
        success: false,
        error: `Package with unique-name '${name}' not found`
      }, 404);
    }
    
    console.log(`Removed package: ${name}`);
    
    return c.json({
      success: true,
      message: `Package '${name}' removed successfully`
    });
  } catch (error) {
    console.error('Remove endpoint error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// List packages
app.get('/packages', async (c) => {
  try {
    const packages = await packageRepo.findAll();
    const count = await packageRepo.count();
    
    return c.json({
      success: true,
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.uniqueName,
        command: pkg.command,
        args: pkg.args,
        env: Object.keys(pkg.env),
        installedAt: pkg.installedAt
      })),
      count
    });
  } catch (error) {
    console.error('Packages endpoint error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Error handlers
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    success: false,
    error: 'Internal server error'
  }, 500);
});

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    availableEndpoints: ['/mcp', '/add', '/remove/:name', '/packages', '/']
  }, 404);
});

export default app;