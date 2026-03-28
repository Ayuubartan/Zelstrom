// Shared deployment bridge between SDMF Command Center and Workflow Builder
import type { AgentProposal } from "@/lib/sdmf";
import type { StageConfig } from "@/lib/workflow";
import { saveDeployment, recordDeploymentResult as dbRecordResult, getLatestUnresolvedDeployment } from "@/lib/db";

export interface DeployedConfig {
  generationId: number;
  agentName: string;
  score: number;
  timestamp: number;
  stageConfigs: Record<string, StageConfig>;
}

/** Real-world performance data attached after pipeline execution */
export interface DeploymentResult {
  yield: number;        // 0-1
  efficiency: number;   // 0-100
  defects: number;
  cost: number;
  timestamp: number;
  agentName: string;
}

/** Full deployment record with optional real-world results */
export interface DeploymentRecord {
  id: string;
  generationId: number;
  agentName: string;
  score: number;
  timestamp: number;
  stageConfigs: Record<string, StageConfig>;
  result?: DeploymentResult;
}

const STORAGE_KEY = "sdmf-deployed-config";
const HISTORY_KEY = "sdmf-deploy-history";

// Map SDMF ProcessConfig → Workflow StageConfig per station type
const STATION_TO_STAGE: Record<string, string> = {
  'stn-cnc': 'cnc',
  'stn-weld': 'welding',
  'stn-paint': 'painting',
  'stn-asm': 'assembly',
  'stn-qc': 'qc',
  'stn-pkg': 'packaging',
  'stn-3dp': 'cnc',
  'stn-laser': 'cnc',
};

export function deployWinnerToWorkflow(proposal: AgentProposal, generationId: number): DeployedConfig {
  const stageConfigs: Record<string, StageConfig> = {};

  proposal.configs.forEach(cfg => {
    const stageType = STATION_TO_STAGE[cfg.stationId] || 'cnc';
    stageConfigs[stageType] = {
      machineCount: Math.max(1, Math.round(cfg.routingPriority / 2)),
      speedMultiplier: Math.round(cfg.speed * 10) / 10,
      costPerUnit: Math.round(cfg.pressure * 0.3 + 5),
      defectRate: Math.round((1 - cfg.qualityThreshold) * 100) / 100,
      batchSize: cfg.batchSize,
      maxCapacity: cfg.batchSize * 4,
    };
  });

  const deployed: DeployedConfig = {
    generationId,
    agentName: proposal.agentName,
    score: proposal.score,
    timestamp: Date.now(),
    stageConfigs,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(deployed));

  // Append to deployment records
  const record: DeploymentRecord = {
    id: `deploy-${Date.now()}-${generationId}`,
    generationId,
    agentName: proposal.agentName,
    score: proposal.score,
    timestamp: Date.now(),
    stageConfigs,
  };
  const history = getDeployHistory();
  history.push(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
  window.dispatchEvent(new CustomEvent("sdmf-deploy", { detail: deployed }));
  return deployed;
}

/** Attach real-world pipeline results to the most recent unresolved deployment */
export function recordPipelineFeedback(result: DeploymentResult): void {
  const history = getDeployHistory();
  // Find the latest deployment without results for this agent
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i].result && history[i].agentName === result.agentName) {
      history[i].result = result;
      break;
    }
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent("sdmf-feedback-recorded", { detail: result }));
}

export function getDeployedConfig(): DeployedConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDeployedConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDeployHistory(): DeploymentRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old DeployedConfig[] to DeploymentRecord[]
    return parsed.map((item: any) => ({
      id: item.id || `deploy-${item.timestamp}-${item.generationId}`,
      generationId: item.generationId,
      agentName: item.agentName,
      score: item.score,
      timestamp: item.timestamp,
      stageConfigs: item.stageConfigs,
      result: item.result || undefined,
    }));
  } catch {
    return [];
  }
}

export function clearDeployHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
