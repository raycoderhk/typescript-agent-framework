import { Hono } from 'hono'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { z } from 'zod'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createPackageRepository, PackageRepository } from './persistence/index.js'

// Environment configuration
const PORT = parseInt(process.env.PORT || '3000')
const DB_PATH = process.env.DB_PATH || './data/packages.db'

// Ensure data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true })

// Initialize package repository
const packageRepo: PackageRepository = createPackageRepository('sqlite', DB_PATH)

// Validation schemas
const AddRequestSchema = z.object({
  'unique-name': z.string().min(1, 'unique-name is required'),
  command: z.string().min(1, 'command is required'),
  args: z.array(z.string()).optional().default([]),
  env: z.record(z.string()).optional().default({})
})

const DeleteRequestSchema = z.object({
  'unique-name': z.string().min(1, 'unique-name is required')
})

const WebSocketMessageSchema = z.object({
  verb: z.enum(['add', 'delete', 'list']),
  data: z.any().optional()
})

// Helper function to test MCP server connection
async function testMcpServerConnection(
  command: string, 
  args: string[], 
  env: Record<string, string>, 
  timeoutMs = 10000
) {
  let client: Client | null = null
  let transport: StdioClientTransport | null = null
  
  try {
    // Create transport with environment variables
    transport = new StdioClientTransport({
      command,
      args,
      env: { ...(process.env as Record<string, string>), ...env }
    })

    // Create client
    client = new Client({
      name: "mcp-server-tester",
      version: "1.0.0"
    })

    // Connect with timeout
    const connectPromise = client.connect(transport)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
    )
    
    await Promise.race([connectPromise, timeoutPromise])

    // Test the connection by listing capabilities
    const [toolsResult, resourcesResult, promptsResult] = await Promise.allSettled([
      client.listTools().catch(() => ({ tools: [] })),
      client.listResources().catch(() => ({ resources: [] })),
      client.listPrompts().catch(() => ({ prompts: [] }))
    ])

    // Extract results
    const tools = toolsResult.status === 'fulfilled' ? toolsResult.value.tools : []
    const resources = resourcesResult.status === 'fulfilled' ? resourcesResult.value.resources : []
    const prompts = promptsResult.status === 'fulfilled' ? promptsResult.value.prompts : []

    return {
      success: true,
      capabilities: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description
        })),
        resources: resources.map(resource => ({
          name: resource.name,
          description: resource.description,
          uri: resource.uri
        })),
        prompts: prompts.map(prompt => ({
          name: prompt.name,
          description: prompt.description
        }))
      },
      totalCapabilities: tools.length + resources.length + prompts.length
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
      capabilities: null,
      totalCapabilities: 0
    }
  } finally {
    // Clean up connections
    try {
      if (client) {
        await client.close()
      }
      if (transport) {
        await transport.close()
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError)
    }
  }
}

// WebSocket message handlers
async function handleAddCommand(data: any) {
  try {
    const validatedData = AddRequestSchema.parse(data)
    
    // Check if package already exists
    const existing = await packageRepo.findByUniqueName(validatedData['unique-name'])
    if (existing) {
      return {
        success: false,
        error: `Package with unique-name '${validatedData['unique-name']}' already exists`
      }
    }

    console.log(`Testing MCP server connection: ${validatedData.command}`, validatedData.args)
    
    // Test MCP server connection before storing
    const connectionTest = await testMcpServerConnection(
      validatedData.command,
      validatedData.args,
      validatedData.env
    )

    if (!connectionTest.success) {
      console.error(`MCP server connection failed for ${validatedData['unique-name']}:`, connectionTest.error)
      return {
        success: false,
        error: 'Failed to connect to MCP server',
        details: connectionTest.error,
        message: 'The MCP server could not be reached or is not responding correctly.'
      }
    }

    // If we have no capabilities at all, it might not be a valid MCP server
    if (connectionTest.totalCapabilities === 0) {
      console.warn(`MCP server ${validatedData['unique-name']} connected but has no capabilities`)
      return {
        success: false,
        error: 'MCP server has no capabilities',
        message: 'The server connected successfully but does not expose any tools, resources, or prompts.'
      }
    }

    // Connection successful, store in database
    const pkg = await packageRepo.create({
      uniqueName: validatedData['unique-name'],
      command: validatedData.command,
      args: validatedData.args,
      env: validatedData.env
    })
    
    console.log(`Successfully added MCP server: ${pkg.uniqueName}`)
    
    return {
      success: true,
      message: `MCP server '${pkg.uniqueName}' added successfully`,
      data: {
        id: pkg.id,
        name: pkg.uniqueName,
        command: pkg.command,
        args: pkg.args,
        env: Object.keys(pkg.env),
        installedAt: pkg.installedAt
      },
      capabilities: connectionTest.capabilities,
      totalCapabilities: connectionTest.totalCapabilities
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }
    
    console.error('Add command error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

async function handleDeleteCommand(data: any) {
  try {
    const validatedData = DeleteRequestSchema.parse(data)
    
    const removed = await packageRepo.deleteByUniqueName(validatedData['unique-name'])
    
    if (!removed) {
      return {
        success: false,
        error: `Package with unique-name '${validatedData['unique-name']}' not found`
      }
    }
    
    console.log(`Removed package: ${validatedData['unique-name']}`)
    
    return {
      success: true,
      message: `Package '${validatedData['unique-name']}' removed successfully`
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }
    
    console.error('Delete command error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

async function handleListCommand() {
  try {
    const packages = await packageRepo.findAll()
    const count = await packageRepo.count()
    
    return {
      success: true,
      data: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.uniqueName,
        command: pkg.command,
        args: pkg.args,
        env: Object.keys(pkg.env),
        installedAt: pkg.installedAt
      })),
      count
    }
  } catch (error) {
    console.error('List command error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

// Initialize Hono app
const app = new Hono()

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'MCP WebSocket Server',
    websocket: `ws://localhost:${PORT}/ws`,
    version: '0.1.0'
  })
})

// Start server
async function startServer() {
  try {
    console.log(`Server starting on port ${PORT}`)
    
    // Create HTTP server for both Hono and WebSocket
    const server = createServer()
    
    // Handle HTTP requests with Hono
    server.on('request', async (req, res) => {
      try {
        const response = await app.fetch(req as any)
        res.statusCode = response.status
        
        // Set headers
        for (const [key, value] of response.headers.entries()) {
          res.setHeader(key, value)
        }
        
        // Send body
        const body = await response.text()
        res.end(body)
      } catch (error) {
        res.statusCode = 500
        res.end('Internal Server Error')
      }
    })
    
    // Create WebSocket server
    const wss = new WebSocketServer({ server, path: '/ws' })
    
    wss.on('connection', (ws) => {
      console.log('WebSocket connection established')
      
      ws.on('message', async (data) => {
        try {
          const messageData = JSON.parse(data.toString())
          console.log('Received message:', messageData)
          
          // Validate message structure
          const validatedMessage = WebSocketMessageSchema.parse(messageData)
          
          let result: any
          
          // Handle different verbs
          switch (validatedMessage.verb) {
            case 'add':
              result = await handleAddCommand(validatedMessage.data)
              break
            case 'delete':
              result = await handleDeleteCommand(validatedMessage.data)
              break
            case 'list':
              result = await handleListCommand()
              break
            default:
              result = {
                success: false,
                error: `Unknown verb: ${validatedMessage.verb}`
              }
          }
          
          // Send response
          ws.send(JSON.stringify({
            verb: validatedMessage.verb,
            ...result,
            timestamp: new Date().toISOString()
          }))
          
        } catch (error) {
          console.error('Error processing message:', error)
          
          let errorMessage = 'Failed to process message'
          let details = undefined
          
          if (error instanceof z.ZodError) {
            errorMessage = 'Invalid message format'
            details = error.errors
          } else if (error instanceof SyntaxError) {
            errorMessage = 'Invalid JSON format'
          }
          
          ws.send(JSON.stringify({
            success: false,
            error: errorMessage,
            details,
            timestamp: new Date().toISOString()
          }))
        }
      })
      
      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
      console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`)
      console.log(`💾 Database: ${DB_PATH}`)
    })
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()