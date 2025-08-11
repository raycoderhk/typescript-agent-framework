# Usage Example

Here's a complete example of how to use `@xava-labs/playground` in your project:

## Installation & Setup

```bash
npm install @xava-labs/playground
```

## Basic Usage

```tsx
// app.tsx
import React from 'react';
import { PlaygroundProvider, Playground } from '@xava-labs/playground';
import '@xava-labs/playground/styles';

function App() {
  return (
    <PlaygroundProvider 
      config={{
        mcpProxyUrl: 'http://localhost:6050',
        mcpProxyWsUrl: 'ws://localhost:6050/client/ws',
        theme: 'dark',
        defaultModelConfig: {
          provider: 'openai',
          apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
          model: 'gpt-4'
        }
      }}
    >
      <Playground />
    </PlaygroundProvider>
  );
}

export default App;
```

## Custom Configuration

```tsx
// custom-playground.tsx
import React from 'react';
import { 
  PlaygroundProvider, 
  ChatContainer, 
  MCPServerDirectory, 
  ModelSelector,
  useConfigurableMcpServerManager 
} from '@xava-labs/playground';

function CustomPlayground() {
  return (
    <PlaygroundProvider 
      config={{
        mcpProxyUrl: process.env.REACT_APP_MCP_PROXY_URL || 'http://localhost:6050',
        mcpProxyWsUrl: process.env.REACT_APP_MCP_PROXY_WS_URL || 'ws://localhost:6050/client/ws',
        theme: 'light',
        enabledFeatures: {
          chat: true,
          mcpServerDirectory: true,
          modelSelector: false
        }
      }}
    >
      <div className="h-screen flex">
        <div className="w-1/3 border-r">
          <MCPServerDirectory />
        </div>
        <div className="flex-1">
          <ChatContainer title="My Custom Chat" />
        </div>
      </div>
    </PlaygroundProvider>
  );
}

export default CustomPlayground;
```

## MCP Server Management Hook

```tsx
// server-manager.tsx
import React from 'react';
import { 
  PlaygroundProvider, 
  useConfigurableMcpServerManager 
} from '@xava-labs/playground';

function ServerManager() {
  const {
    servers,
    connected,
    loading,
    addServer,
    deleteServer,
    refreshServers,
    isServerLoading
  } = useConfigurableMcpServerManager();

  const handleAddGitHubServer = async () => {
    const success = await addServer({
      uniqueName: 'github-server',
      command: 'npx',
      args: ['@github/mcp-server'],
      env: { GITHUB_TOKEN: process.env.REACT_APP_GITHUB_TOKEN || '' }
    });
    
    if (success) {
      console.log('GitHub server added successfully');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">MCP Servers</h2>
        <p>Connected: {connected ? 'Yes' : 'No'} | Loading: {loading ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={handleAddGitHubServer}
          disabled={isServerLoading('github-server')}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isServerLoading('github-server') ? 'Adding...' : 'Add GitHub Server'}
        </button>
        <button 
          onClick={refreshServers}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded ml-2 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Active Servers ({servers.length})</h3>
        {servers.map(server => (
          <div key={server.uniqueName} className="border p-2 mb-2 rounded">
            <div className="font-medium">{server.uniqueName}</div>
            <div className="text-sm text-gray-600">{server.command} {server.args.join(' ')}</div>
            <div className="text-sm">Status: {server.status || 'unknown'}</div>
            <button 
              onClick={() => deleteServer(server.uniqueName)}
              disabled={isServerLoading(server.uniqueName)}
              className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-1 disabled:opacity-50"
            >
              {isServerLoading(server.uniqueName) ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <PlaygroundProvider 
      config={{
        mcpProxyUrl: 'http://localhost:6050',
        mcpProxyWsUrl: 'ws://localhost:6050/client/ws'
      }}
    >
      <ServerManager />
    </PlaygroundProvider>
  );
}

export default App;
```

## Environment Variables

Create a `.env` file in your project root:

```bash
# .env
REACT_APP_MCP_PROXY_URL=http://localhost:6050
REACT_APP_MCP_PROXY_WS_URL=ws://localhost:6050/client/ws
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here
REACT_APP_GITHUB_TOKEN=your_github_token_here
```

## Running the MCP Proxy

Before using the playground, you need to run the MCP proxy server:

```bash
# In a separate terminal
cd /path/to/mcp-proxy
npx wrangler dev --port 6050
```

## TypeScript Support

The package includes TypeScript definitions. Here are the main types you can use:

```typescript
import type {
  PlaygroundConfig,
  McpServer,
  PlaygroundProps,
  UseMcpServerManagerReturn
} from '@xava-labs/playground';

const config: PlaygroundConfig = {
  mcpProxyUrl: 'http://localhost:6050',
  mcpProxyWsUrl: 'ws://localhost:6050/client/ws',
  theme: 'dark'
};

const server: McpServer = {
  uniqueName: 'my-server',
  command: 'npx',
  args: ['my-mcp-server'],
  env: { API_KEY: 'secret' },
  status: 'running'
};
```

## CSS/Styling

The components use Tailwind CSS. Make sure your project has Tailwind CSS configured, or import the base styles:

```tsx
import '@xava-labs/playground/styles';
```

For custom styling, you can override the Tailwind classes or provide your own CSS. 