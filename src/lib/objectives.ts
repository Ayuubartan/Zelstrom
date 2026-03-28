// Objectives & Factory Settings types

export interface KPITarget {
  id: string;
  label: string;
  metric: "cost" | "throughput" | "defectRate" | "time" | "score";
  operator: "<" | ">" | "=" | "<=" | ">=";
  value: number;
  unit: string;
}

export interface PriorityWeights {
  cost: number;      // 0-100
  speed: number;     // 0-100
  quality: number;   // 0-100
}

export interface ScenarioConstraints {
  maxBudget: number;
  minOutput: number;
  maxTime: number;      // minutes
  maxDefectRate: number; // percentage
}

export interface FactorySettings {
  machineTypes: MachineTypeConfig[];
  productionParams: ProductionParams;
  environment: EnvironmentConditions;
}

export interface MachineTypeConfig {
  id: string;
  name: string;
  type: "cnc" | "welding" | "laser" | "plc" | "press" | "robot";
  count: number;
  enabled: boolean;
}

export interface ProductionParams {
  speedMultiplier: number;    // 0.5 - 2.0
  costPerUnit: number;        // $
  defectRate: number;         // 0-10%
  batchSize: number;          // 1-100
}

export interface EnvironmentConditions {
  temperatureRange: [number, number]; // °C
  pressureLimit: number;              // bar
  energyCostPerKwh: number;           // $
  shiftsPerDay: number;               // 1-3
}

export interface Objectives {
  kpiTargets: KPITarget[];
  weights: PriorityWeights;
  constraints: ScenarioConstraints;
}

export const DEFAULT_OBJECTIVES: Objectives = {
  kpiTargets: [
    { id: "kpi-1", label: "Cost under $500", metric: "cost", operator: "<", value: 500, unit: "$" },
    { id: "kpi-2", label: "Throughput above 3", metric: "throughput", operator: ">", value: 3, unit: "j/m" },
  ],
  weights: { cost: 40, speed: 35, quality: 25 },
  constraints: {
    maxBudget: 1000,
    minOutput: 50,
    maxTime: 120,
    maxDefectRate: 5,
  },
};

export const DEFAULT_FACTORY_SETTINGS: FactorySettings = {
  machineTypes: [
    { id: "mt-1", name: "CNC Machine", type: "cnc", count: 2, enabled: true },
    { id: "mt-2", name: "Welding Station", type: "welding", count: 1, enabled: true },
    { id: "mt-3", name: "Laser Cutter", type: "laser", count: 1, enabled: true },
    { id: "mt-4", name: "PLC Controller", type: "plc", count: 1, enabled: true },
    { id: "mt-5", name: "Hydraulic Press", type: "press", count: 1, enabled: false },
    { id: "mt-6", name: "Robot Arm", type: "robot", count: 0, enabled: false },
  ],
  productionParams: {
    speedMultiplier: 1.0,
    costPerUnit: 12,
    defectRate: 2,
    batchSize: 10,
  },
  environment: {
    temperatureRange: [18, 35],
    pressureLimit: 10,
    energyCostPerKwh: 0.12,
    shiftsPerDay: 2,
  },
};

// Generate team markdown report
export function generateTeamMarkdown(
  teamName: string,
  philosophy: string,
  reasoning: string[],
  roles: { label: string; focus: string; suggestion: string }[],
  result: { score: number; totalCost: number; totalTime: number; throughput: number },
  notes: string,
  roundHistory: { round: number; score: number; rank: number }[]
): string {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  let md = `# ${teamName} — Strategy Report\n\n`;
  md += `> ${philosophy}\n\n`;
  md += `**Generated:** ${now}\n\n`;
  md += `---\n\n`;

  md += `## Performance Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Score | ${result.score}/100 |\n`;
  md += `| Cost | $${result.totalCost} |\n`;
  md += `| Time | ${result.totalTime}m |\n`;
  md += `| Throughput | ${result.throughput} j/m |\n\n`;

  if (roundHistory.length > 0) {
    md += `## Tournament History\n\n`;
    md += `| Round | Score | Rank |\n|-------|-------|------|\n`;
    roundHistory.forEach(r => {
      md += `| ${r.round} | ${r.score}/100 | #${r.rank} |\n`;
    });
    md += `\n`;
  }

  md += `## Team Roles\n\n`;
  roles.forEach(r => {
    md += `### ${r.label}\n`;
    md += `- **Focus:** ${r.focus}\n`;
    md += `- **Contribution:** ${r.suggestion}\n\n`;
  });

  md += `## AI Reasoning Log\n\n`;
  reasoning.forEach((r, i) => {
    md += `${i + 1}. ${r}\n`;
  });

  if (notes.trim()) {
    md += `\n## Notes\n\n${notes}\n`;
  }

  return md;
}
