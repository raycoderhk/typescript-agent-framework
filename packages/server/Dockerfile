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

# Expose ports - main server and health check
EXPOSE ${PORT:-3001}
EXPOSE ${HEALTH_CHECK_PORT:-11990}

# Set default environment variables
ENV NODE_ENV=production
ENV PROXY_ID=""
ENV MCP_SERVER_HOST="localhost:6050"
ENV HEALTH_CHECK_PORT=11990

# Use the production start command with proxy-id argument from environment
CMD ["sh", "-c", "pnpm dev --proxy-id=${PROXY_ID} --mcp-server-host=${MCP_SERVER_HOST}"]