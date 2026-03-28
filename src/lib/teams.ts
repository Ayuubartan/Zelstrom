// AI Teams — multi-agent team competition model
// Each team has 4 roles that collaborate to produce a unified factory plan

import type { SimulationResult, FactoryScenario, AgentType, Assignment } from "./factory";

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
}

// Team templates — each emphasizes different role weights
const TEAM_TEMPLATES = [
  {
    name: "Alpha",
    philosophy: "Throughput-first with acceptable cost trade-offs",
    weights: { "strategy-lead": 0.3, "cost-engineer": 0.15, "throughput-engineer": 0.4, "systems-optimizer": 0.15 },
  },
  {
    name: "Sigma",
    philosophy: "Cost dominance through lean operations",
    weights: { "strategy-lead": 0.25, "cost-engineer": 0.4, "throughput-engineer": 0.15, "systems-optimizer": 0.2 },
  },
  {
    name: "Omega",
    philosophy: "Balanced resilience with quality emphasis",
    weights: { "strategy-lead": 0.25, "cost-engineer": 0.2, "throughput-engineer": 0.2, "systems-optimizer": 0.35 },
  },
  {
    name: "Nova",
    philosophy: "AI-led adaptive strategy with risk tolerance",
    weights: { "strategy-lead": 0.45, "cost-engineer": 0.15, "throughput-engineer": 0.25, "systems-optimizer": 0.15 },
  },
];

const ROLE_META: Record<TeamRole, { label: string; icon: string; agentType: AgentType }> = {
  "strategy-lead":       { label: "Strategy Lead",       icon: "Brain",  agentType: "llm" },
  "cost-engineer":       { label: "Cost Engineer",       icon: "DollarSign", agentType: "cost" },
  "throughput-engineer": { label: "Throughput Engineer",  icon: "Zap",    agentType: "speed" },
  "systems-optimizer":   { label: "Systems Optimizer",    icon: "Scale",  agentType: "balanced" },
};

// Build teams from 4 individual simulation results
export function buildTeams(results: SimulationResult[]): AITeam[] {
  if (results.length < 4) return [];

  // Map individual results to roles by agent type
  const byType: Record<AgentType, SimulationResult> = {} as any;
  results.forEach(r => { byType[r.agentType] = r; });

  // Fallback — assign in order if types don't match exactly
  const ordered = [...results].sort((a, b) => b.score - a.score);
  if (!byType.llm) byType.llm = ordered[0];
  if (!byType.cost) byType.cost = ordered[1] || ordered[0];
  if (!byType.speed) byType.speed = ordered[2] || ordered[0];
  if (!byType.balanced) byType.balanced = ordered[3] || ordered[0];

  const teams: AITeam[] = TEAM_TEMPLATES.map((tmpl, idx) => {
    const roles: RoleContribution[] = (Object.keys(ROLE_META) as TeamRole[]).map(role => {
      const meta = ROLE_META[role];
      const agentResult = byType[meta.agentType];
      const weight = tmpl.weights[role];

      return {
        role,
        agentType: meta.agentType,
        label: meta.label,
        icon: meta.icon,
        focus: generateFocus(role, agentResult, weight),
        suggestion: generateSuggestion(role, agentResult, tmpl.philosophy),
        influenceWeight: weight,
      };
    });

    // Merge results with weighted scoring
    const mergedResult = mergeTeamResults(roles, byType, tmpl.weights, tmpl.name, idx);
    const reasoning = generateTeamReasoning(roles, tmpl.philosophy, mergedResult);
    const decisionFlow = [
      `Strategy Lead defines: "${tmpl.philosophy}"`,
      `Engineers optimize within constraints`,
      `Systems Optimizer validates stability`,
      `Final plan scored: ${mergedResult.score}/100`,
    ];

    return {
      id: `team-${tmpl.name.toLowerCase()}`,
      name: `Team ${tmpl.name}`,
      philosophy: tmpl.philosophy,
      roles,
      reasoning,
      decisionFlow,
      result: mergedResult,
      isWinner: false,
    };
  });

  // Sort by score, mark winner
  teams.sort((a, b) => b.result.score - a.result.score);
  if (teams.length > 0) teams[0].isWinner = true;

  return teams;
}

function mergeTeamResults(
  roles: RoleContribution[],
  byType: Record<AgentType, SimulationResult>,
  weights: Record<string, number>,
  teamName: string,
  teamIndex: number
): SimulationResult {
  // Weighted average of each role's agent metrics
  let totalCost = 0, totalTime = 0, throughput = 0, score = 0;

  for (const role of roles) {
    const r = byType[role.agentType];
    const w = role.influenceWeight;
    totalCost += r.totalCost * w;
    totalTime += r.totalTime * w;
    throughput += r.throughput * w;
    score += r.score * w;
  }

  // Team synergy bonus: balanced weight distribution scores higher
  const weightVariance = Object.values(weights).reduce((sum, w) => sum + Math.pow(w - 0.25, 2), 0);
  const synergyBonus = Math.round((1 - weightVariance * 8) * 5); // 0-5 points

  return {
    agentId: `team-${teamName.toLowerCase()}`,
    agentName: `Team ${teamName}`,
    agentType: "balanced" as AgentType,
    assignments: byType.balanced.assignments, // Use balanced assignments as base
    totalCost: Math.round(totalCost),
    totalTime: Math.round(totalTime),
    throughput: Math.round(throughput * 100) / 100,
    score: Math.min(100, Math.round(score + synergyBonus)),
    color: [`hsl(185, 80%, 50%)`, `hsl(150, 70%, 45%)`, `hsl(280, 70%, 60%)`, `hsl(38, 90%, 55%)`][teamIndex] || `hsl(185, 80%, 50%)`,
  };
}

function generateFocus(role: TeamRole, result: SimulationResult, weight: number): string {
  const influence = Math.round(weight * 100);
  switch (role) {
    case "strategy-lead": return `Coordinating team direction (${influence}% influence)`;
    case "cost-engineer": return `Optimizing to $${result.totalCost} target (${influence}% influence)`;
    case "throughput-engineer": return `Maximizing ${result.throughput} j/m output (${influence}% influence)`;
    case "systems-optimizer": return `Maintaining balance at score ${result.score} (${influence}% influence)`;
  }
}

function generateSuggestion(role: TeamRole, result: SimulationResult, philosophy: string): string {
  switch (role) {
    case "strategy-lead": return `Aligned plan with "${philosophy}" — prioritizing accordingly`;
    case "cost-engineer":
      return result.totalCost > 300 ? "Recommended reducing non-critical machine usage" : "Costs within acceptable range";
    case "throughput-engineer":
      return result.throughput > 1.5 ? "Output exceeds minimum threshold — holding position" : "Proposed speed increase on bottleneck machines";
    case "systems-optimizer":
      return result.score > 60 ? "System stability acceptable — no override needed" : "Flagged risk: suggested dampening extreme parameters";
  }
}

function generateTeamReasoning(roles: RoleContribution[], philosophy: string, result: SimulationResult): string[] {
  const reasons: string[] = [];
  reasons.push(`Strategy Lead set direction: "${philosophy}"`);

  const costRole = roles.find(r => r.role === "cost-engineer")!;
  const speedRole = roles.find(r => r.role === "throughput-engineer")!;

  if (costRole.influenceWeight > 0.3) {
    reasons.push("Cost Engineer dominated — reduced resource allocation on non-critical machines");
  }
  if (speedRole.influenceWeight > 0.3) {
    reasons.push("Throughput Engineer dominated — accepted higher cost for faster output");
  }
  if (result.score > 65) {
    reasons.push("Systems Optimizer approved: balanced risk profile");
  } else {
    reasons.push("Systems Optimizer flagged moderate risk — accepted for this iteration");
  }
  reasons.push(`Final team score: ${result.score}/100 after weighted merge`);

  return reasons;
}
