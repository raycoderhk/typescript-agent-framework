import WebSocket from 'ws';

const wsUrl = 'ws://localhost:8787/remote-container/ws';
console.log(`Attempting to connect to: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened successfully!');
  
  // Send a test message
  const testMessage = {
    type: 'client_ready',
    clientId: 'test-client',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Sending test message:', JSON.stringify(testMessage, null, 2));
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
  console.log('📥 Received message:', data.toString());
  
  // Close connection after receiving response
  setTimeout(() => {
    ws.close();
  }, 1000);
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('⏰ Connection timeout - could not connect within 10 seconds');
    ws.close();
    process.exit(1);
  }
}, 10000); 