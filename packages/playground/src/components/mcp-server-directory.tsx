"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MCPServer } from "@/types/mcp-server";
import { MCPServerItem } from "./mcp-server-item";
import { 
  saveMCPDirectory, 
  loadMCPDirectory 
} from "@/lib/storage";
import { 
  initializeSearch, 
  MCPServerSearch 
} from "@/lib/search";
import { mockMCPDirectory } from "@/data/mock-mcp-servers";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface MCPServerDirectoryProps {
  className?: string;
  onServerToggle?: (server: MCPServer, enabled: boolean) => void;
  enabledServerIds?: Set<string>;
}

export function MCPServerDirectory({
  className,
  onServerToggle,
  enabledServerIds = new Set()
}: MCPServerDirectoryProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchInstance, setSearchInstance] = useState<MCPServerSearch | null>(null);

  // Initialize data and search
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      // Try to load from localStorage first
      let directory = loadMCPDirectory();
      
      // If no cached data, use mock data
      if (!directory) {
        directory = mockMCPDirectory;
        saveMCPDirectory(directory);
      }
      
      setServers(directory.servers);
      
      // Initialize search
      const search = initializeSearch(directory.servers);
      setSearchInstance(search);
      
      setIsLoading(false);
    };
    
    initializeData();
  }, []);

  // Get filtered and searched servers
  const filteredServers = useMemo(() => {
    if (!searchInstance) return servers;
    
    let results = servers;
    
    // Apply search if query exists
    if (searchQuery.trim()) {
      results = searchInstance.search(searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory) {
      results = results.filter(server => server.category === selectedCategory);
    }
    
    return results;
  }, [servers, searchQuery, selectedCategory, searchInstance]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    if (!searchInstance) return [];
    return searchInstance.getCategories();
  }, [searchInstance]);

  const handleServerToggle = async (server: MCPServer, enabled: boolean) => {
    if (enabled) {
      // Call the add API
      try {
        const response = await fetch('/api/mcp-servers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uniqueName: server.id,
            command: server.mcpServerConfig.command,
            args: server.mcpServerConfig.args,
            env: server.mcpServerConfig.env
          })
        });

        const result: ApiResponse = await response.json();
        
        if (result.success) {
          console.log(`Successfully added MCP server: ${server.name}`);
          onServerToggle?.(server, enabled);
        } else {
          console.error(`Failed to add MCP server: ${result.error}`);
          alert(`Failed to add MCP server: ${result.error}`);
        }
      } catch (error) {
        console.error('Error adding MCP server:', error);
        alert('Failed to add MCP server due to network error');
      }
    } else {
      // For disable, just call the callback for now
      // TODO: Implement delete API call
      onServerToggle?.(server, enabled);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div className="h-8 bg-[#17181A] rounded-lg" />
            <div className="h-4 bg-[#17181A] rounded-lg w-3/4" />
          </div>
          <div className="h-10 bg-[#17181A] rounded-lg" />
          <div className="h-8 bg-[#17181A] rounded-lg" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#17181A] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white/95 mb-2">MCP Server Directory</h1>
          <p className="text-sm text-white/60">Discover and connect to Model Context Protocol servers</p>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search servers..."
            className="w-full bg-[#17181A] border border-[rgba(255,255,255,0.2)] rounded-lg px-3 py-2 pl-9 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-[rgba(255,255,255,0.4)]"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Category filter */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-all duration-200",
                  selectedCategory === category
                    ? "bg-[rgba(114,255,192,0.1)] border-[rgba(114,255,192,0.3)] text-[rgba(114,255,192,0.9)]"
                    : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white/60 hover:border-[rgba(255,255,255,0.2)]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Clear filters */}
          {(searchQuery || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results summary */}
      <div className="px-6 py-3 text-sm text-white/60 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <span>
            {filteredServers.length} of {servers.length} servers
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory && ` in "${selectedCategory}"`}
          </span>
        </div>
      </div>

      {/* Server Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredServers.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <svg
              className="mx-auto mb-4 text-white/20"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-lg mb-2">No servers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <MCPServerItem
                key={server.id}
                server={server}
                isEnabled={enabledServerIds.has(server.id)}
                onToggle={handleServerToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 