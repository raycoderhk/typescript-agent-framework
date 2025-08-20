#!/bin/bash

# Script to add CRUD MCP troubleshooting guide to GitHub tutorials repository

echo "🚀 Adding CRUD MCP Troubleshooting Guide to GitHub..."

# Check if we're in the right directory
if [ ! -f "CRUD_MCP_TROUBLESHOOTING_GUIDE.md" ]; then
    echo "❌ Error: CRUD_MCP_TROUBLESHOOTING_GUIDE.md not found in current directory"
    echo "Please run this script from the directory containing the guide file"
    exit 1
fi

# Prompt for tutorials repository path
read -p "Enter the path to your tutorials repository (e.g., /path/to/tutorials): " TUTORIALS_PATH

if [ ! -d "$TUTORIALS_PATH" ]; then
    echo "❌ Error: Directory $TUTORIALS_PATH does not exist"
    exit 1
fi

# Navigate to tutorials repository
cd "$TUTORIALS_PATH"

# Create crud-mcp-docs directory if it doesn't exist
mkdir -p crud-mcp-docs

# Copy the troubleshooting guide
cp "$(dirname "$0")/CRUD_MCP_TROUBLESHOOTING_GUIDE.md" ./crud-mcp-docs/

# Add to git
git add crud-mcp-docs/CRUD_MCP_TROUBLESHOOTING_GUIDE.md

# Commit with descriptive message
git commit -m "Add comprehensive CRUD MCP troubleshooting guide

Documents real-world issues and solutions from setup session:
- SQL parameter binding fixes
- Testing command issues  
- MCP Inspector configuration
- Directory context problems
- Package manager conflicts

Includes practical debugging steps and best practices for future developers."

# Push to GitHub
git push origin main

echo "✅ Successfully added troubleshooting guide to GitHub!"
echo "🔗 Check your repository at: https://github.com/raycoderhk/tutorials/tree/main/crud-mcp-docs"
