import { describe, it, expect } from 'vitest';
import app from '../src/app.js';  // Import from app.js now

describe('Server', () => {
  it('should return health check response', async () => {
    const req = new Request('http://localhost:3000/');
    const res = await app.fetch(req);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.message).toBe('Server is running');
    expect(data.version).toBe('0.1.0');
  });

  it('should validate /add endpoint with correct JSON', async () => {
    const req = new Request('http://localhost:3000/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'unique-name': 'test-package',
        'command': 'npm install',
        'args': ['--save', 'express'],
        'env': {
          'NODE_ENV': 'development'
        }
      }),
    });
    
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.package.name).toBe('test-package');
  });

  it('should reject /add endpoint with duplicate unique-name', async () => {
    const req1 = new Request('http://localhost:3000/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'unique-name': 'duplicate-test',
        'command': 'npm install',
      }),
    });
    
    await app.fetch(req1);
    
    const req2 = new Request('http://localhost:3000/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'unique-name': 'duplicate-test',
        'command': 'npm install',
      }),
    });
    
    const res = await app.fetch(req2);
    expect(res.status).toBe(409);
    
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
  });

  it('should validate /mcp endpoint', async () => {
    const req = new Request('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test-action',
        data: { foo: 'bar' }
      }),
    });
    
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('test-action');
  });
});