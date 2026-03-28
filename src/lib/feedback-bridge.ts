// Pipeline Feedback Bridge — sends Workflow run results back to SDMF Command Center
import type { StageMetrics, StageType } from "@/lib/workflow";

export interface PipelineRunResult {
  id: string;
  timestamp: number;
  deployedGenerationId: number | null;
  deployedAgentName: string | null;
  stages: PipelineStageResult[];
  totals: PipelineTotals;
}

export interface PipelineStageResult {
  stageType: StageType;
  name: string;
  metrics: StageMetrics;
}

export interface PipelineTotals {
  totalUnitsIn: number;
  totalUnitsOut: number;
  totalDefects: number;
  totalCost: number;
  avgUtilization: number;
  yieldRate: number; // 0-1
  overallEfficiency: number; // 0-100
}

const STORAGE_KEY = "sdmf-pipeline-feedback";
const EVENT_NAME = "sdmf-pipeline-feedback";

export function publishPipelineResult(result: PipelineRunResult): void {
  // Store last 10 results
  const history = getPipelineHistory();
  history.push(result);
  const trimmed = history.slice(-10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: result }));
}

export function getPipelineHistory(): PipelineRunResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestPipelineResult(): PipelineRunResult | null {
  const history = getPipelineHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

export function clearPipelineHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function computeTotals(stages: PipelineStageResult[]): PipelineTotals {
  if (stages.length === 0) {
    return { totalUnitsIn: 0, totalUnitsOut: 0, totalDefects: 0, totalCost: 0, avgUtilization: 0, yieldRate: 0, overallEfficiency: 0 };
  }

  const totalUnitsIn = stages[0]?.metrics.unitsProcessed ?? 0;
  const totalUnitsOut = stages[stages.length - 1]?.metrics.unitsProcessed - (stages[stages.length - 1]?.metrics.defectsFound ?? 0);
  const totalDefects = stages.reduce((s, st) => s + st.metrics.defectsFound, 0);
  const totalCost = stages.reduce((s, st) => s + st.metrics.totalCost, 0);
  const avgUtilization = Math.round(stages.reduce((s, st) => s + st.metrics.utilization, 0) / stages.length);
  const yieldRate = totalUnitsIn > 0 ? Math.round((totalUnitsOut / totalUnitsIn) * 100) / 100 : 0;
  const overallEfficiency = Math.round(yieldRate * avgUtilization);

  return { totalUnitsIn, totalUnitsOut, totalDefects, totalCost, avgUtilization, yieldRate, overallEfficiency };
}

/** Subscribe to real-time pipeline feedback events */
export function onPipelineFeedback(callback: (result: PipelineRunResult) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<PipelineRunResult>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
