// Shared deployment bridge between SDMF Command Center and Workflow Builder
import type { AgentProposal } from "@/lib/sdmf";
import type { StageConfig } from "@/lib/workflow";

export interface DeployedConfig {
  generationId: number;
  agentName: string;
  score: number;
  timestamp: number;
  stageConfigs: Record<string, StageConfig>; // keyed by station type
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
  'stn-3dp': 'cnc',    // map 3D print to CNC-like
  'stn-laser': 'cnc',  // map laser to CNC-like
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
  // Append to history
  const history = getDeployHistory();
  history.push(deployed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
  window.dispatchEvent(new CustomEvent("sdmf-deploy", { detail: deployed }));
  return deployed;
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
