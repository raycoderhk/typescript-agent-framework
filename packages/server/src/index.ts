import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import WebSocket from 'ws'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { z } from 'zod'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebSocketTransport } from '@xava-labs/mcp/dist/mcp/websocket-transport.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createPackageRepository, PackageRepository } from './persistence/index.js'

// Environment configuration
const PORT = parseInt(process.env.PORT || '3001')
const DB_PATH = process.env.DB_PATH || './data/packages.db'
const MCP_PROXY_URL = process.env.MCP_PROXY_URL || 'ws://localhost:6050/api/remote-container/ws'

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

// Global WebSocket instance to prevent multiple connections
let globalWs: WebSocket | null = null;
let isConnecting = false;

// Operation lock to prevent race conditions
let operationInProgress = false;
let operationType: string | null = null;

// Connect to MCP proxy as WebSocket client
async function connectToMcpProxy() {
  if (isConnecting) {
    console.log('⚠️ Connection already in progress, skipping...')
    return;
  }
  
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    console.log('⚠️ Already connected to MCP proxy, skipping...')
    return;
  }
  
  try {
    isConnecting = true;
    console.log(`Connecting to MCP proxy at: ${MCP_PROXY_URL}`)
    console.log(`💾 Database: ${DB_PATH}`)
    
    // Connect to MCP proxy as WebSocket client
    const ws = new WebSocket(MCP_PROXY_URL)
    globalWs = ws;

    // Use this MCP server as the frontfacing proxy to other MCP servers
    const mcpServer = new Server({
      name: 'mcp-proxy-server',
      version: '1.0.0'
    });

    const transport = new WebSocketTransport(ws as any, "fake-id");
    mcpServer.connect(transport);

    ws.on('open', () => {
      isConnecting = false;
      console.log('✅ Connected to MCP proxy server')
      console.log('🔍 WebSocket readyState:', ws.readyState)
      
      // Send an initial identification message
      ws.send(JSON.stringify({
        type: 'client_ready',
        clientId: 'mcp-package-manager',
        timestamp: new Date().toISOString()
      }))
    })
    
    ws.on('message', async (data: Buffer) => {
      const messageData = JSON.parse(data.toString())
      console.log('📨 Received message from MCP proxy:', messageData)

      // Doesn't contain verb, then process it as a MCP message
      if (!messageData.verb) {
        transport.handleMessage(messageData)
        return;
      }

      try {
        
        // Validate message structure
        const validatedMessage = WebSocketMessageSchema.parse(messageData)
        
        // Check if we should defer list requests during add/delete operations
        if (validatedMessage.verb === 'list' && operationInProgress) {
          console.log(`⏳ Deferring list request - ${operationType} operation in progress`)
          // Don't process list requests while add/delete is in progress
          // The auto-sent list after the operation will provide the updated state
          return;
        }
        
        let result: any
        
        // Handle different verbs
        switch (validatedMessage.verb) {
          case 'add':
            operationInProgress = true;
            operationType = 'add';
            console.log('🔒 Starting add operation - locking list requests')
            try {
              result = await handleAddCommand(validatedMessage.data)
            } finally {
              operationInProgress = false;
              operationType = null;
              console.log('🔓 Add operation completed - unlocking list requests')
            }
            break
          case 'delete':
            operationInProgress = true;
            operationType = 'delete';
            console.log('🔒 Starting delete operation - locking list requests')
            try {
              result = await handleDeleteCommand(validatedMessage.data)
            } finally {
              operationInProgress = false;
              operationType = null;
              console.log('🔓 Delete operation completed - unlocking list requests')
            }
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
        
        // Send response back to MCP proxy with error handling
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('⚠️ Cannot send response - WebSocket not open, readyState:', ws.readyState)
          console.log('🔄 Triggering reconnection due to closed WebSocket')
          setTimeout(() => connectToMcpProxy(), 100)
          return;
        }
        
        try {
          ws.send(JSON.stringify({
            verb: validatedMessage.verb,
            ...result,
            timestamp: new Date().toISOString()
          }))
          console.log('📤 Sent response to MCP proxy')
        } catch (error) {
          console.error('❌ Failed to send response to MCP proxy:', error)
          console.log('🔄 Connection may be broken, attempting reconnect...')
          // Trigger immediate reconnection
          setTimeout(() => connectToMcpProxy(), 100)
          return; // Don't try to send auto-updated list if initial send failed
        }
        
        // Auto-send updated list after successful add/delete operations
        if ((validatedMessage.verb === 'add' || validatedMessage.verb === 'delete') && result.success) {
          console.log('🔄 Auto-sending updated server list after successful', validatedMessage.verb)
          
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send auto-updated list - WebSocket not open, readyState:', ws.readyState)
            console.log('🔄 Triggering reconnection due to closed WebSocket during list update')
            setTimeout(() => connectToMcpProxy(), 100)
            return;
          }
          
          try {
            const listResult = await handleListCommand()
            ws.send(JSON.stringify({
              verb: 'list',
              ...listResult,
              timestamp: new Date().toISOString()
            }))
            console.log('📤 Sent auto-updated server list')
          } catch (error) {
            console.error('❌ Error sending auto-updated list:', error)
            console.log('🔄 Connection may be broken during list update, attempting reconnect...')
            // Trigger immediate reconnection
            setTimeout(() => connectToMcpProxy(), 100)
          }
        }
        
      } catch (error) {
        console.error('❌ Error processing message from MCP proxy:', error)
        
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
    
    ws.on('close', (code, reason) => {
      isConnecting = false;
      globalWs = null;
      console.log('❌ Disconnected from MCP proxy server')
      console.log('🔍 Close code:', code)
      console.log('🔍 Close reason:', reason.toString())
      console.log('🔍 WebSocket readyState:', ws.readyState)
      
      // Implement reconnection logic
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MCP proxy...')
        connectToMcpProxy() // Recursive reconnection
      }, 5000)
    })
    
    ws.on('error', (error: Error) => {
      isConnecting = false;
      globalWs = null;
      console.error('❌ WebSocket connection error:', error)
      // Try to reconnect after error
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect after error...')
        connectToMcpProxy()
      }, 5000)
    })
    
  } catch (error) {
    isConnecting = false;
    globalWs = null;
    console.error('Failed to connect to MCP proxy:', error)
    // Retry connection
    setTimeout(() => {
      console.log('🔄 Retrying connection...')
      connectToMcpProxy()
    }, 5000)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const mcpProxyArgIndex = args.findIndex(arg => arg === '--mcp-proxy' || arg === '-m')
if (mcpProxyArgIndex !== -1 && args[mcpProxyArgIndex + 1]) {
  // Override the MCP_PROXY_URL with command line argument
  process.env.MCP_PROXY_URL = args[mcpProxyArgIndex + 1]
  console.log(`Using MCP proxy URL from command line: ${args[mcpProxyArgIndex + 1]}`)
}

// Start the HTTP server
serve({
  fetch: app.fetch,
  port: PORT
}, () => {
  console.log(`🚀 HTTP server started on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}`)
})

// Connect to MCP proxy
connectToMcpProxy()

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal} signal, initiating graceful shutdown...`)
  
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    console.log('📤 Sending shutdown notification to MCP proxy')
    
    try {
      // Send goodbye message to proxy
      globalWs.send(JSON.stringify({
        type: 'client_shutdown',
        clientId: 'mcp-package-manager',
        message: 'Server shutting down gracefully',
        timestamp: new Date().toISOString()
      }))
      
      // Give a moment for the message to send, then close
      setTimeout(() => {
        console.log('🔌 Closing WebSocket connection')
        globalWs?.close(1000, 'Server shutdown')
        globalWs = null
        
        console.log('✅ Graceful shutdown complete')
        process.exit(0)
      }, 500)
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error)
      globalWs?.close()
      globalWs = null
      process.exit(1)
    }
  } else {
    console.log('✅ No active WebSocket connection, exiting immediately')
    process.exit(0)
  }
}

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')) // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION')
})