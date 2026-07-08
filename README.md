# Veridan Core v1

Veridan Core is the orchestration layer for the Tekram Analytics AI ecosystem.

It is designed to sit between the human interface, currently ChatGPT, and the execution network made of agents, MCP servers, apps, widgets, APIs, and automation workflows.

## System model

```text
User
  -> ChatGPT Interface
    -> Veridan Core Router
      -> Agent Hub
      -> MCP Hub
      -> Memory Hub
      -> Automation Engine
        -> External Services
```

## Phase 1 goal

Create a working foundation that can:

1. Register agents.
2. Register MCP servers and external tool bridges.
3. Route a user command to the right agent.
4. Track capabilities and permissions.
5. Prepare the system for automation, memory, and dashboard interfaces.

## Core modules

- `core/router.json` - command routing rules.
- `core/agent-registry.json` - known agents and their capabilities.
- `core/mcp-registry.json` - known MCP servers and tool bridges.
- `core/system-manifest.json` - top-level system identity and operating principles.
- `agents/` - agent definitions.
- `mcp/` - MCP connector definitions.
- `docs/` - architecture and operating notes.

## Current interface

ChatGPT is the primary interface. Veridan Core is the system layer. Agents are the executors. MCP servers are the bridges to tools and services.

## Safety rule for trading

Trading-related agents may analyze, prepare, and explain trades. Actual order execution should require explicit user confirmation and permission boundaries.
