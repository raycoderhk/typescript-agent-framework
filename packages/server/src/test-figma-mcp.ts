import WebSocket, { WebSocketServer } from 'ws'

const PROXY_PORT = 6050
const proxyServer = new WebSocketServer({ 
  port: PROXY_PORT, 
  path: '/api/remote-container/ws' 
})

console.log(`🚀 Mock MCP Proxy listening on ws://localhost:${PROXY_PORT}/api/remote-container/ws`)
console.log('💡 Now start the server with: npm run dev')

proxyServer.on('connection', (ws) => {
  console.log('✅ Server connected to proxy')

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString())
    console.log('📨 Received:', JSON.stringify(message, null, 2))

    // Handle client ready message
    if (message.type === 'client_ready') {
      console.log('🤝 Client ready, sending add command for Figma MCP...')
      
      // Add Figma MCP server
      setTimeout(() => {
        const addCommand = {
          verb: 'add',
          data: {
            'unique-name': 'figma-context-mcp',
            command: 'npx',
            args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR_KEY', '--stdio'],
            env: { FIGMA_API_KEY: 'YOUR_KEY' }
          }
        }
        console.log('📤 Sending add command...')
        ws.send(JSON.stringify(addCommand))
      }, 1000)
    }

    // Handle add response
    if (message.verb === 'add' && message.success) {
      console.log('✅ Figma MCP server added successfully!')
      
      // Now request tools list via MCP protocol
      setTimeout(() => {
        const listToolsRequest = {
          jsonrpc: "2.0",
          id: "list-tools-1",
          method: "tools/list",
          params: {}
        }
        console.log('📤 Requesting tools list...')
        ws.send(JSON.stringify(listToolsRequest))
      }, 2000)
    }

    // Handle tools list response
    if (message.result && message.result.tools) {
      console.log('🛠️  Available tools:')
      message.result.tools.forEach((tool: any) => {
        console.log(`  - ${tool.name}: ${tool.description}`)
      })
      
      // Now call the get_figma_data tool
      setTimeout(() => {
        const callToolRequest = {
          jsonrpc: "2.0",
          id: "call-tool-1",
          method: "tools/call",
          params: {
            name: "figma-context-mcp__get_figma_data",
            arguments: {
              fileKey: "YOUR_FILE_KEY"
            }
          }
        }
        console.log('🔧 Calling get_figma_data tool...')
        ws.send(JSON.stringify(callToolRequest))
      }, 1000)
    }

    // Handle tool call response
    if (message.result && message.id === "call-tool-1") {
      console.log('🎯 Tool call result:')
      console.log(JSON.stringify(message.result, null, 2))
      
      console.log('\n🎉 Tool call completed successfully!')
      process.exit(0)
    }

    // Handle errors
    if (message.error) {
      console.error('❌ Error:', message.error)
      if (message.id === "call-tool-1") {
        console.log('Tool call failed - you may need to provide a valid Figma file ID')
        process.exit(1)
      }
    }
  })

  ws.on('close', () => {
    console.log('❌ Server disconnected')
  })
})

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy...')
  proxyServer.close()
  process.exit(0)
})