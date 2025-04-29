---
"@xava-labs/agent": patch
"playground": patch
---

* Agent Framework using AI SDK and Cloudflare native primitives
* Services - Add routes to Agent
* Router - Likely an Agent Gateway, manages sessions, routing to agents, and CORS.
* Playground - A place for chatting with agents (and soon MCPs)
* Middleware - Inject tools, params, and modify LLM responses
* Example simple prompt agent (Bootstraps TODO List MCP + Playground)