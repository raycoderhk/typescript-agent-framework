import { McpServerManager } from '@/components/mcp-server-manager';
import { McpWebSocketTest } from '@/components/mcp-websocket-test';

export default function McpServersPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Test Component */}
          <McpWebSocketTest />
          
          {/* Main Manager */}
          <McpServerManager />
        </div>
      </div>
    </div>
  );
} 