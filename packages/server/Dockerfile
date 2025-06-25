# packages/server/Dockerfile
FROM node:22

# Enable corepack
RUN corepack enable

# Set working directory
WORKDIR /workspace

# Copy workspace files
COPY ../package.json ../pnpm-workspace.yaml ../pnpm-lock.yaml ./

# Copy package.json files for dependency resolution
COPY ../packages/mcp/package.json ./packages/mcp/
COPY ../packages/server/package.json ./packages/server/

# Install dependencies but skip prepare scripts to avoid build issues
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild native dependencies like sqlite3 (but skip prepare scripts)
RUN cd packages/server && pnpm rebuild sqlite3

# Copy source code
COPY ../packages/mcp/ ./packages/mcp/
COPY ../packages/server/ ./packages/server/

# Set working directory to server package
WORKDIR /workspace/packages/server

# Create directory for SQLite database
RUN mkdir -p /workspace/packages/server/data

# Expose port
EXPOSE ${PORT:-3000}

# Use dev command instead of building
CMD ["pnpm", "dev"]