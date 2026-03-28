// Software-Defined Micro-Factory (SDMF) Engine
// Adversarial Multi-Agent System with Evolution Timeline + Pipeline Feedback Integration

import { getPipelineHistory, type PipelineRunResult, type PipelineStageResult } from "@/lib/feedback-bridge";
import { calculateBayesianFitness, getGeneticSurvivors, getAgentFitnessModifier } from "@/lib/evolution-engine";
import { getDeployHistory } from "@/lib/deploy-bridge";
import { getPendingProposals, clearPendingProposals, type ExternalAgentProposal } from "@/lib/external-agent-bridge";

export interface SensorReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: number;
}

export interface FactoryStation {
  id: string;
  name: string;
  type: 'cnc' | 'welding' | 'painting' | 'assembly' | 'qc' | 'packaging' | '3dprint' | 'laser';
  status: 'online' | 'offline' | 'running' | 'maintenance' | 'reconfiguring';
  utilization: number;
  temperature: number;
  throughput: number;
  defectRate: number;
  uptime: number; // percentage
  sensors: SensorReading[];
}

export interface ProcessConfig {
  stationId: string;
  speed: number;       // 0.1 - 3.0 multiplier
  pressure: number;    // 0-100 PSI
  temperature: number; // celsius
  batchSize: number;
  qualityThreshold: number; // 0-1
  routingPriority: number;  // 1-10
}

export interface AgentProposal {
  id: string;
  agentType: 'optimizer' | 'stress-tester' | 'external';
  agentName: string;
  configs: ProcessConfig[];
  projectedThroughput: number;
  projectedCost: number;
  projectedDefectRate: number;
  projectedUptime: number;
  score: number;
  reasoning: string;
  attacks?: StressAttack[];
  survived: boolean;
  generation: number;
}

export interface StressAttack {
  type: 'bottleneck' | 'failure' | 'demand-spike' | 'supply-shortage' | 'thermal-overload' | 'quality-drift';
  targetStation: string;
  severity: number; // 1-10
  description: string;
  impactScore: number; // how much it degraded the proposal
}

export interface EvolutionGeneration {
  id: number;
  timestamp: number;
  proposals: AgentProposal[];
  attacks: StressAttack[];
  survivor: AgentProposal | null;
  retired: AgentProposal[];
  fitnessScore: number;
  improvement: number; // % over previous gen
}

export interface ABTest {
  id: string;
  name: string;
  variantA: AgentProposal;
  variantB: AgentProposal;
  status: 'running' | 'completed' | 'cancelled';
  winner: 'A' | 'B' | null;
  metricsA: { throughput: number; cost: number; defects: number; };
  metricsB: { throughput: number; cost: number; defects: number; };
  startTime: number;
  duration: number;
}

export interface LogicOverlay {
  id: string;
  name: string;
  description: string;
  productType: string;
  stationConfigs: ProcessConfig[];
  active: boolean;
}

export interface SDMFState {
  stations: FactoryStation[];
  generations: EvolutionGeneration[];
  currentGeneration: number;
  activeOverlay: LogicOverlay | null;
  abTests: ABTest[];
  overallScore: number;
  totalUnitsProduced: number;
  selfHealingEvents: number;
}

// --- Factory station generator ---
const STATION_TEMPLATES: Omit<FactoryStation, 'sensors'>[] = [
  { id: 'stn-cnc', name: 'CNC Machining Cell', type: 'cnc', status: 'online', utilization: 0, temperature: 42, throughput: 0, defectRate: 0.02, uptime: 98.5 },
  { id: 'stn-3dp', name: '3D Print Bay', type: '3dprint', status: 'online', utilization: 0, temperature: 210, throughput: 0, defectRate: 0.01, uptime: 96.2 },
  { id: 'stn-laser', name: 'Laser Cutting', type: 'laser', status: 'online', utilization: 0, temperature: 38, throughput: 0, defectRate: 0.015, uptime: 99.1 },
  { id: 'stn-weld', name: 'Robotic Welding', type: 'welding', status: 'online', utilization: 0, temperature: 85, throughput: 0, defectRate: 0.04, uptime: 97.3 },
  { id: 'stn-paint', name: 'Paint & Coating', type: 'painting', status: 'online', utilization: 0, temperature: 24, throughput: 0, defectRate: 0.03, uptime: 95.8 },
  { id: 'stn-asm', name: 'Assembly Line', type: 'assembly', status: 'online', utilization: 0, temperature: 22, throughput: 0, defectRate: 0.035, uptime: 98.0 },
  { id: 'stn-qc', name: 'Quality Control', type: 'qc', status: 'online', utilization: 0, temperature: 21, throughput: 0, defectRate: 0.005, uptime: 99.5 },
  { id: 'stn-pkg', name: 'Packaging & Ship', type: 'packaging', status: 'online', utilization: 0, temperature: 20, throughput: 0, defectRate: 0.01, uptime: 99.0 },
];

function generateSensors(station: Omit<FactoryStation, 'sensors'>): SensorReading[] {
  const base: SensorReading[] = [
    { id: `${station.id}-temp`, name: 'Temperature', value: station.temperature + (Math.random() * 4 - 2), unit: '°C', status: 'normal', timestamp: Date.now() },
    { id: `${station.id}-vib`, name: 'Vibration', value: Math.random() * 3 + 0.5, unit: 'mm/s', status: 'normal', timestamp: Date.now() },
    { id: `${station.id}-pwr`, name: 'Power Draw', value: Math.random() * 15 + 5, unit: 'kW', status: 'normal', timestamp: Date.now() },
    { id: `${station.id}-psi`, name: 'Pressure', value: Math.random() * 40 + 30, unit: 'PSI', status: 'normal', timestamp: Date.now() },
  ];
  // Randomly flag warnings
  return base.map(s => ({
    ...s,
    status: Math.random() > 0.9 ? 'warning' : Math.random() > 0.98 ? 'critical' : 'normal' as SensorReading['status'],
  }));
}

export function initializeFactory(): SDMFState {
  const stations: FactoryStation[] = STATION_TEMPLATES.map(st => ({
    ...st,
    utilization: Math.random() * 40 + 30,
    throughput: Math.floor(Math.random() * 50 + 20),
    sensors: generateSensors(st),
  }));

  return {
    stations,
    generations: [],
    currentGeneration: 0,
    activeOverlay: null,
    abTests: [],
    overallScore: 50,
    totalUnitsProduced: 0,
    selfHealingEvents: 0,
  };
}

// --- Adversarial Agent Engine with Genetic Inheritance ---

function randomConfig(stationId: string): ProcessConfig {
  // Tightened ranges: reduced variance so inherited configs aren't drowned by noise
  return {
    stationId,
    speed: Math.round((0.8 + Math.random() * 1.2) * 10) / 10,     // was 0.5-2.5, now 0.8-2.0
    pressure: Math.floor(Math.random() * 35 + 25),                  // was 20-80, now 25-60
    temperature: Math.floor(Math.random() * 60 + 30),               // was 20-120, now 30-90
    batchSize: Math.floor(Math.random() * 40 + 20),                 // was 10-90, now 20-60
    qualityThreshold: Math.round((0.8 + Math.random() * 0.15) * 100) / 100, // was 0.7-0.95, now 0.8-0.95
    routingPriority: Math.floor(Math.random() * 6) + 3,             // was 1-10, now 3-8
  };
}

// --- Genetic Operators ---

const MUTATION_RATE = 0.3; // probability of mutating each parameter
const MUTATION_STRENGTH = 0.15; // max % change per mutation

/** Mutate a config by applying small random perturbations to each parameter */
function mutateConfig(parent: ProcessConfig): ProcessConfig {
  const mutate = (val: number, min: number, max: number): number => {
    if (Math.random() > MUTATION_RATE) return val;
    const delta = val * MUTATION_STRENGTH * (Math.random() * 2 - 1);
    return Math.round(Math.min(max, Math.max(min, val + delta)) * 100) / 100;
  };
  return {
    stationId: parent.stationId,
    speed: Math.round(mutate(parent.speed, 0.3, 3.0) * 10) / 10,
    pressure: Math.floor(mutate(parent.pressure, 10, 80)),
    temperature: Math.floor(mutate(parent.temperature, 15, 120)),
    batchSize: Math.floor(mutate(parent.batchSize, 5, 90)),
    qualityThreshold: Math.round(mutate(parent.qualityThreshold, 0.7, 0.99) * 100) / 100,
    routingPriority: Math.max(1, Math.min(10, Math.floor(mutate(parent.routingPriority, 1, 10)))),
  };
}

/** Crossover two parent configs — pick each parameter from either parent */
function crossoverConfigs(parentA: ProcessConfig, parentB: ProcessConfig): ProcessConfig {
  const pick = <T>(a: T, b: T): T => Math.random() < 0.5 ? a : b;
  return {
    stationId: parentA.stationId,
    speed: pick(parentA.speed, parentB.speed),
    pressure: pick(parentA.pressure, parentB.pressure),
    temperature: pick(parentA.temperature, parentB.temperature),
    batchSize: pick(parentA.batchSize, parentB.batchSize),
    qualityThreshold: pick(parentA.qualityThreshold, parentB.qualityThreshold),
    routingPriority: pick(parentA.routingPriority, parentB.routingPriority),
  };
}

/** Get the top N survivors' configs from previous generations */
function getAncestorConfigs(state: SDMFState, count: number): ProcessConfig[][] {
  const ancestors: ProcessConfig[][] = [];
  for (let i = state.generations.length - 1; i >= 0 && ancestors.length < count; i--) {
    const gen = state.generations[i];
    if (gen.survivor) {
      ancestors.push(gen.survivor.configs);
    }
  }
  return ancestors;
}

function evaluateProposal(configs: ProcessConfig[], stations: FactoryStation[]): { throughput: number; cost: number; defectRate: number; uptime: number; score: number } {
  let throughput = 0, cost = 0, defects = 0, uptimeSum = 0;

  configs.forEach(cfg => {
    const station = stations.find(s => s.id === cfg.stationId);
    if (!station) return;
    const t = cfg.speed * cfg.batchSize * (cfg.qualityThreshold > 0.9 ? 0.85 : 1);
    const c = cfg.speed * cfg.pressure * 0.1 + cfg.batchSize * 0.5;
    const d = station.defectRate * (1 - cfg.qualityThreshold) * (cfg.speed > 1.5 ? 1.5 : 1);
    throughput += t;
    cost += c;
    defects += d;
    uptimeSum += station.uptime - (cfg.speed > 2 ? 3 : 0);
  });

  const avgUptime = uptimeSum / Math.max(configs.length, 1);
  const score = Math.round(
    (throughput / 10) * 0.35 +
    Math.max(0, 100 - cost / 5) * 0.25 +
    Math.max(0, (1 - defects) * 100) * 0.2 +
    avgUptime * 0.2
  );

  return {
    throughput: Math.round(throughput),
    cost: Math.round(cost),
    defectRate: Math.round(defects * 1000) / 1000,
    uptime: Math.round(avgUptime * 10) / 10,
    score: Math.min(100, Math.max(0, score)),
  };
}

const ATTACK_TYPES: StressAttack['type'][] = ['bottleneck', 'failure', 'demand-spike', 'supply-shortage', 'thermal-overload', 'quality-drift'];
const ATTACK_DESCRIPTIONS: Record<StressAttack['type'], string[]> = {
  'bottleneck': ['Simulated queue overflow at station', 'Upstream delay causing backpressure', 'Material buffer saturation'],
  'failure': ['Simulated actuator failure', 'Power supply interruption', 'Motor bearing seizure'],
  'demand-spike': ['300% demand surge simulated', 'Rush order injection', 'Parallel batch requirement'],
  'supply-shortage': ['Raw material depletion', 'Supplier delivery delay', 'Quality reject of incoming batch'],
  'thermal-overload': ['Coolant system failure', 'Ambient temperature spike', 'Heat dissipation blockage'],
  'quality-drift': ['Calibration drift detected', 'Tool wear acceleration', 'Surface finish degradation'],
};

function generateAttacks(stations: FactoryStation[], count: number): StressAttack[] {
  return Array.from({ length: count }, () => {
    const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const target = stations[Math.floor(Math.random() * stations.length)];
    const descs = ATTACK_DESCRIPTIONS[type];
    return {
      type,
      targetStation: target.id,
      severity: Math.floor(Math.random() * 7) + 3,
      description: `${descs[Math.floor(Math.random() * descs.length)]} → ${target.name}`,
      impactScore: Math.floor(Math.random() * 20) + 5,
    };
  });
}

/**
 * Analyze a proposal's configs to find vulnerabilities, then generate
 * targeted attacks that exploit those weaknesses. This makes stress tests
 * meaningful: a high-speed config attracts thermal attacks, low-quality
 * configs attract defect cascades, etc.
 */
function analyzeVulnerabilities(configs: ProcessConfig[]): { type: StressAttack['type']; weight: number; reason: string }[] {
  const vulns: { type: StressAttack['type']; weight: number; reason: string }[] = [];

  const avgSpeed = configs.reduce((s, c) => s + c.speed, 0) / configs.length;
  const avgQuality = configs.reduce((s, c) => s + c.qualityThreshold, 0) / configs.length;
  const avgPressure = configs.reduce((s, c) => s + c.pressure, 0) / configs.length;
  const avgBatch = configs.reduce((s, c) => s + c.batchSize, 0) / configs.length;
  const maxSpeed = Math.max(...configs.map(c => c.speed));

  // High speed → thermal overload vulnerability
  if (avgSpeed > 1.8) vulns.push({ type: 'thermal-overload', weight: avgSpeed / 1.5, reason: `high avg speed ${avgSpeed.toFixed(1)}` });
  if (maxSpeed > 2.5) vulns.push({ type: 'failure', weight: 1.5, reason: `extreme speed ${maxSpeed.toFixed(1)} risks mechanical failure` });

  // Low quality threshold → quality drift vulnerability
  if (avgQuality < 0.85) vulns.push({ type: 'quality-drift', weight: (0.9 - avgQuality) * 8, reason: `low quality threshold ${avgQuality.toFixed(2)}` });

  // High pressure → supply shortage (resource intensive)
  if (avgPressure > 55) vulns.push({ type: 'supply-shortage', weight: avgPressure / 40, reason: `high pressure ${avgPressure.toFixed(0)} PSI` });

  // Large batch sizes → bottleneck vulnerability
  if (avgBatch > 60) vulns.push({ type: 'bottleneck', weight: avgBatch / 40, reason: `large batches ${avgBatch.toFixed(0)} units` });

  // High throughput configs → demand spike vulnerability (can't absorb surges)
  if (avgSpeed > 1.5 && avgBatch > 40) vulns.push({ type: 'demand-spike', weight: 1.2, reason: 'already near capacity' });

  return vulns;
}

/**
 * Generate agent-specific attacks: base random attacks + targeted attacks
 * that exploit the proposal's specific config vulnerabilities.
 */
function generateTargetedAttacks(
  stations: FactoryStation[],
  configs: ProcessConfig[],
  baseCount: number
): StressAttack[] {
  // 1. Base random attacks (shared environmental hazards — fewer now)
  const baseAttacks = generateAttacks(stations, Math.max(2, Math.floor(baseCount * 0.4)));

  // 2. Targeted attacks based on config vulnerabilities
  const vulns = analyzeVulnerabilities(configs);
  const targetedAttacks: StressAttack[] = vulns.map(vuln => {
    // Find the most vulnerable station for this attack type
    const stationVulns = configs.map(cfg => {
      const station = stations.find(s => s.id === cfg.stationId);
      if (!station) return { station: stations[0], score: 0 };
      let score = 0;
      if (vuln.type === 'thermal-overload') score = cfg.speed * cfg.temperature / 100;
      if (vuln.type === 'quality-drift') score = (1 - cfg.qualityThreshold) * cfg.speed;
      if (vuln.type === 'bottleneck') score = cfg.batchSize / cfg.speed;
      if (vuln.type === 'supply-shortage') score = cfg.pressure * cfg.batchSize / 100;
      if (vuln.type === 'failure') score = cfg.speed * (cfg.pressure / 50);
      if (vuln.type === 'demand-spike') score = cfg.speed * cfg.batchSize / 50;
      return { station, score };
    }).sort((a, b) => b.score - a.score);

    const target = stationVulns[0]?.station || stations[0];
    const descs = ATTACK_DESCRIPTIONS[vuln.type];
    // Severity scales with vulnerability weight (more exposed = harder hit)
    const severity = Math.min(10, Math.floor(vuln.weight * 3 + Math.random() * 3 + 2));

    return {
      type: vuln.type,
      targetStation: target.id,
      severity,
      description: `${descs[Math.floor(Math.random() * descs.length)]} → ${target.name} [targeted: ${vuln.reason}]`,
      impactScore: Math.floor(vuln.weight * 8 + Math.random() * 10 + 3),
    };
  });

  return [...baseAttacks, ...targetedAttacks];
}

/** Apply attacks with vulnerability-aware penalty scaling */
function applyAttacks(score: number, attacks: StressAttack[], configs?: ProcessConfig[]): number {
  let penalty = 0;
  attacks.forEach(a => {
    let multiplier = 1.0;
    if (configs) {
      // Agents with configs that match the attack type take MORE damage
      const targetCfg = configs.find(c => c.stationId === a.targetStation);
      if (targetCfg) {
        if (a.type === 'thermal-overload' && targetCfg.speed > 2.0) multiplier = 1.4;
        if (a.type === 'quality-drift' && targetCfg.qualityThreshold < 0.85) multiplier = 1.5;
        if (a.type === 'bottleneck' && targetCfg.batchSize > 60) multiplier = 1.3;
        if (a.type === 'supply-shortage' && targetCfg.pressure > 55) multiplier = 1.3;
        if (a.type === 'failure' && targetCfg.speed > 2.5) multiplier = 1.6;
        // Conversely, well-configured agents resist better
        if (a.type === 'thermal-overload' && targetCfg.speed < 1.0) multiplier = 0.6;
        if (a.type === 'quality-drift' && targetCfg.qualityThreshold > 0.95) multiplier = 0.5;
        if (a.type === 'bottleneck' && targetCfg.batchSize < 30) multiplier = 0.6;
      }
    }
    penalty += a.impactScore * (a.severity / 10) * multiplier;
  });
  return Math.max(0, Math.round(score - penalty));
}

const OPTIMIZER_STRATEGIES = [
  { name: 'Throughput Maximizer', bias: 'speed' },
  { name: 'Cost Minimizer', bias: 'cost' },
  { name: 'Quality Guardian', bias: 'quality' },
  { name: 'Balance Architect', bias: 'balanced' },
  { name: 'Adaptive Neural', bias: 'adaptive' },
];

const OPTIMIZER_REASONING: Record<string, string[]> = {
  speed: ['Maximizing parallel throughput across all stations', 'Reducing idle time by increasing batch overlap', 'Pushing speed multipliers to theoretical limits'],
  cost: ['Minimizing energy consumption per unit', 'Optimizing batch sizes for lowest marginal cost', 'Reducing pressure to extend tool life'],
  quality: ['Setting quality thresholds above 95% across all stages', 'Reducing speed at critical stations to minimize defects', 'Adding redundant QC checkpoints'],
  balanced: ['Equalizing utilization across stations to prevent bottlenecks', 'Balancing cost-quality tradeoffs at Pareto frontier', 'Distributing routing priority evenly'],
  adaptive: ['Learning from previous generation failures', 'Adjusting parameters based on stress-test vulnerabilities', 'Evolving toward attack-resistant configurations'],
};

// --- Pipeline Feedback Integration (Bayesian Evolution) ---

// Nudge configs based on real-world stage performance data (strengthened)
function applyFeedbackBias(cfg: ProcessConfig, history: PipelineRunResult[], _bias: string): void {
  if (history.length === 0) return;

  // Use weighted average of recent results (more recent = more weight)
  const recent = history.slice(-3);
  const STATION_STAGE_MAP: Record<string, string> = {
    'stn-cnc': 'CNC Machining', 'stn-weld': 'Welding', 'stn-paint': 'Painting',
    'stn-asm': 'Assembly', 'stn-qc': 'Quality Control', 'stn-pkg': 'Packaging',
  };
  const stageName = STATION_STAGE_MAP[cfg.stationId];

  const stageResults = recent
    .map(r => r.stages.find(s => s.name === stageName))
    .filter(Boolean) as PipelineStageResult[];
  if (stageResults.length === 0) return;

  const avgUtil = stageResults.reduce((s, r) => s + r.metrics.utilization, 0) / stageResults.length;
  const avgDefects = stageResults.reduce((s, r) => s + r.metrics.defectsFound, 0) / stageResults.length;
  const avgCost = stageResults.reduce((s, r) => s + r.metrics.totalCost, 0) / stageResults.length;

  // Utilization too low → increase batch size and speed more aggressively
  if (avgUtil < 50) {
    cfg.batchSize = Math.min(85, cfg.batchSize + Math.floor((50 - avgUtil) * 0.4 + 5));
    cfg.speed = Math.min(3.0, cfg.speed * 1.1);
  }

  // Too many defects → tighten quality and reduce speed
  if (avgDefects > 2) {
    const severity = Math.min(0.1, avgDefects * 0.015);
    cfg.qualityThreshold = Math.min(0.99, cfg.qualityThreshold + severity);
    cfg.speed = Math.max(0.3, cfg.speed * (1 - severity));
  }

  // High cost → reduce pressure and batch size
  if (avgCost > 800) {
    cfg.pressure = Math.max(15, cfg.pressure * 0.85);
    cfg.batchSize = Math.max(10, cfg.batchSize - Math.floor((avgCost - 800) * 0.02));
  }

  // Utilization high + low defects → push speed (system is performing well)
  if (avgUtil > 75 && avgDefects < 2) {
    cfg.speed = Math.min(3.0, cfg.speed * 1.05);
  }
}

export type StrategyBias = 'minimize-cost' | 'maximize-speed' | 'balanced' | 'adaptive';

const STRATEGY_AGENT_MAP: Record<StrategyBias, string[]> = {
  'minimize-cost': ['Cost Minimizer', 'Balance Architect'],
  'maximize-speed': ['Throughput Maximizer', 'Adaptive Neural'],
  'balanced': ['Balance Architect', 'Quality Guardian'],
  'adaptive': ['Adaptive Neural', 'Throughput Maximizer', 'Cost Minimizer'],
};

const STRATEGY_SCORE_BONUS: Record<StrategyBias, number> = {
  'minimize-cost': 12,
  'maximize-speed': 12,
  'balanced': 5,
  'adaptive': 8,
};

export function runAdversarialGeneration(state: SDMFState, strategyBias: StrategyBias = 'balanced'): EvolutionGeneration {
  const genId = state.currentGeneration + 1;
  const proposals: AgentProposal[] = [];

  // Fetch real-world data for Bayesian fitness biasing
  const feedbackHistory = getPipelineHistory();
  const deployHistory = getDeployHistory();
  const geneticSurvivors = getGeneticSurvivors(); // Top 2 "Alpha" agents

  // Reorder strategies to prioritize favored agents
  const favored = STRATEGY_AGENT_MAP[strategyBias] || [];
  const sortedStrategies = [...OPTIMIZER_STRATEGIES].sort((a, b) => {
    const aFav = favored.indexOf(a.name);
    const bFav = favored.indexOf(b.name);
    if (aFav !== -1 && bFav === -1) return -1;
    if (aFav === -1 && bFav !== -1) return 1;
    if (aFav !== -1 && bFav !== -1) return aFav - bFav;
    return 0;
  });

  // --- Genetic Inheritance: seed from ancestors ---
  const ancestors = getAncestorConfigs(state, 2); // top 2 previous survivors
  const hasAncestors = ancestors.length > 0;

  // Generate optimizer proposals with genetic inheritance
  const numProposals = 3 + Math.floor(Math.random() * 3); // 3-5 proposals
  for (let i = 0; i < numProposals; i++) {
    const strategy = sortedStrategies[i % sortedStrategies.length];

    // Determine config origin: inherited vs random exploration
    let configs: ProcessConfig[];
    let origin: 'mutated' | 'crossover' | 'random';

    if (!hasAncestors || i === numProposals - 1) {
      // Last slot is always random exploration (prevents convergence)
      configs = state.stations.map(st => randomConfig(st.id));
      origin = 'random';
    } else if (ancestors.length >= 2 && i % 3 === 1) {
      // Crossover between top 2 ancestors, then mutate
      const [parentA, parentB] = ancestors;
      configs = state.stations.map(st => {
        const cfgA = parentA.find(c => c.stationId === st.id) || randomConfig(st.id);
        const cfgB = parentB.find(c => c.stationId === st.id) || randomConfig(st.id);
        return mutateConfig(crossoverConfigs(cfgA, cfgB));
      });
      origin = 'crossover';
    } else {
      // Mutate the best ancestor
      const parent = ancestors[0];
      configs = state.stations.map(st => {
        const parentCfg = parent.find(c => c.stationId === st.id) || randomConfig(st.id);
        return mutateConfig(parentCfg);
      });
      origin = 'mutated';
    }

    // Apply strategy bias on top of inherited configs
    configs.forEach(cfg => {
      if (strategy.bias === 'speed') cfg.speed = Math.min(3, cfg.speed * 1.3);
      if (strategy.bias === 'cost') { cfg.speed = Math.max(0.3, cfg.speed * 0.8); cfg.pressure = Math.max(10, cfg.pressure * 0.7); }
      if (strategy.bias === 'quality') cfg.qualityThreshold = Math.min(0.99, cfg.qualityThreshold + 0.05);
    });

    // Apply real-world feedback nudges
    configs.forEach(cfg => applyFeedbackBias(cfg, feedbackHistory, strategy.bias));

    const eval_ = evaluateProposal(configs, state.stations);

    // Bayesian fitness: apply real-world multiplier from deployment history
    const { score: bayesianScore, bonus, deployments } = calculateBayesianFitness(
      strategy.name, eval_.score, deployHistory
    );

    // Genetic dominance: alpha survivors get additional modifier
    const isGeneticSurvivor = geneticSurvivors.includes(strategy.name);
    const dominanceModifier = getAgentFitnessModifier(strategy.name);

    // Strategy bias bonus: favored agents get a score boost
    const isFavored = favored.includes(strategy.name);
    const strategyBonus = isFavored ? STRATEGY_SCORE_BONUS[strategyBias] : 0;
    const finalScore = Math.min(100, Math.max(0, Math.round((bayesianScore + strategyBonus) * dominanceModifier)));

    const reasonings = OPTIMIZER_REASONING[strategy.bias] || OPTIMIZER_REASONING.balanced;
    const tags: string[] = [];
    if (origin !== 'random') tags.push(`${origin} gen-${genId - 1}`);
    if (bonus > 0) tags.push(`+${bonus} battle-tested`);
    if (isGeneticSurvivor) tags.push('α genetic survivor');
    if (dominanceModifier > 1.0) tags.push(`${dominanceModifier.toFixed(1)}x dominance`);
    if (strategyBonus > 0) tags.push(`+${strategyBonus} ${strategyBias} bias`);
    if (origin === 'random') tags.push('🧬 explorer');
    const feedbackNote = tags.length > 0 ? ` [${tags.join(' · ')}]` : '';

    proposals.push({
      id: `prop-${genId}-${i}`,
      agentType: 'optimizer',
      agentName: strategy.name,
      configs,
      projectedThroughput: eval_.throughput,
      projectedCost: eval_.cost,
      projectedDefectRate: eval_.defectRate,
      projectedUptime: eval_.uptime,
      score: finalScore,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)] + feedbackNote,
      survived: true,
      generation: genId,
    });
  }

  // --- Inject external agent proposals ---
  const externalProposals = getPendingProposals();
  if (externalProposals.length > 0) {
    externalProposals.forEach((ext, i) => {
      // Fill in missing configs with random defaults for stations not covered
      const configs = state.stations.map(st => {
        const provided = ext.configs.find(c => c.stationId === st.id);
        const base = randomConfig(st.id);
        return provided ? { ...base, ...provided, stationId: st.id } : base;
      });

      const eval_ = evaluateProposal(configs, state.stations);
      // Use projected metrics from external agent if they seem reasonable, otherwise use evaluated
      const throughput = ext.projectedMetrics.throughput || eval_.throughput;
      const cost = ext.projectedMetrics.cost || eval_.cost;
      const defectRate = ext.projectedMetrics.defectRate || eval_.defectRate;
      const uptime = ext.projectedMetrics.uptime || eval_.uptime;
      const score = Math.min(100, Math.max(0, Math.round(
        (throughput / 10) * 0.35 + Math.max(0, 100 - cost / 5) * 0.25 +
        Math.max(0, (1 - defectRate) * 100) * 0.2 + uptime * 0.2
      )));

      proposals.push({
        id: `prop-${genId}-ext-${i}`,
        agentType: 'external',
        agentName: ext.agentName,
        configs,
        projectedThroughput: throughput,
        projectedCost: cost,
        projectedDefectRate: defectRate,
        projectedUptime: uptime,
        score,
        reasoning: `${ext.reasoning} [external · ${ext.agentName}]`,
        survived: true,
        generation: genId,
      });
    });
    clearPendingProposals();
  }

  // Stress-tester generates agent-specific targeted attacks
  const baseAttackCount = 4 + Math.floor(Math.random() * 4);
  let allAttacks: StressAttack[] = [];

  // Apply targeted attacks per proposal — each agent faces unique stress
  proposals.forEach(p => {
    const agentAttacks = generateTargetedAttacks(state.stations, p.configs, baseAttackCount);
    const postAttackScore = applyAttacks(p.score, agentAttacks, p.configs);
    p.attacks = agentAttacks;
    p.survived = postAttackScore > 30;
    p.score = postAttackScore;
    allAttacks = agentAttacks; // keep last for generation record
  });

  // Sort by score, find survivor and retired
  proposals.sort((a, b) => b.score - a.score);
  const survivor = proposals.find(p => p.survived) || proposals[0];
  const retired = proposals.filter(p => p !== survivor);

  // Previous best score
  const prevBest = state.generations.length > 0
    ? state.generations[state.generations.length - 1].fitnessScore
    : 50;
  const improvement = prevBest > 0 ? Math.round(((survivor.score - prevBest) / prevBest) * 100) : 0;

  return {
    id: genId,
    timestamp: Date.now(),
    proposals,
    attacks: allAttacks,
    survivor,
    retired,
    fitnessScore: survivor.score,
    improvement,
  };
}

export function runABTest(state: SDMFState, genA: EvolutionGeneration, genB: EvolutionGeneration): ABTest {
  const a = genA.survivor!;
  const b = genB.survivor!;

  // Simulate real-world performance with variance
  const variance = () => 0.8 + Math.random() * 0.4;
  const metricsA = {
    throughput: Math.round(a.projectedThroughput * variance()),
    cost: Math.round(a.projectedCost * variance()),
    defects: Math.round(a.projectedDefectRate * 1000 * variance()) / 1000,
  };
  const metricsB = {
    throughput: Math.round(b.projectedThroughput * variance()),
    cost: Math.round(b.projectedCost * variance()),
    defects: Math.round(b.projectedDefectRate * 1000 * variance()) / 1000,
  };

  const scoreA = metricsA.throughput * 0.4 - metricsA.cost * 0.3 - metricsA.defects * 100 * 0.3;
  const scoreB = metricsB.throughput * 0.4 - metricsB.cost * 0.3 - metricsB.defects * 100 * 0.3;

  return {
    id: `ab-${Date.now()}`,
    name: `Gen ${genA.id} vs Gen ${genB.id}`,
    variantA: a,
    variantB: b,
    status: 'completed',
    winner: scoreA > scoreB ? 'A' : 'B',
    metricsA,
    metricsB,
    startTime: Date.now(),
    duration: Math.floor(Math.random() * 300) + 60,
  };
}

export function updateSensors(stations: FactoryStation[]): FactoryStation[] {
  return stations.map(st => ({
    ...st,
    utilization: Math.min(100, Math.max(0, st.utilization + (Math.random() * 10 - 5))),
    throughput: Math.max(0, st.throughput + Math.floor(Math.random() * 6 - 2)),
    temperature: st.temperature + (Math.random() * 2 - 1),
    sensors: generateSensors(st),
    status: Math.random() > 0.95 ? 'maintenance' : Math.random() > 0.92 ? 'reconfiguring' : st.status === 'maintenance' ? 'online' : st.status as FactoryStation['status'],
  }));
}

export const LOGIC_OVERLAYS: LogicOverlay[] = [
  {
    id: 'overlay-electronics',
    name: 'Electronics Production',
    description: 'PCB assembly, SMD placement, and testing',
    productType: 'Electronics',
    stationConfigs: [],
    active: false,
  },
  {
    id: 'overlay-medical',
    name: 'Medical Devices',
    description: 'ISO 13485 compliant precision manufacturing',
    productType: 'Medical',
    stationConfigs: [],
    active: false,
  },
  {
    id: 'overlay-automotive',
    name: 'Automotive Parts',
    description: 'High-volume metal stamping and assembly',
    productType: 'Automotive',
    stationConfigs: [],
    active: false,
  },
  {
    id: 'overlay-aerospace',
    name: 'Aerospace Components',
    description: 'Titanium machining with AS9100 standards',
    productType: 'Aerospace',
    stationConfigs: [],
    active: false,
  },
];
