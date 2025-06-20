#!/bin/bash
echo "Testing server endpoints..."

echo "1. Health check:"
curl -s http://localhost:3000/ | jq .

echo -e "\n2. Adding a package:"
curl -s -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{
    "unique-name": "test-pkg-'$(date +%s)'",
    "command": "npm install",
    "args": ["express"],
    "env": {"NODE_ENV": "test"}
  }' | jq .

echo -e "\n3. MCP endpoint:"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-action",
    "data": {"test": true}
  }' | jq .

echo -e "\n4. List packages:"
curl -s http://localhost:3000/packages | jq .