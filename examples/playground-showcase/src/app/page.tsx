'use client'

import Link from 'next/link'
import { PlaygroundProvider } from '@xava-labs/playground'
import { ExternalLink, Github, Terminal, MessageCircle, Settings, Zap } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            MCP Playground Components
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Build powerful MCP server management interfaces with our React component library
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/playground"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Terminal className="mr-2 h-5 w-5" />
              View Full Playground
            </Link>
            <Link
              href="/components"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="mr-2 h-5 w-5" />
              Browse Components
            </Link>
            <a
              href="https://github.com/cloudflare/typescript-agent-vibework"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Github className="mr-2 h-5 w-5" />
              <span>View on GitHub</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <MessageCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chat Interface</h3>
              <p className="text-muted-foreground">
                Full-featured chat components with message history, streaming support, and AI integration.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Settings className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">MCP Management</h3>
              <p className="text-muted-foreground">
                Complete MCP server directory, configuration, and management tools with real-time status updates.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Zap className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Configurable</h3>
              <p className="text-muted-foreground">
                Highly configurable components with themes, proxy URLs, and feature toggles for any use case.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Start</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Installation</h3>
            <div className="bg-secondary rounded-md p-4 mb-6">
              <code className="text-sm">npm install @xava-labs/playground</code>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Basic Usage</h3>
            <div className="bg-secondary rounded-md p-4 overflow-x-auto">
              <pre className="text-sm">
                <code>{`import { PlaygroundProvider, Playground } from '@xava-labs/playground'
import '@xava-labs/playground/styles'

function App() {
  return (
    <PlaygroundProvider 
      config={{
        mcpProxyUrl: 'http://localhost:6050',
        mcpProxyWsUrl: 'ws://localhost:6050/client/ws',
        theme: 'dark'
      }}
    >
      <Playground />
    </PlaygroundProvider>
  )
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Explore our playground components and see how easy it is to build MCP interfaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/playground"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try the Playground
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Examples
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
} 