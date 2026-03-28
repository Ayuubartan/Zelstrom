// Evolution Engine — Bayesian Fitness with Real-World Feedback Bias
// Implements "Genetic Dominance" where battle-tested agents receive multiplied fitness

import { getDeployHistory, type DeploymentRecord } from "@/lib/deploy-bridge";
import { getPipelineHistory, type PipelineRunResult } from "@/lib/feedback-bridge";

/** Agent performance profile computed from deployment history */
export interface AgentDNA {
  agentName: string;
  deployments: number;
  totalRuns: number;
  avgYield: number;       // 0-1
  avgEfficiency: number;  // 0-100
  avgDefects: number;
  avgCost: number;
  fitnessScore: number;   // Bayesian-weighted
  dominanceRank: number;  // 1 = alpha
  version: number;        // increments with each generation
  status: 'alpha' | 'contender' | 'retired';
}

const REAL_WORLD_MULTIPLIER = 2.5; // Battle-tested bonus (strengthened from 1.5)
const ALPHA_THRESHOLD = 70;        // Score above this = alpha
const RETIRE_THRESHOLD = 25;       // Score below this = retired

/**
 * Calculate Bayesian-weighted fitness for an agent.
 * Combines simulated score with real-world performance data.
 * Strengthened: real-world data now contributes up to ~25-35 points (was ~10-15).
 * More deployments = stronger signal (confidence scaling).
 */
export function calculateBayesianFitness(
  agentName: string,
  simulatedScore: number,
  history: DeploymentRecord[]
): { score: number; bonus: number; deployments: number } {
  const agentDeployments = history.filter(h => h.agentName === agentName && h.result);

  if (agentDeployments.length === 0) {
    return { score: simulatedScore, bonus: 0, deployments: 0 };
  }

  // Compute average real-world performance
  const avgEfficiency = agentDeployments.reduce((acc, d) => acc + (d.result!.efficiency), 0) / agentDeployments.length;
  const avgYield = agentDeployments.reduce((acc, d) => acc + (d.result!.yield), 0) / agentDeployments.length;
  const avgDefectPenalty = agentDeployments.reduce((acc, d) => acc + d.result!.defects, 0) / agentDeployments.length;

  // Weighted real-world score: 60% efficiency + 40% yield - defect penalty
  const realWorldScore = (avgEfficiency * 0.6) + (avgYield * 100 * 0.4) - (avgDefectPenalty * 0.5);

  // Confidence scaling: more deployments = stronger signal (caps at 5 deploys)
  const confidence = Math.min(1.0, agentDeployments.length / 5);

  // Strengthened bonus: multiplier increased from 0.15 to 0.4, scaled by confidence
  const bonus = Math.round(realWorldScore * REAL_WORLD_MULTIPLIER * 0.4 * confidence);
  const finalScore = Math.min(100, Math.max(0, simulatedScore + bonus));

  return { score: finalScore, bonus, deployments: agentDeployments.length };
}

/**
 * Build the full Agent DNA leaderboard from deployment history.
 */
export function buildAgentLeaderboard(): AgentDNA[] {
  const history = getDeployHistory();
  const pipelineHistory = getPipelineHistory();

  // Collect all unique agent names
  const agentNames = new Set<string>();
  history.forEach(h => agentNames.add(h.agentName));
  pipelineHistory.forEach(r => {
    if (r.deployedAgentName) agentNames.add(r.deployedAgentName);
  });

  const agents: AgentDNA[] = [];

  agentNames.forEach(name => {
    const deploys = history.filter(h => h.agentName === name);
    const withResults = deploys.filter(h => h.result);
    const runs = pipelineHistory.filter(r => r.deployedAgentName === name);

    const avgYield = withResults.length > 0
      ? withResults.reduce((s, d) => s + d.result!.yield, 0) / withResults.length
      : 0;
    const avgEfficiency = withResults.length > 0
      ? withResults.reduce((s, d) => s + d.result!.efficiency, 0) / withResults.length
      : 0;
    const avgDefects = runs.length > 0
      ? runs.reduce((s, r) => s + r.totals.totalDefects, 0) / runs.length
      : 0;
    const avgCost = runs.length > 0
      ? runs.reduce((s, r) => s + r.totals.totalCost, 0) / runs.length
      : 0;

    // Base score from latest deployment
    const latestScore = deploys.length > 0 ? deploys[deploys.length - 1].score : 50;
    const { score: fitnessScore } = calculateBayesianFitness(name, latestScore, history);

    // Version = number of generations this agent appeared in
    const versions = new Set(deploys.map(d => d.generationId));

    agents.push({
      agentName: name,
      deployments: deploys.length,
      totalRuns: runs.length,
      avgYield,
      avgEfficiency,
      avgDefects,
      avgCost,
      fitnessScore,
      dominanceRank: 0, // Set below
      version: versions.size,
      status: fitnessScore >= ALPHA_THRESHOLD ? 'alpha'
        : fitnessScore >= RETIRE_THRESHOLD ? 'contender'
        : 'retired',
    });
  });

  // Sort by fitness and assign ranks
  agents.sort((a, b) => b.fitnessScore - a.fitnessScore);
  agents.forEach((a, i) => { a.dominanceRank = i + 1; });

  return agents;
}

/**
 * Samsung-style elimination: only top 2 survive, rest are deprioritized.
 * Returns the agent names that should receive genetic inheritance bonus.
 */
export function getGeneticSurvivors(): string[] {
  const leaderboard = buildAgentLeaderboard();
  return leaderboard
    .filter(a => a.status !== 'retired')
    .slice(0, 2)
    .map(a => a.agentName);
}

/**
 * Get fitness modifier for an agent based on its deployment track record.
 * Returns a multiplier: >1 for battle-tested winners, <1 for chronic failures.
 */
export function getAgentFitnessModifier(agentName: string): number {
  const history = getDeployHistory();
  const withResults = history.filter(h => h.agentName === agentName && h.result);

  if (withResults.length === 0) return 1.0; // No data, neutral

  const avgEfficiency = withResults.reduce((s, d) => s + d.result!.efficiency, 0) / withResults.length;

  // High performers (>60% efficiency) get up to 1.5x multiplier
  // Low performers (<30%) get down to 0.7x
  if (avgEfficiency >= 60) return 1.0 + Math.min(0.5, (avgEfficiency - 60) / 80);
  if (avgEfficiency < 30) return Math.max(0.7, avgEfficiency / 30);
  return 1.0;
}
