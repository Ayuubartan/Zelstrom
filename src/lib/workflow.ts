// Workflow Engine — Factory Pipeline

export type StageStatus = 'idle' | 'queued' | 'running' | 'completed' | 'error' | 'paused';

export interface WorkflowStage {
  id: string;
  name: string;
  type: StageType;
  description: string;
  icon: string; // lucide icon name
  status: StageStatus;
  config: StageConfig;
  metrics: StageMetrics;
  position: number; // order in pipeline
}

export type StageType = 'cnc' | 'welding' | 'painting' | 'assembly' | 'qc' | 'packaging';

export interface StageConfig {
  machineCount: number;
  speedMultiplier: number;
  costPerUnit: number;
  defectRate: number; // 0-1
  batchSize: number;
  maxCapacity: number;
}

export interface StageMetrics {
  unitsProcessed: number;
  unitsQueued: number;
  defectsFound: number;
  totalCost: number;
  avgTimePerUnit: number; // minutes
  utilization: number; // 0-100%
}

export interface Workflow {
  id: string;
  name: string;
  stages: WorkflowStage[];
  totalUnits: number;
  completedUnits: number;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'optimizing';
  createdAt: number;
}

export interface WorkflowOptimization {
  agentType: string;
  agentName: string;
  suggestions: StageSuggestion[];
  projectedCost: number;
  projectedTime: number;
  score: number;
}

export interface StageSuggestion {
  stageId: string;
  field: keyof StageConfig;
  currentValue: number;
  suggestedValue: number;
  reason: string;
}

// Default stage templates
const STAGE_TEMPLATES: Record<StageType, Omit<WorkflowStage, 'id' | 'position' | 'status' | 'metrics'>> = {
  cnc: {
    name: 'CNC Machining',
    type: 'cnc',
    description: 'Computer-controlled precision cutting, milling, and shaping of raw materials',
    icon: 'Cog',
    config: { machineCount: 3, speedMultiplier: 1.0, costPerUnit: 12, defectRate: 0.02, batchSize: 50, maxCapacity: 200 },
  },
  welding: {
    name: 'Welding',
    type: 'welding',
    description: 'Joining metal components through arc, MIG, or TIG welding processes',
    icon: 'Flame',
    config: { machineCount: 2, speedMultiplier: 0.8, costPerUnit: 18, defectRate: 0.05, batchSize: 30, maxCapacity: 120 },
  },
  painting: {
    name: 'Painting',
    type: 'painting',
    description: 'Surface coating with primer, base coat, and protective finish layers',
    icon: 'Paintbrush',
    config: { machineCount: 2, speedMultiplier: 1.2, costPerUnit: 8, defectRate: 0.03, batchSize: 40, maxCapacity: 160 },
  },
  assembly: {
    name: 'Assembly',
    type: 'assembly',
    description: 'Combining sub-components into final assemblies with precision fitting',
    icon: 'Wrench',
    config: { machineCount: 4, speedMultiplier: 0.9, costPerUnit: 15, defectRate: 0.04, batchSize: 25, maxCapacity: 150 },
  },
  qc: {
    name: 'Quality Control',
    type: 'qc',
    description: 'Automated and manual inspection for dimensional accuracy and defects',
    icon: 'Search',
    config: { machineCount: 2, speedMultiplier: 1.5, costPerUnit: 6, defectRate: 0.01, batchSize: 60, maxCapacity: 300 },
  },
  packaging: {
    name: 'Packaging',
    type: 'packaging',
    description: 'Final wrapping, labeling, and preparation for shipment',
    icon: 'Package',
    config: { machineCount: 2, speedMultiplier: 1.4, costPerUnit: 4, defectRate: 0.01, batchSize: 80, maxCapacity: 400 },
  },
};

const PIPELINE_ORDER: StageType[] = ['cnc', 'welding', 'painting', 'assembly', 'qc', 'packaging'];

function emptyMetrics(): StageMetrics {
  return { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 };
}

export function createDefaultWorkflow(): Workflow {
  const stages: WorkflowStage[] = PIPELINE_ORDER.map((type, i) => ({
    ...STAGE_TEMPLATES[type],
    id: `stage-${type}`,
    position: i,
    status: 'idle' as StageStatus,
    metrics: emptyMetrics(),
  }));

  return {
    id: `wf-${Date.now()}`,
    name: 'Production Line Alpha',
    stages,
    totalUnits: 100,
    completedUnits: 0,
    status: 'draft',
    createdAt: Date.now(),
  };
}

// Simulate running a workflow
export function simulateWorkflow(workflow: Workflow): Workflow {
  const updated = { ...workflow, status: 'completed' as const };
  let unitsRemaining = workflow.totalUnits;

  updated.stages = workflow.stages.map(stage => {
    const processed = Math.min(unitsRemaining, stage.config.maxCapacity);
    const defects = Math.floor(processed * stage.config.defectRate);
    const goodUnits = processed - defects;
    const timePerUnit = (10 / stage.config.speedMultiplier) / stage.config.machineCount;
    const totalCost = processed * stage.config.costPerUnit;
    const utilization = Math.min(100, Math.round((processed / stage.config.maxCapacity) * 100));

    unitsRemaining = goodUnits;

    return {
      ...stage,
      status: 'completed' as StageStatus,
      metrics: {
        unitsProcessed: processed,
        unitsQueued: 0,
        defectsFound: defects,
        totalCost: Math.round(totalCost),
        avgTimePerUnit: Math.round(timePerUnit * 10) / 10,
        utilization,
      },
    };
  });

  updated.completedUnits = unitsRemaining;
  return updated;
}

// Agent-based workflow optimization
export function optimizeWorkflow(workflow: Workflow): WorkflowOptimization[] {
  const optimizations: WorkflowOptimization[] = [
    generateCostOptimization(workflow),
    generateSpeedOptimization(workflow),
    generateBalancedOptimization(workflow),
    generateLLMOptimization(workflow),
  ];

  return optimizations.sort((a, b) => b.score - a.score);
}

function generateCostOptimization(workflow: Workflow): WorkflowOptimization {
  const suggestions: StageSuggestion[] = workflow.stages
    .filter(s => s.config.costPerUnit > 10)
    .map(s => ({
      stageId: s.id,
      field: 'costPerUnit' as keyof StageConfig,
      currentValue: s.config.costPerUnit,
      suggestedValue: Math.round(s.config.costPerUnit * 0.75),
      reason: `Reduce cost by switching to economy-grade materials`,
    }));

  const totalCostReduction = suggestions.reduce((sum, s) => sum + (s.currentValue - s.suggestedValue) * workflow.totalUnits, 0);

  return {
    agentType: 'cost',
    agentName: 'Cost Optimizer',
    suggestions,
    projectedCost: calcTotalCost(workflow) - totalCostReduction,
    projectedTime: calcTotalTime(workflow) * 1.1,
    score: Math.round(40 + Math.random() * 30),
  };
}

function generateSpeedOptimization(workflow: Workflow): WorkflowOptimization {
  const suggestions: StageSuggestion[] = workflow.stages
    .filter(s => s.config.speedMultiplier < 1.3)
    .map(s => ({
      stageId: s.id,
      field: 'speedMultiplier' as keyof StageConfig,
      currentValue: s.config.speedMultiplier,
      suggestedValue: Math.round(s.config.speedMultiplier * 1.5 * 10) / 10,
      reason: `Increase throughput with parallel processing`,
    }));

  return {
    agentType: 'speed',
    agentName: 'Speed Maximizer',
    suggestions,
    projectedCost: calcTotalCost(workflow) * 1.2,
    projectedTime: calcTotalTime(workflow) * 0.6,
    score: Math.round(35 + Math.random() * 35),
  };
}

function generateBalancedOptimization(workflow: Workflow): WorkflowOptimization {
  const suggestions: StageSuggestion[] = workflow.stages.map(s => ({
    stageId: s.id,
    field: 'batchSize' as keyof StageConfig,
    currentValue: s.config.batchSize,
    suggestedValue: Math.round(s.config.batchSize * 1.2),
    reason: `Optimize batch size for throughput/cost balance`,
  }));

  return {
    agentType: 'balanced',
    agentName: 'Balanced Agent',
    suggestions,
    projectedCost: calcTotalCost(workflow) * 0.9,
    projectedTime: calcTotalTime(workflow) * 0.85,
    score: Math.round(40 + Math.random() * 30),
  };
}

function generateLLMOptimization(workflow: Workflow): WorkflowOptimization {
  const bottleneck = [...workflow.stages].sort((a, b) => a.config.speedMultiplier - b.config.speedMultiplier)[0];
  const expensive = [...workflow.stages].sort((a, b) => b.config.costPerUnit - a.config.costPerUnit)[0];

  const suggestions: StageSuggestion[] = [
    {
      stageId: bottleneck.id,
      field: 'machineCount',
      currentValue: bottleneck.config.machineCount,
      suggestedValue: bottleneck.config.machineCount + 2,
      reason: `Identified as pipeline bottleneck — add capacity to unblock downstream stages`,
    },
    {
      stageId: expensive.id,
      field: 'costPerUnit',
      currentValue: expensive.config.costPerUnit,
      suggestedValue: Math.round(expensive.config.costPerUnit * 0.8),
      reason: `Highest cost stage — negotiate supplier contracts or switch to alternative process`,
    },
    {
      stageId: bottleneck.id,
      field: 'defectRate',
      currentValue: bottleneck.config.defectRate,
      suggestedValue: Math.round(bottleneck.config.defectRate * 0.5 * 100) / 100,
      reason: `Implement predictive maintenance to reduce defect rate at bottleneck`,
    },
  ];

  return {
    agentType: 'llm',
    agentName: 'LLM Strategist',
    suggestions,
    projectedCost: calcTotalCost(workflow) * 0.82,
    projectedTime: calcTotalTime(workflow) * 0.7,
    score: Math.round(50 + Math.random() * 30),
  };
}

function calcTotalCost(workflow: Workflow): number {
  return workflow.stages.reduce((sum, s) => sum + s.config.costPerUnit * workflow.totalUnits, 0);
}

function calcTotalTime(workflow: Workflow): number {
  return workflow.stages.reduce((sum, s) => sum + (10 / s.config.speedMultiplier) / s.config.machineCount, 0) * workflow.totalUnits;
}
