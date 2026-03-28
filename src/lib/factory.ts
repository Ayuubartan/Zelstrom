// Factory Simulation Engine

export interface Job {
  id: string;
  name: string;
  processingTime: number; // in minutes
  cost: number;
  priority: number; // 1-5
}

export interface Machine {
  id: string;
  name: string;
  capacity: number; // jobs per cycle
  speedMultiplier: number; // 1.0 = normal
  costPerMinute: number;
  available: boolean;
}

export interface Assignment {
  jobId: string;
  machineId: string;
}

export interface SimulationResult {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  assignments: Assignment[];
  totalCost: number;
  totalTime: number;
  throughput: number;
  score: number;
  color: string;
}

export type AgentType = 'cost' | 'speed' | 'balanced' | 'llm';

export interface FactoryScenario {
  jobs: Job[];
  machines: Machine[];
  maxTime: number;
  maxBudget: number;
}

// Generate a random factory scenario
export function generateScenario(jobCount = 8, machineCount = 4): FactoryScenario {
  const jobNames = ['Assembly', 'Welding', 'Painting', 'Testing', 'Packaging', 'Cutting', 'Molding', 'Drilling', 'Polishing', 'Stamping', 'Forging', 'Casting'];
  const machineNames = ['CNC-Alpha', 'RoboArm-X1', 'LaserCut-V2', 'HydroPress-M3', 'ArcWelder-K9', 'PrintBot-Z4'];

  const jobs: Job[] = Array.from({ length: jobCount }, (_, i) => ({
    id: `job-${i}`,
    name: `${jobNames[i % jobNames.length]}-${Math.floor(i / jobNames.length) + 1}`,
    processingTime: Math.floor(Math.random() * 20) + 5,
    cost: Math.floor(Math.random() * 50) + 10,
    priority: Math.floor(Math.random() * 5) + 1,
  }));

  const machines: Machine[] = Array.from({ length: machineCount }, (_, i) => ({
    id: `machine-${i}`,
    name: machineNames[i % machineNames.length],
    capacity: Math.floor(Math.random() * 3) + 1,
    speedMultiplier: 0.5 + Math.random() * 1.5,
    costPerMinute: Math.floor(Math.random() * 5) + 1,
    available: true,
  }));

  return {
    jobs,
    machines,
    maxTime: 120,
    maxBudget: 500,
  };
}

// Calculate results for a set of assignments
function evaluate(scenario: FactoryScenario, assignments: Assignment[]): { totalCost: number; totalTime: number; throughput: number } {
  const machineLoads: Record<string, number> = {};

  let totalCost = 0;

  for (const a of assignments) {
    const job = scenario.jobs.find(j => j.id === a.jobId);
    const machine = scenario.machines.find(m => m.id === a.machineId);
    if (!job || !machine) continue;

    const time = job.processingTime / machine.speedMultiplier;
    const cost = job.cost + time * machine.costPerMinute;
    totalCost += cost;
    machineLoads[a.machineId] = (machineLoads[a.machineId] || 0) + time;
  }

  const totalTime = Math.max(...Object.values(machineLoads), 0);
  const throughput = assignments.length / Math.max(totalTime, 1);

  return { totalCost: Math.round(totalCost), totalTime: Math.round(totalTime), throughput: Math.round(throughput * 100) / 100 };
}

// Score function: lower is better for cost/time, higher for throughput
function computeScore(totalCost: number, totalTime: number, throughput: number, maxBudget: number, maxTime: number): number {
  const costScore = Math.max(0, 1 - totalCost / maxBudget) * 40;
  const timeScore = Math.max(0, 1 - totalTime / maxTime) * 35;
  const throughputScore = Math.min(throughput * 10, 25);
  return Math.round(costScore + timeScore + throughputScore);
}

// Agent strategies
function costAgent(scenario: FactoryScenario): Assignment[] {
  const sorted = [...scenario.machines].sort((a, b) => a.costPerMinute - b.costPerMinute);
  return scenario.jobs.map((job, i) => ({
    jobId: job.id,
    machineId: sorted[i % sorted.length].id,
  }));
}

function speedAgent(scenario: FactoryScenario): Assignment[] {
  const sorted = [...scenario.machines].sort((a, b) => b.speedMultiplier - a.speedMultiplier);
  return scenario.jobs.map((job, i) => ({
    jobId: job.id,
    machineId: sorted[i % sorted.length].id,
  }));
}

function balancedAgent(scenario: FactoryScenario): Assignment[] {
  const scored = scenario.machines.map(m => ({
    ...m,
    score: m.speedMultiplier / m.costPerMinute,
  })).sort((a, b) => b.score - a.score);

  return scenario.jobs.map((job, i) => ({
    jobId: job.id,
    machineId: scored[i % scored.length].id,
  }));
}

function llmAgent(scenario: FactoryScenario): Assignment[] {
  // Simulated "smart" agent - uses priority-weighted assignment
  const prioritySorted = [...scenario.jobs].sort((a, b) => b.priority - a.priority);
  const machineScores = scenario.machines.map(m => ({
    ...m,
    efficiency: (m.speedMultiplier * m.capacity) / m.costPerMinute,
  })).sort((a, b) => b.efficiency - a.efficiency);

  return prioritySorted.map((job, i) => ({
    jobId: job.id,
    machineId: machineScores[i % machineScores.length].id,
  }));
}

const AGENT_COLORS: Record<AgentType, string> = {
  cost: 'hsl(150, 70%, 45%)',
  speed: 'hsl(38, 90%, 55%)',
  balanced: 'hsl(280, 70%, 60%)',
  llm: 'hsl(185, 80%, 50%)',
};

const AGENT_NAMES: Record<AgentType, string> = {
  cost: 'Cost Optimizer',
  speed: 'Speed Maximizer',
  balanced: 'Balanced Agent',
  llm: 'LLM Strategist',
};

export function runCompetition(scenario: FactoryScenario): SimulationResult[] {
  const agents: { type: AgentType; fn: (s: FactoryScenario) => Assignment[] }[] = [
    { type: 'cost', fn: costAgent },
    { type: 'speed', fn: speedAgent },
    { type: 'balanced', fn: balancedAgent },
    { type: 'llm', fn: llmAgent },
  ];

  return agents.map(agent => {
    const assignments = agent.fn(scenario);
    const { totalCost, totalTime, throughput } = evaluate(scenario, assignments);
    const score = computeScore(totalCost, totalTime, throughput, scenario.maxBudget, scenario.maxTime);

    return {
      agentId: agent.type,
      agentName: AGENT_NAMES[agent.type],
      agentType: agent.type,
      assignments,
      totalCost,
      totalTime,
      throughput,
      score,
      color: AGENT_COLORS[agent.type],
    };
  }).sort((a, b) => b.score - a.score);
}
