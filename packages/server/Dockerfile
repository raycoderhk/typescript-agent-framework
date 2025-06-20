FROM node:22

# Enable corepack for yarn
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN yarn build

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port (will be overridden by environment variable)
EXPOSE ${PORT:-3000}

# Start the server
CMD ["yarn", "dev"] 