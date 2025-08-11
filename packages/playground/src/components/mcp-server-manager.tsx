'use client';

import React, { useState } from 'react';
import { useMcpServerManager, type McpServer } from '@/hooks/use-mcp-server-manager';

interface AddServerFormData {
  uniqueName: string;
  command: string;
  args: string;
  env: string;
}

export function McpServerManager() {
  const {
    servers,
    connected,
    loading,
    error,
    addServer,
    deleteServer,
    refreshServers,
  } = useMcpServerManager();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddServerFormData>({
    uniqueName: '',
    command: '',
    args: '',
    env: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<AddServerFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof AddServerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<AddServerFormData> = {};

    if (!formData.uniqueName.trim()) {
      errors.uniqueName = 'Unique name is required';
    }

    if (!formData.command.trim()) {
      errors.command = 'Command is required';
    }

    // Validate JSON for args and env
    if (formData.args.trim()) {
      try {
        JSON.parse(formData.args);
      } catch {
        errors.args = 'Arguments must be valid JSON array';
      }
    }

    if (formData.env.trim()) {
      try {
        JSON.parse(formData.env);
      } catch {
        errors.env = 'Environment must be valid JSON object';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const server: Omit<McpServer, 'status'> = {
        uniqueName: formData.uniqueName.trim(),
        command: formData.command.trim(),
        args: formData.args.trim() ? JSON.parse(formData.args) : [],
        env: formData.env.trim() ? JSON.parse(formData.env) : {},
      };

      const success = await addServer(server);
      
      if (success) {
        setFormData({
          uniqueName: '',
          command: '',
          args: '',
          env: '',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding server:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uniqueName: string) => {
    if (window.confirm(`Are you sure you want to delete server "${uniqueName}"?`)) {
      await deleteServer(uniqueName);
    }
  };

  const formatJsonDisplay = (obj: Record<string, string> | string[]): string => {
    if (Array.isArray(obj)) {
      return obj.length > 0 ? JSON.stringify(obj, null, 2) : '[]';
    }
    return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : '{}';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">MCP Server Manager</h2>
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => refreshServers()}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          
          {/* Add Server Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showAddForm ? 'Cancel' : 'Add Server'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Server Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New MCP Server</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="uniqueName" className="block text-sm font-medium text-gray-700">
                Unique Name *
              </label>
              <input
                type="text"
                id="uniqueName"
                value={formData.uniqueName}
                onChange={(e) => handleInputChange('uniqueName', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.uniqueName ? 'border-red-300' : ''
                }`}
                placeholder="e.g., my-mcp-server"
              />
              {formErrors.uniqueName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.uniqueName}</p>
              )}
            </div>

            <div>
              <label htmlFor="command" className="block text-sm font-medium text-gray-700">
                Command *
              </label>
              <input
                type="text"
                id="command"
                value={formData.command}
                onChange={(e) => handleInputChange('command', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.command ? 'border-red-300' : ''
                }`}
                placeholder="e.g., npx @modelcontextprotocol/server-filesystem"
              />
              {formErrors.command && (
                <p className="mt-1 text-sm text-red-600">{formErrors.command}</p>
              )}
            </div>

            <div>
              <label htmlFor="args" className="block text-sm font-medium text-gray-700">
                Arguments (JSON Array)
              </label>
              <textarea
                id="args"
                value={formData.args}
                onChange={(e) => handleInputChange('args', e.target.value)}
                rows={3}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.args ? 'border-red-300' : ''
                }`}
                placeholder='["--root", "/path/to/root"]'
              />
              {formErrors.args && (
                <p className="mt-1 text-sm text-red-600">{formErrors.args}</p>
              )}
            </div>

            <div>
              <label htmlFor="env" className="block text-sm font-medium text-gray-700">
                Environment Variables (JSON Object)
              </label>
              <textarea
                id="env"
                value={formData.env}
                onChange={(e) => handleInputChange('env', e.target.value)}
                rows={3}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.env ? 'border-red-300' : ''
                }`}
                placeholder='{"API_KEY": "value", "DEBUG": "true"}'
              />
              {formErrors.env && (
                <p className="mt-1 text-sm text-red-600">{formErrors.env}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Server'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Server List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            MCP Servers ({servers.length})
          </h3>
          
          {loading && servers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading servers...</div>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No MCP servers configured</div>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add your first server
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <div
                  key={server.uniqueName}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {server.uniqueName}
                        </h4>
                        {server.status && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              server.status === 'running'
                                ? 'bg-green-100 text-green-800'
                                : server.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {server.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Command:</span> {server.command}
                        </div>
                        
                        {server.args.length > 0 && (
                          <div>
                            <span className="font-medium">Arguments:</span>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {formatJsonDisplay(server.args)}
                            </pre>
                          </div>
                        )}
                        
                        {Object.keys(server.env).length > 0 && (
                          <div>
                            <span className="font-medium">Environment:</span>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {formatJsonDisplay(server.env)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(server.uniqueName)}
                      className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 