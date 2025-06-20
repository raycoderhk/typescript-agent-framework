# Use the official Node.js runtime (Debian-based, includes build tools)
FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the source code
COPY . .

# Build the TypeScript application
RUN yarn build

# Create data directory for SQLite database and set permissions
RUN mkdir -p /app/data

# Create a non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

# Change ownership of the app directory to the nodejs user AFTER creating data directory
RUN chown -R nodejs:nodejs /app

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/packages.db.sqlite

# Switch to non-root user
USER nodejs

# Command to run the application
CMD ["node", "dist/index.js"]