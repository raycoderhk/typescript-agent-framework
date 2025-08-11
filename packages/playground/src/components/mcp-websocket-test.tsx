'use client';

import React from 'react';
import { useMcpServerManager } from '@/hooks/use-mcp-server-manager';

export function McpWebSocketTest() {
  const { 
    servers, 
    connected, 
    loading, 
    error,
    refreshServers,
    addServer,
    deleteServer 
  } = useMcpServerManager();

  const testAddServer = async () => {
    await addServer({
      uniqueName: 'test-server-' + Date.now(),
      command: 'echo',
      args: ['hello', 'world'],
      env: { TEST: 'true' }
    });
  };

  const testDeleteServer = async () => {
    if (servers.length > 0) {
      await deleteServer(servers[0].uniqueName);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">MCP WebSocket Test</h3>
      
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm">
          {connected ? 'Connected to MCP Proxy' : 'Disconnected'}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-sm text-blue-600">Loading...</div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {error}
        </div>
      )}

      {/* Server Count */}
      <div className="text-sm text-gray-600">
        Servers: {servers.length}
      </div>

      {/* Test Actions */}
      <div className="flex space-x-2">
        <button
          onClick={refreshServers}
          disabled={!connected || loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Refresh List
        </button>
        
        <button
          onClick={testAddServer}
          disabled={!connected || loading}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded disabled:opacity-50"
        >
          Add Test Server
        </button>
        
        <button
          onClick={testDeleteServer}
          disabled={!connected || loading || servers.length === 0}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded disabled:opacity-50"
        >
          Delete First Server
        </button>
      </div>

      {/* Server List */}
      {servers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Servers:</h4>
          <div className="space-y-1">
            {servers.map((server) => (
              <div key={server.uniqueName} className="text-xs bg-gray-100 p-2 rounded">
                <div className="font-medium">{server.uniqueName}</div>
                <div className="text-gray-600">{server.command}</div>
                {server.args.length > 0 && (
                  <div className="text-gray-500">Args: {JSON.stringify(server.args)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 