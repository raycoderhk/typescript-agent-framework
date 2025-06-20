import WebSocket from 'ws'

const PORT = parseInt(process.env.PORT || '3000')
const WS_URL = `ws://localhost:${PORT}/ws`

async function testMcpWebSocket() {
  console.log(`🚀 Connecting to MCP WebSocket: ${WS_URL}`)
  
  const ws = new WebSocket(WS_URL)
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected')
    
    // Test different commands
    console.log('\n📤 Testing LIST command')
    ws.send(JSON.stringify({
      verb: 'list'
    }))
    
    setTimeout(() => {
      console.log('\n📤 Testing ADD command with Figma MCP')
      ws.send(JSON.stringify({
        verb: 'add',
        data: {
          'unique-name': 'framelink-figma-mcp',
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', '--figma-api-key=YOUR-ACTUAL-FIGMA-API-KEY', '--stdio'],
          env: {}
        }
      }))
    }, 1000)
    
    setTimeout(() => {
      console.log('\n📤 Testing LIST command again (should show the added MCP)')
      ws.send(JSON.stringify({
        verb: 'list'
      }))
    }, 3000) // Give more time for MCP connection test
    
    setTimeout(() => {
      console.log('\n📤 Testing DELETE command')
      ws.send(JSON.stringify({
        verb: 'delete',
        data: {
          'unique-name': 'framelink-figma-mcp'
        }
      }))
    }, 4000)
    
    setTimeout(() => {
      console.log('\n📤 Final LIST command (should be empty again)')
      ws.send(JSON.stringify({
        verb: 'list'
      }))
    }, 5000)
    
    setTimeout(() => {
      console.log('\n🏁 Test completed, closing connection')
      ws.close()
    }, 6000)
  })

  ws.on('message', (data) => {
    const response = JSON.parse(data.toString())
    console.log(`\n📨 Response for ${response.verb?.toUpperCase() || 'UNKNOWN'}:`)
    
    if (response.success) {
      console.log('✅ Success:', response.message || 'Operation completed')
      
      if (response.verb === 'add' && response.capabilities) {
        console.log(`📊 Capabilities: ${response.totalCapabilities} total`)
        if (response.capabilities.tools?.length > 0) {
          console.log(`🔧 Tools: ${response.capabilities.tools.map((t: any) => t.name).join(', ')}`)
        }
        if (response.capabilities.resources?.length > 0) {
          console.log(`📚 Resources: ${response.capabilities.resources.map((r: any) => r.name).join(', ')}`)
        }
        if (response.capabilities.prompts?.length > 0) {
          console.log(`💬 Prompts: ${response.capabilities.prompts.map((p: any) => p.name).join(', ')}`)
        }
      }
      
      if (response.verb === 'list' && response.data) {
        console.log(`📦 Packages (${response.count}):`)
        response.data.forEach((pkg: any, i: number) => {
          console.log(`  ${i + 1}. ${pkg.name} - ${pkg.command} ${pkg.args.join(' ')}`)
        })
      }
    } else {
      console.log('❌ Error:', response.error)
      if (response.details) {
        console.log('📋 Details:', response.details)
      }
    }
  })

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed')
    console.log('\n📝 Note: The Figma MCP test will fail unless you have a valid Figma API key')
    console.log('   Replace "YOUR-ACTUAL-FIGMA-API-KEY" with a real key to test successfully')
  })
}

testMcpWebSocket()