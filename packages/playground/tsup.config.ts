import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/lib/exports/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Skip for now due to tsconfig issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-slot',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'vaul',
    'zod',
    'ai',
    '@ai-sdk/anthropic',
    '@ai-sdk/openai',
    '@ai-sdk/react',
    'date-fns',
    'fuse.js',
    '@modelcontextprotocol/sdk',
    'agents',
    '@xava-labs/mcp'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    };
  },
}); 