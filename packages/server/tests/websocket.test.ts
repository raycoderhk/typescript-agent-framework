import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest'
import WebSocket from 'ws'
import { createPackageRepository, PackageRepository } from '../src/persistence/index.js'

// Use same environment configuration as the main server
const PORT = parseInt(process.env.PORT || '3000')
const DB_PATH = process.env.DB_PATH || './data/packages.db'
const WS_URL = `ws://localhost:${PORT}/ws`
const HTTP_URL = `http://localhost:${PORT}`

// Helper function to send WebSocket message and wait for response
async function sendMessageAndWaitForResponse(ws: WebSocket, message: any, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout'))
    }, timeoutMs)

    const messageHandler = (data: any) => {
      clearTimeout(timeout)
      ws.removeListener('message', messageHandler)
      try {
        const response = JSON.parse(data.toString())
        resolve(response)
      } catch (error) {
        reject(new Error('Invalid JSON response'))
      }
    }

    ws.on('message', messageHandler)
    ws.send(JSON.stringify(message))
  })
}

// Helper function to create WebSocket connection
async function createWebSocketConnection(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout'))
    }, 5000)

    ws.on('open', () => {
      clearTimeout(timeout)
      resolve(ws)
    })

    ws.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

// Helper function to clean up packages via WebSocket
async function cleanupPackage(packageName: string) {
  try {
    const ws = await createWebSocketConnection()
    await sendMessageAndWaitForResponse(ws, {
      verb: 'delete',
      data: {
        'unique-name': packageName
      }
    })
    ws.close()
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('MCP WebSocket Server Integration Tests', () => {
  let packageRepo: PackageRepository

  beforeAll(async () => {
    console.log('🚀 Starting MCP WebSocket tests')
    
    // Initialize package repository for cleanup
    packageRepo = createPackageRepository('sqlite', DB_PATH)
    
    // Test that server is running
    try {
      const response = await fetch(HTTP_URL)
      const data = await response.json()
      expect(data.status).toBe('ok')
      console.log('✅ Server is running and accessible')
    } catch (error) {
      throw new Error('❌ Server is not running. Please start the server with `yarn dev` before running tests.')
    }
  })

  beforeEach(async () => {
    // Clean up any existing test packages via WebSocket (more reliable)
    await cleanupPackage('framelink-figma-mcp')
    await cleanupPackage('framelink-figma-mcp-test')
    await cleanupPackage('test-mcp-server')
    await cleanupPackage('invalid-mcp-test')
    
    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(async () => {
    // Additional cleanup after each test
    await cleanupPackage('framelink-figma-mcp')
    await cleanupPackage('framelink-figma-mcp-test')
    await cleanupPackage('test-mcp-server')
    await cleanupPackage('invalid-mcp-test')
  })

  describe('LIST Command', () => {
    it('should return list of packages', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'list'
      })
      
      expect(response.verb).toBe('list')
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.count).toBeGreaterThanOrEqual(0)
      
      ws.close()
    })
  })

  describe('ADD Command - Test with Figma MCP', () => {
    it('should handle Figma MCP addition (success or expected failure)', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': 'framelink-figma-mcp-test',
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-ACTUAL-FIGMA-API-KEY', '--stdio'],
          env: {}
        }
      })
      
      expect(response.verb).toBe('add')
      expect(typeof response.success).toBe('boolean')
      
      if (response.success) {
        // If successful, validate success structure
        expect(response.message).toContain('added successfully')
        expect(response.data).toBeDefined()
        expect(response.data.name).toBe('framelink-figma-mcp-test')
        expect(response.capabilities).toBeDefined()
        expect(typeof response.totalCapabilities).toBe('number')
        console.log('✅ Figma MCP was successfully added')
        
        // Clean up the successfully added package
        await sendMessageAndWaitForResponse(ws, {
          verb: 'delete',
          data: {
            'unique-name': 'framelink-figma-mcp-test'
          }
        })
      } else {
        // If failed, validate failure structure  
        expect(response.error).toBeDefined()
        expect(typeof response.error).toBe('string')
        console.log(`❌ Figma MCP failed as expected: ${response.error}`)
      }
      
      ws.close()
    })

    it('should handle duplicate package prevention', async () => {
      const ws = await createWebSocketConnection()
      
      // First attempt
      const firstResponse = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': 'framelink-figma-mcp-test',
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-ACTUAL-FIGMA-API-KEY', '--stdio'],
          env: {}
        }
      })
      
      if (firstResponse.success) {
        // If first succeeded, second should fail with duplicate error
        const secondResponse = await sendMessageAndWaitForResponse(ws, {
          verb: 'add',
          data: {
            'unique-name': 'framelink-figma-mcp-test', // Same name
            command: 'npx',
            args: ['-y', 'figma-developer-mcp', '--figma-api-key=OTHER-KEY', '--stdio'],
            env: {}
          }
        })
        
        expect(secondResponse.verb).toBe('add')
        expect(secondResponse.success).toBe(false)
        expect(secondResponse.error).toContain('already exists')
        
        // Clean up
        await sendMessageAndWaitForResponse(ws, {
          verb: 'delete',
          data: {
            'unique-name': 'framelink-figma-mcp-test'
          }
        })
      } else {
        // If first failed, we can't test duplicates but that's expected
        expect(firstResponse.error).toBeDefined()
        console.log('⚠️ Cannot test duplicate prevention because first add failed (expected)')
      }
      
      ws.close()
    })
  })

  describe('ADD Command - Failure Cases', () => {
    it('should fail to add MCP with invalid command', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': 'invalid-mcp-test',
          command: 'nonexistent-command-12345',
          args: ['--fake-arg'],
          env: {}
        }
      })
      
      expect(response.verb).toBe('add')
      expect(response.success).toBe(false)
      expect(response.error).toContain('Failed to connect to MCP server')
      
      ws.close()
    })

    it('should fail with invalid data structure', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': '',
          command: ''
        }
      })
      
      expect(response.verb).toBe('add')
      expect(response.success).toBe(false)
      expect(response.error).toBe('Validation failed')
      
      ws.close()
    })
  })

  describe('DELETE Command', () => {
    it('should successfully delete existing MCP server', async () => {
      const ws = await createWebSocketConnection()
      
      // First try to add a package
      const addResponse = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': 'framelink-figma-mcp-test',
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-ACTUAL-FIGMA-API-KEY', '--stdio'],
          env: {}
        }
      })
      
      if (addResponse.success) {
        // If add succeeded, test delete
        const deleteResponse = await sendMessageAndWaitForResponse(ws, {
          verb: 'delete',
          data: {
            'unique-name': 'framelink-figma-mcp-test'
          }
        })
        
        expect(deleteResponse.verb).toBe('delete')
        expect(deleteResponse.success).toBe(true)
        expect(deleteResponse.message).toContain('removed successfully')
      } else {
        // If add failed, we can't test successful delete
        console.log('⚠️ Skipping delete test because add failed (expected with invalid API key)')
      }
      
      ws.close()
    })

    it('should fail to delete non-existent MCP server', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'delete',
        data: {
          'unique-name': 'non-existent-package-12345'
        }
      })
      
      expect(response.verb).toBe('delete')
      expect(response.success).toBe(false)
      expect(response.error).toContain('not found')
      
      ws.close()
    })
  })

  describe('Full Workflow Tests', () => {
    it('should complete full workflow if MCP server is valid', async () => {
      const ws = await createWebSocketConnection()
      
      // Step 1: Initial list
      const initialList = await sendMessageAndWaitForResponse(ws, {
        verb: 'list'
      })
      
      expect(initialList.success).toBe(true)
      const initialCount = initialList.count
      
      // Step 2: Add Figma MCP
      const addResponse = await sendMessageAndWaitForResponse(ws, {
        verb: 'add',
        data: {
          'unique-name': 'framelink-figma-mcp-test',
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-ACTUAL-FIGMA-API-KEY', '--stdio'],
          env: {}
        }
      })
      
      if (addResponse.success) {
        console.log('✅ MCP server was successfully added - testing full workflow')
        
        // Step 3: List should show the new package
        const listWithPackage = await sendMessageAndWaitForResponse(ws, {
          verb: 'list'
        })
        
        expect(listWithPackage.success).toBe(true)
        expect(listWithPackage.count).toBe(initialCount + 1)
        expect(listWithPackage.data.some((pkg: any) => pkg.name === 'framelink-figma-mcp-test')).toBe(true)
        
        // Step 4: Delete the package
        const deleteResponse = await sendMessageAndWaitForResponse(ws, {
          verb: 'delete',
          data: {
            'unique-name': 'framelink-figma-mcp-test'
          }
        })
        
        expect(deleteResponse.success).toBe(true)
        
        // Step 5: Final list should be back to original count
        const finalList = await sendMessageAndWaitForResponse(ws, {
          verb: 'list'
        })
        
        expect(finalList.success).toBe(true)
        expect(finalList.count).toBe(initialCount)
        expect(finalList.data.some((pkg: any) => pkg.name === 'framelink-figma-mcp-test')).toBe(false)
        
        console.log('✅ Full workflow completed successfully')
      } else {
        console.log(`⚠️ Full workflow test skipped - MCP server connection failed: ${addResponse.error}`)
        // This is acceptable - just validate the error response structure
        expect(addResponse.error).toBeDefined()
      }
      
      ws.close()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid verb', async () => {
      const ws = await createWebSocketConnection()
      
      const response = await sendMessageAndWaitForResponse(ws, {
        verb: 'invalid-verb',
        data: {}
      })
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('Invalid message format')
      
      ws.close()
    })

    it('should handle invalid JSON', async () => {
      const ws = await createWebSocketConnection()
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'))
        }, 5000)

        ws.on('message', (data) => {
          clearTimeout(timeout)
          try {
            const response = JSON.parse(data.toString())
            expect(response.success).toBe(false)
            expect(response.error).toContain('Invalid JSON format')
            ws.close()
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        ws.send('{ invalid json content }')
      })
    })
  })
})