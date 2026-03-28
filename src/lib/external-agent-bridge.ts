// External Agent Bridge — Connects custom AI agents (LangChain, CrewAI, AutoGen) to Zelstrom
// Provides registry, event protocol, and window.Zelstrom API

import type { ProcessConfig } from "@/lib/sdmf";

export interface ExternalAgentRegistration {
  id: string;
  name: string;
  description: string;
  framework: string; // e.g. "LangChain", "CrewAI", "AutoGen", "Custom"
  enabled: boolean;
  registeredAt: number;
  lastProposalAt: number | null;
  proposalCount: number;
}

export interface ExternalAgentProposal {
  agentName: string;
  configs: Partial<ProcessConfig>[];
  projectedMetrics: {
    throughput: number;
    cost: number;
    defectRate: number;
    uptime: number;
  };
  reasoning: string;
  timestamp: number;
}

const REGISTRY_KEY = "zelstrom-external-agents";
const PROPOSALS_KEY = "zelstrom-external-proposals";

// --- Registry ---

export function getRegisteredAgents(): ExternalAgentRegistration[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) || "[]");
  } catch { return []; }
}

function saveRegistry(agents: ExternalAgentRegistration[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(agents));
  window.dispatchEvent(new CustomEvent("zelstrom-registry-change", { detail: agents }));
}

export function registerExternalAgent(
  name: string,
  description: string,
  framework: string = "Custom"
): ExternalAgentRegistration {
  const agents = getRegisteredAgents();
  const existing = agents.find(a => a.name === name);
  if (existing) {
    existing.description = description;
    existing.framework = framework;
    existing.enabled = true;
    saveRegistry(agents);
    return existing;
  }

  const agent: ExternalAgentRegistration = {
    id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description,
    framework,
    enabled: true,
    registeredAt: Date.now(),
    lastProposalAt: null,
    proposalCount: 0,
  };
  agents.push(agent);
  saveRegistry(agents);
  return agent;
}

export function unregisterAgent(id: string) {
  const agents = getRegisteredAgents().filter(a => a.id !== id);
  saveRegistry(agents);
}

export function toggleAgent(id: string, enabled: boolean) {
  const agents = getRegisteredAgents();
  const agent = agents.find(a => a.id === id);
  if (agent) {
    agent.enabled = enabled;
    saveRegistry(agents);
  }
}

// --- Proposals ---

export function getPendingProposals(): ExternalAgentProposal[] {
  try {
    return JSON.parse(localStorage.getItem(PROPOSALS_KEY) || "[]");
  } catch { return []; }
}

export function clearPendingProposals() {
  localStorage.setItem(PROPOSALS_KEY, "[]");
}

export function submitExternalProposal(proposal: Omit<ExternalAgentProposal, "timestamp">): boolean {
  const agents = getRegisteredAgents();
  const agent = agents.find(a => a.name === proposal.agentName && a.enabled);
  if (!agent) {
    console.warn(`[Zelstrom] Agent "${proposal.agentName}" not registered or disabled`);
    return false;
  }

  const fullProposal: ExternalAgentProposal = { ...proposal, timestamp: Date.now() };
  const proposals = getPendingProposals();
  proposals.push(fullProposal);
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));

  // Update agent stats
  agent.lastProposalAt = Date.now();
  agent.proposalCount++;
  saveRegistry(agents);

  // Dispatch event for Command Center to pick up
  window.dispatchEvent(new CustomEvent("zelstrom-agent-proposal", { detail: fullProposal }));
  console.log(`[Zelstrom] Proposal received from "${proposal.agentName}"`);
  return true;
}

// --- Generation Complete Callbacks ---

type GenerationCallback = (data: { generationId: number; winnerId: string; winnerName: string; score: number }) => void;
const generationCallbacks: GenerationCallback[] = [];

export function onGenerationComplete(cb: GenerationCallback) {
  generationCallbacks.push(cb);
  return () => {
    const idx = generationCallbacks.indexOf(cb);
    if (idx >= 0) generationCallbacks.splice(idx, 1);
  };
}

export function notifyGenerationComplete(data: Parameters<GenerationCallback>[0]) {
  generationCallbacks.forEach(cb => {
    try { cb(data); } catch (e) { console.error("[Zelstrom] Callback error:", e); }
  });
}

// --- Mount window.Zelstrom global API ---

export function mountZelstromAPI() {
  const api = {
    registerAgent: (opts: { name: string; description?: string; framework?: string }) => {
      return registerExternalAgent(opts.name, opts.description || "", opts.framework || "Custom");
    },
    unregisterAgent: (name: string) => {
      const agent = getRegisteredAgents().find(a => a.name === name);
      if (agent) unregisterAgent(agent.id);
    },
    submitProposal: (proposal: {
      agentName: string;
      configs?: Partial<ProcessConfig>[];
      projectedMetrics: { throughput: number; cost: number; defectRate: number; uptime: number };
      reasoning?: string;
    }) => {
      return submitExternalProposal({
        agentName: proposal.agentName,
        configs: proposal.configs || [],
        projectedMetrics: proposal.projectedMetrics,
        reasoning: proposal.reasoning || "External agent proposal",
      });
    },
    onGenerationComplete,
    getRegisteredAgents,
    version: "1.0.0",
  };
  (window as any).Zelstrom = api;
  console.log("[Zelstrom] External Agent API mounted — use window.Zelstrom to interact");
}
