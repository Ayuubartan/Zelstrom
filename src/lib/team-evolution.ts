// Team Evolution Intelligence Layer
// Tracks team lifecycle: creation → competition → survival → retirement

import type { AITeam } from "./teams";

export type TeamStatus = "active" | "survived" | "retired" | "winner";

export interface TeamSnapshot {
  teamId: string;
  teamName: string;
  score: number;
  status: TeamStatus;
  philosophy: string;
}

export interface TeamMutation {
  teamId: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

export interface RetirementReason {
  teamId: string;
  teamName: string;
  reasons: string[];
}

export interface TeamGeneration {
  generationId: number;
  timestamp: number;
  teams: TeamSnapshot[];
  winnerTeamId: string;
  survivorIds: string[];
  retiredIds: string[];
  retirementReasons: RetirementReason[];
  mutations: TeamMutation[];
  fitnessScore: number;
  improvementPct: number;
}

export interface EvolutionMeta {
  improvementRate: number;      // avg improvement per gen
  diversityScore: number;       // how different teams are
  convergenceRisk: "low" | "medium" | "high";
  dominantTeam: string | null;
  dominantStreak: number;
  totalTeamsCreated: number;
  totalTeamsRetired: number;
  totalMutations: number;
}

// Build a generation record from the current teams
export function recordGeneration(
  teams: AITeam[],
  generationId: number,
  previousGenerations: TeamGeneration[]
): TeamGeneration {
  const sorted = [...teams].sort((a, b) => b.result.score - a.result.score);
  const winner = sorted[0];
  const survivors = sorted.slice(0, 2);
  const retired = sorted.slice(2);

  const retirementReasons: RetirementReason[] = retired.map(t => ({
    teamId: t.id,
    teamName: t.name,
    reasons: analyzeRetirement(t, winner),
  }));

  const mutations = generateMutations(sorted, previousGenerations);

  const prevBest = previousGenerations.length > 0
    ? previousGenerations[previousGenerations.length - 1].fitnessScore
    : 0;
  const improvementPct = prevBest > 0
    ? Math.round(((winner.result.score - prevBest) / prevBest) * 100)
    : 0;

  return {
    generationId,
    timestamp: Date.now(),
    teams: sorted.map(t => ({
      teamId: t.id,
      teamName: t.name,
      score: t.result.score,
      status: t === winner ? "winner" : survivors.includes(t) ? "survived" : "retired",
      philosophy: t.philosophy,
    })),
    winnerTeamId: winner.id,
    survivorIds: survivors.map(s => s.id),
    retiredIds: retired.map(r => r.id),
    retirementReasons,
    mutations,
    fitnessScore: winner.result.score,
    improvementPct,
  };
}

function analyzeRetirement(team: AITeam, winner: AITeam): string[] {
  const reasons: string[] = [];
  const r = team.result;
  const w = winner.result;

  if (r.totalCost > w.totalCost * 1.2) reasons.push(`High cost ($${r.totalCost} vs winner's $${w.totalCost})`);
  if (r.totalTime > w.totalTime * 1.3) reasons.push(`Slow execution (${r.totalTime}m vs winner's ${w.totalTime}m)`);
  if (r.throughput < w.throughput * 0.8) reasons.push(`Low throughput (${r.throughput} vs winner's ${w.throughput} j/m)`);
  if (r.score < 40) reasons.push("Failed minimum fitness threshold (score < 40)");

  // Role-based analysis
  const speedWeight = team.roles.find(rl => rl.role === "throughput-engineer")?.influenceWeight || 0;
  const costWeight = team.roles.find(rl => rl.role === "cost-engineer")?.influenceWeight || 0;
  if (speedWeight > 0.35 && r.totalCost > w.totalCost) reasons.push("Over-optimized for speed at cost of budget");
  if (costWeight > 0.35 && r.throughput < w.throughput) reasons.push("Over-optimized for cost at expense of output");

  if (reasons.length === 0) reasons.push("Outperformed by competing teams on overall fitness");

  return reasons;
}

function generateMutations(teams: AITeam[], previousGens: TeamGeneration[]): TeamMutation[] {
  const mutations: TeamMutation[] = [];

  if (previousGens.length === 0) return mutations;

  const prevGen = previousGens[previousGens.length - 1];

  for (const team of teams) {
    const prevSnap = prevGen.teams.find(t => t.teamId === team.id);
    if (!prevSnap) {
      mutations.push({ teamId: team.id, description: `${team.name} entered competition`, impact: "neutral" });
      continue;
    }
    const scoreDiff = team.result.score - prevSnap.score;
    if (scoreDiff > 5) {
      mutations.push({ teamId: team.id, description: `${team.name} improved +${scoreDiff}pts via weight rebalancing`, impact: "positive" });
    } else if (scoreDiff < -5) {
      mutations.push({ teamId: team.id, description: `${team.name} regressed ${scoreDiff}pts — scenario shift`, impact: "negative" });
    } else {
      mutations.push({ teamId: team.id, description: `${team.name} held steady (±${Math.abs(scoreDiff)}pts)`, impact: "neutral" });
    }
  }

  return mutations;
}

// Compute meta-level evaluation across all generations
export function computeEvolutionMeta(generations: TeamGeneration[]): EvolutionMeta {
  if (generations.length === 0) {
    return {
      improvementRate: 0,
      diversityScore: 100,
      convergenceRisk: "low",
      dominantTeam: null,
      dominantStreak: 0,
      totalTeamsCreated: 0,
      totalTeamsRetired: 0,
      totalMutations: 0,
    };
  }

  // Improvement rate
  const improvements = generations.map(g => g.improvementPct).filter(i => i !== 0);
  const improvementRate = improvements.length > 0
    ? Math.round(improvements.reduce((s, v) => s + v, 0) / improvements.length)
    : 0;

  // Diversity — how different are last gen's scores
  const lastGen = generations[generations.length - 1];
  const scores = lastGen.teams.map(t => t.score);
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + Math.pow(v - avgScore, 2), 0) / scores.length;
  const diversityScore = Math.min(100, Math.round(Math.sqrt(variance) * 10));

  // Dominant team streak
  let dominantStreak = 0;
  let dominantTeam: string | null = null;
  for (let i = generations.length - 1; i >= 0; i--) {
    const winner = generations[i].winnerTeamId;
    if (i === generations.length - 1) {
      dominantTeam = winner;
      dominantStreak = 1;
    } else if (winner === dominantTeam) {
      dominantStreak++;
    } else {
      break;
    }
  }

  // Convergence risk
  const convergenceRisk = dominantStreak >= 5 ? "high" : dominantStreak >= 3 ? "medium" : "low";

  return {
    improvementRate,
    diversityScore,
    convergenceRisk,
    dominantTeam,
    dominantStreak,
    totalTeamsCreated: generations.reduce((s, g) => s + g.teams.length, 0),
    totalTeamsRetired: generations.reduce((s, g) => s + g.retiredIds.length, 0),
    totalMutations: generations.reduce((s, g) => s + g.mutations.length, 0),
  };
}

// Generate team history across generations for a specific team
export function getTeamHistory(teamId: string, generations: TeamGeneration[]): TeamSnapshot[] {
  return generations
    .map(g => g.teams.find(t => t.teamId === teamId))
    .filter((t): t is TeamSnapshot => !!t);
}
