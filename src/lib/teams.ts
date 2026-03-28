// AI Teams — multi-agent team competition model
// Each team has 4 roles that collaborate to produce a unified factory plan
// Teams are built from INDEPENDENT edge function calls with different strategy biases

import type { SimulationResult, AgentType } from "./factory";

export type TeamRole = "strategy-lead" | "cost-engineer" | "throughput-engineer" | "systems-optimizer";

export interface RoleContribution {
  role: TeamRole;
  agentType: AgentType;
  label: string;
  icon: string; // lucide icon name
  focus: string;
  suggestion: string;
  influenceWeight: number;
}

export interface AITeam {
  id: string;
  name: string;
  philosophy: string;
  roles: RoleContribution[];
  reasoning: string[];      // internal decision log
  decisionFlow: string[];   // visual flow steps
  result: SimulationResult;  // merged final result
  isWinner: boolean;
  serverReasoning?: string;  // LLM reasoning from edge function
  proposals?: any[];         // raw proposals from generation
}

// Team definitions with strategy biases sent to the edge function
export const TEAM_DEFINITIONS = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    philosophy: "Throughput-first with acceptable cost trade-offs",
    strategyBias: "maximize-speed" as const,
    weights: { "strategy-lead": 0.3, "cost-engineer": 0.15, "throughput-engineer": 0.4, "systems-optimizer": 0.15 },
  },
  {
    id: "team-sigma",
    name: "Team Sigma",
    philosophy: "Cost dominance through lean operations",
    strategyBias: "minimize-cost" as const,
    weights: { "strategy-lead": 0.25, "cost-engineer": 0.4, "throughput-engineer": 0.15, "systems-optimizer": 0.2 },
  },
  {
    id: "team-omega",
    name: "Team Omega",
    philosophy: "Balanced resilience with quality emphasis",
    strategyBias: "balanced" as const,
    weights: { "strategy-lead": 0.25, "cost-engineer": 0.2, "throughput-engineer": 0.2, "systems-optimizer": 0.35 },
  },
  {
    id: "team-nova",
    name: "Team Nova",
    philosophy: "AI-led adaptive strategy with risk tolerance",
    strategyBias: "adaptive" as const,
    weights: { "strategy-lead": 0.45, "cost-engineer": 0.15, "throughput-engineer": 0.25, "systems-optimizer": 0.15 },
  },
];

const ROLE_META: Record<TeamRole, { label: string; icon: string; agentType: AgentType }> = {
  "strategy-lead":       { label: "Strategy Lead",       icon: "Brain",       agentType: "llm" },
  "cost-engineer":       { label: "Cost Engineer",       icon: "DollarSign",  agentType: "cost" },
  "throughput-engineer": { label: "Throughput Engineer",  icon: "Zap",         agentType: "speed" },
  "systems-optimizer":   { label: "Systems Optimizer",    icon: "Scale",       agentType: "balanced" },
};

const TEAM_COLORS = [
  "hsl(185, 80%, 50%)",
  "hsl(150, 70%, 45%)",
  "hsl(280, 70%, 60%)",
  "hsl(38, 90%, 55%)",
];

// ——— Build teams from independent edge function generations ———
export interface TeamGenerationResult {
  teamIndex: number;
  generation: any; // raw generation from edge function
}

export function buildTeamsFromGenerations(teamResults: TeamGenerationResult[]): AITeam[] {
  const teams: AITeam[] = teamResults.map(({ teamIndex, generation }) => {
    const def = TEAM_DEFINITIONS[teamIndex];
    const survivor = generation.survivor;
    const proposals = generation.proposals || [];

    // Build role contributions from the generation's proposals
    // Each proposal in the generation represents a different agent within the team
    const roles: RoleContribution[] = (Object.keys(ROLE_META) as TeamRole[]).map(role => {
      const meta = ROLE_META[role];
      const weight = def.weights[role];

      // Find the matching proposal by strategy bias
      const matchingProposal = proposals.find((p: any) => {
        const name = (p.agentName || "").toLowerCase();
        if (role === "cost-engineer") return name.includes("cost");
        if (role === "throughput-engineer") return name.includes("throughput") || name.includes("speed");
        if (role === "systems-optimizer") return name.includes("balance") || name.includes("quality");
        if (role === "strategy-lead") return name.includes("llm") || name.includes("strategist");
        return false;
      }) || proposals[0];

      return {
        role,
        agentType: meta.agentType,
        label: meta.label,
        icon: meta.icon,
        focus: matchingProposal
          ? `Score ${matchingProposal.score}/100, ${matchingProposal.reasoning?.slice(0, 60) || "optimizing"} (${Math.round(weight * 100)}% influence)`
          : `${meta.label} active (${Math.round(weight * 100)}% influence)`,
        suggestion: matchingProposal?.reasoning || "Contributing to team strategy",
        influenceWeight: weight,
      };
    });

    // Team result comes from the SURVIVOR of this team's independent generation
    const result: SimulationResult = {
      agentId: def.id,
      agentName: def.name,
      agentType: "balanced" as AgentType,
      assignments: [], // Edge function doesn't return assignments
      totalCost: survivor?.projectedCost || 0,
      totalTime: Math.round((survivor?.projectedThroughput || 100) / 2), // derive time
      throughput: survivor?.projectedThroughput || 0,
      score: survivor?.score || generation.fitnessScore || 0,
      color: TEAM_COLORS[teamIndex] || TEAM_COLORS[0],
    };

    // Build reasoning from actual server-side data
    const reasoning = buildServerReasoning(def, generation, survivor, proposals);
    const llmProposal = proposals.find((p: any) => (p.agentName || "").includes("LLM"));
    const decisionFlow = [
      `Strategy Lead called with bias: "${def.strategyBias}"`,
      `${proposals.length} agents competed internally`,
      `${proposals.filter((p: any) => p.survived).length} survived stress tests`,
      `Winner: ${survivor?.agentName || "none"} (score: ${survivor?.score || 0}/100)`,
    ];

    return {
      id: def.id,
      name: def.name,
      philosophy: def.philosophy,
      roles,
      reasoning,
      decisionFlow,
      result,
      isWinner: false,
      serverReasoning: llmProposal?.reasoning,
      proposals,
    };
  });

  // Sort by score, mark winner
  teams.sort((a, b) => b.result.score - a.result.score);
  if (teams.length > 0) teams[0].isWinner = true;

  return teams;
}

function buildServerReasoning(def: typeof TEAM_DEFINITIONS[0], generation: any, survivor: any, proposals: any[]): string[] {
  const reasons: string[] = [];

  reasons.push(`Strategy bias: "${def.strategyBias}" → ${proposals.length} agents generated server-side`);

  // Show which agents survived stress tests
  const survived = proposals.filter((p: any) => p.survived);
  const failed = proposals.filter((p: any) => !p.survived);
  reasons.push(`${survived.length}/${proposals.length} agents survived adversarial stress tests`);

  if (failed.length > 0) {
    const failNames = failed.map((p: any) => p.agentName).join(", ");
    reasons.push(`Eliminated: ${failNames}`);
  }

  // Show attack info
  const attacks = generation.attacks || [];
  if (attacks.length > 0) {
    const targeted = attacks.filter((a: any) => a.description?.includes("[targeted"));
    reasons.push(`Faced ${attacks.length} stress tests (${targeted.length} targeted at vulnerabilities)`);
  }

  // Survivor details
  if (survivor) {
    reasons.push(`Winner "${survivor.agentName}" — score ${survivor.score}, throughput ${survivor.projectedThroughput}, cost ${survivor.projectedCost}`);
    if (survivor.reasoning) {
      reasons.push(`AI reasoning: ${survivor.reasoning}`);
    }
  }

  // Improvement
  if (generation.improvement && generation.improvement !== 0) {
    reasons.push(`Improvement over previous: ${generation.improvement > 0 ? "+" : ""}${generation.improvement}%`);
  }

  return reasons;
}

// ——— Legacy: build teams from local simulation results (fallback) ———
export function buildTeams(results: SimulationResult[]): AITeam[] {
  if (results.length < 4) return [];

  const byType: Record<AgentType, SimulationResult> = {} as any;
  results.forEach(r => { byType[r.agentType] = r; });

  const ordered = [...results].sort((a, b) => b.score - a.score);
  if (!byType.llm) byType.llm = ordered[0];
  if (!byType.cost) byType.cost = ordered[1] || ordered[0];
  if (!byType.speed) byType.speed = ordered[2] || ordered[0];
  if (!byType.balanced) byType.balanced = ordered[3] || ordered[0];

  const teams: AITeam[] = TEAM_DEFINITIONS.map((def, idx) => {
    const roles: RoleContribution[] = (Object.keys(ROLE_META) as TeamRole[]).map(role => {
      const meta = ROLE_META[role];
      const agentResult = byType[meta.agentType];
      const weight = def.weights[role];

      return {
        role,
        agentType: meta.agentType,
        label: meta.label,
        icon: meta.icon,
        focus: `${meta.label} active (${Math.round(weight * 100)}% influence)`,
        suggestion: `Contributing to "${def.philosophy}"`,
        influenceWeight: weight,
      };
    });

    let totalCost = 0, totalTime = 0, throughput = 0, score = 0;
    for (const role of roles) {
      const r = byType[role.agentType];
      const w = role.influenceWeight;
      totalCost += r.totalCost * w;
      totalTime += r.totalTime * w;
      throughput += r.throughput * w;
      score += r.score * w;
    }

    const weightVariance = Object.values(def.weights).reduce((sum, w) => sum + Math.pow(w - 0.25, 2), 0);
    const synergyBonus = Math.round((1 - weightVariance * 8) * 5);

    const mergedResult: SimulationResult = {
      agentId: def.id,
      agentName: def.name,
      agentType: "balanced" as AgentType,
      assignments: byType.balanced.assignments,
      totalCost: Math.round(totalCost),
      totalTime: Math.round(totalTime),
      throughput: Math.round(throughput * 100) / 100,
      score: Math.min(100, Math.round(score + synergyBonus)),
      color: TEAM_COLORS[idx] || TEAM_COLORS[0],
    };

    return {
      id: def.id,
      name: def.name,
      philosophy: def.philosophy,
      roles,
      reasoning: [`Local simulation — ${def.strategyBias} bias applied`],
      decisionFlow: [
        `Strategy: "${def.philosophy}"`,
        "Local agents optimized",
        "Weighted merge applied",
        `Score: ${mergedResult.score}/100`,
      ],
      result: mergedResult,
      isWinner: false,
    };
  });

  teams.sort((a, b) => b.result.score - a.result.score);
  if (teams.length > 0) teams[0].isWinner = true;
  return teams;
}
