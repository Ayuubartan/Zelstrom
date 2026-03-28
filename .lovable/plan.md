

# Connect Custom AI Agents to Zelstrom Command Center

## What We're Building

An **External Agent API** that lets your custom multi-agent systems (LangChain, CrewAI, AutoGen, etc.) register as competitors in the Zelstrom evolution engine. External agents submit proposals via a standardized interface and compete alongside the built-in optimizer agents.

## Architecture

```text
┌─────────────────────────┐     ┌──────────────────────────┐
│  Your LangChain/CrewAI  │     │  Zelstrom Command Center │
│  agents (external)      │────▶│                          │
│                         │     │  ┌────────────────────┐  │
│  POST proposals via     │     │  │ Agent Registry      │  │
│  window event or        │     │  │ - Built-in agents   │  │
│  direct API call        │     │  │ - External agents   │  │
└─────────────────────────┘     │  └────────────────────┘  │
                                │           │               │
                                │  ┌────────▼───────────┐  │
                                │  │ Evolution Engine    │  │
                                │  │ Evaluates ALL       │  │
                                │  │ proposals equally   │  │
                                │  └────────────────────┘  │
                                └──────────────────────────┘
```

## Implementation Plan

### 1. Create External Agent Bridge (`src/lib/external-agent-bridge.ts`)

Define the integration protocol:
- `ExternalAgentRegistration` interface — name, description, endpoint/callback
- `ExternalAgentProposal` interface — station configs + projected metrics submitted by external agents
- Registry stored in localStorage, synced via custom events
- Functions: `registerExternalAgent()`, `unregisterAgent()`, `getRegisteredAgents()`, `submitExternalProposal()`
- Event-based communication: external code dispatches `zelstrom-agent-proposal` events, Command Center listens

### 2. Update Evolution Engine (`src/lib/sdmf.ts`)

Modify `runAdversarialGeneration()` to:
- Check the external agent registry for pending proposals
- Convert external proposals into the standard `AgentProposal` format with `agentType: 'external'`
- Include them in the same adversarial stress-testing and scoring pipeline
- Tag external proposals in reasoning (e.g., `[external · LangChain]`)

### 3. Add Agent Registration UI (`src/components/sdmf/ExternalAgentPanel.tsx`)

A panel in the Command Center showing:
- List of registered external agents with status indicators
- Manual registration form (agent name, description)
- A code snippet/instructions showing how to submit proposals from external code
- Toggle to enable/disable each external agent from competing

### 4. Wire into Command Center (`src/pages/CommandCenter.tsx`)

- Add the ExternalAgentPanel to the sidebar
- Listen for `zelstrom-agent-proposal` events to accept real-time submissions
- Show external agent indicators in the Evolution Timeline (different icon/color)

### 5. Expose Global API on `window`

Mount a `window.Zelstrom` object so external scripts can call:
- `window.Zelstrom.registerAgent({ name, description })`
- `window.Zelstrom.submitProposal({ agentName, configs, projectedMetrics })`
- `window.Zelstrom.onGenerationComplete(callback)`

This lets any JavaScript-based agent framework (running in the same browser or injected via console) participate in the evolution loop.

## Files Changed

| File | Action |
|------|--------|
| `src/lib/external-agent-bridge.ts` | Create — registry, event protocol, window API |
| `src/lib/sdmf.ts` | Edit — accept external proposals in evolution |
| `src/components/sdmf/ExternalAgentPanel.tsx` | Create — registration UI + code snippets |
| `src/pages/CommandCenter.tsx` | Edit — add panel + event listeners |

