// Zelstrom Database Service Layer
// Replaces localStorage bridges with real PostgreSQL via Lovable Cloud

import { supabase } from "@/integrations/supabase/client";
import type { DeploymentRecord, DeploymentResult, DeployedConfig } from "@/lib/deploy-bridge";
import type { PipelineRunResult } from "@/lib/feedback-bridge";
import type { SelfHealEvent } from "@/lib/self-healing";
import type { EvolutionGeneration, AgentProposal } from "@/lib/sdmf";
import type { StageConfig } from "@/lib/workflow";
import type { OrchestrationPlan } from "@/store/zelstromStore";

// ============================================================
// GENERATIONS
// ============================================================

export async function saveGeneration(gen: EvolutionGeneration, strategyBias: string): Promise<void> {
  await supabase.from("generations").insert({
    generation_number: gen.id,
    timestamp: gen.timestamp,
    proposals: gen.proposals as any,
    attacks: gen.attacks as any,
    survivor: gen.survivor as any,
    retired: gen.retired as any,
    fitness_score: gen.fitnessScore,
    improvement: gen.improvement,
    strategy_bias: strategyBias,
  });
}

export async function getGenerations(limit = 50): Promise<EvolutionGeneration[]> {
  const { data } = await supabase
    .from("generations")
    .select("*")
    .order("generation_number", { ascending: true })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: row.generation_number,
    timestamp: row.timestamp,
    proposals: row.proposals as unknown as AgentProposal[],
    attacks: row.attacks as any,
    survivor: row.survivor as unknown as AgentProposal | null,
    retired: row.retired as unknown as AgentProposal[],
    fitnessScore: row.fitness_score,
    improvement: row.improvement,
  }));
}

// ============================================================
// DEPLOYMENTS
// ============================================================

export async function saveDeployment(record: DeploymentRecord): Promise<void> {
  await supabase.from("deployments").insert({
    generation_id: record.generationId,
    agent_name: record.agentName,
    score: record.score,
    stage_configs: record.stageConfigs as any,
    result: record.result as any ?? null,
  });
}

export async function getDeployments(limit = 20): Promise<DeploymentRecord[]> {
  const { data } = await supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    generationId: row.generation_id,
    agentName: row.agent_name,
    score: row.score,
    timestamp: new Date(row.created_at).getTime(),
    stageConfigs: row.stage_configs as unknown as Record<string, StageConfig>,
    result: row.result as unknown as DeploymentResult | undefined,
  }));
}

export async function recordDeploymentResult(deploymentId: string, result: DeploymentResult): Promise<void> {
  await supabase
    .from("deployments")
    .update({ result: result as any })
    .eq("id", deploymentId);
}

export async function getLatestUnresolvedDeployment(agentName: string): Promise<string | null> {
  const { data } = await supabase
    .from("deployments")
    .select("id")
    .eq("agent_name", agentName)
    .is("result", null)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0]?.id ?? null;
}

// ============================================================
// PIPELINE RUNS
// ============================================================

export async function savePipelineRun(run: PipelineRunResult): Promise<void> {
  await supabase.from("pipeline_runs").insert({
    deployed_generation_id: run.deployedGenerationId,
    deployed_agent_name: run.deployedAgentName,
    stages: run.stages as any,
    totals: run.totals as any,
  });
}

export async function getPipelineRuns(limit = 10): Promise<PipelineRunResult[]> {
  const { data } = await supabase
    .from("pipeline_runs")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    deployedGenerationId: row.deployed_generation_id,
    deployedAgentName: row.deployed_agent_name,
    stages: row.stages as any,
    totals: row.totals as any,
  }));
}

// ============================================================
// ORCHESTRATION PLANS
// ============================================================

export async function saveOrchestrationPlan(plan: OrchestrationPlan): Promise<void> {
  await supabase.from("orchestration_plans").insert({
    id: plan.id,
    strategy: plan.strategy,
    scenario_id: plan.scenarioId,
    sandbox_results: plan.sandboxResults as any,
    sdmf_generation: plan.sdmfGeneration as any,
    deployed_agent: plan.deployedAgent as any,
    score: plan.score,
    status: plan.status,
  });
}

export async function getOrchestrationPlans(limit = 20): Promise<OrchestrationPlan[]> {
  const { data } = await supabase
    .from("orchestration_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    strategy: row.strategy as any,
    timestamp: new Date(row.created_at).getTime(),
    scenarioId: row.scenario_id ?? "none",
    sandboxResults: row.sandbox_results as any,
    sdmfGeneration: row.sdmf_generation as any,
    deployedAgent: row.deployed_agent as any,
    score: row.score,
    status: row.status as any,
  }));
}

// ============================================================
// HEAL EVENTS
// ============================================================

export async function saveHealEvents(events: SelfHealEvent[]): Promise<void> {
  if (events.length === 0) return;
  const rows = events.map((e) => ({
    anomaly_type: e.anomalyType,
    severity: e.severity,
    station_id: e.stationId,
    station_name: e.stationName,
    sensor_id: e.sensorId ?? null,
    sensor_value: e.sensorValue ?? null,
    sensor_unit: e.sensorUnit ?? null,
    threshold: e.threshold,
    action: e.action,
    description: e.description,
    resolution: e.resolution,
    duration_ms: e.durationMs,
    success: e.success,
  }));
  await supabase.from("heal_events").insert(rows);
}

export async function getHealEvents(limit = 50): Promise<SelfHealEvent[]> {
  const { data } = await supabase
    .from("heal_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    anomalyType: row.anomaly_type as any,
    severity: row.severity as any,
    stationId: row.station_id,
    stationName: row.station_name,
    sensorId: row.sensor_id ?? undefined,
    sensorValue: row.sensor_value ?? undefined,
    sensorUnit: row.sensor_unit ?? undefined,
    threshold: row.threshold,
    action: row.action as any,
    description: row.description,
    resolution: row.resolution,
    durationMs: row.duration_ms,
    success: row.success,
  }));
}

// ============================================================
// AGENTS (Leaderboard DNA)
// ============================================================

export async function upsertAgent(agent: {
  agentName: string;
  agentType?: string;
  deployments?: number;
  totalRuns?: number;
  avgYield?: number;
  avgEfficiency?: number;
  avgDefects?: number;
  avgCost?: number;
  fitnessScore?: number;
  dominanceRank?: number;
  version?: number;
  status?: string;
}): Promise<void> {
  await supabase.from("agents").upsert({
    agent_name: agent.agentName,
    agent_type: agent.agentType ?? "optimizer",
    deployments: agent.deployments ?? 0,
    total_runs: agent.totalRuns ?? 0,
    avg_yield: agent.avgYield ?? 0,
    avg_efficiency: agent.avgEfficiency ?? 0,
    avg_defects: agent.avgDefects ?? 0,
    avg_cost: agent.avgCost ?? 0,
    fitness_score: agent.fitnessScore ?? 50,
    dominance_rank: agent.dominanceRank ?? 0,
    version: agent.version ?? 1,
    status: agent.status ?? "contender",
  }, { onConflict: "agent_name" });
}

export async function getAgents(): Promise<any[]> {
  const { data } = await supabase
    .from("agents")
    .select("*")
    .order("fitness_score", { ascending: false });

  return data ?? [];
}
