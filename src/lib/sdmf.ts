// Software-Defined Micro-Factory (SDMF) Engine
// Adversarial Multi-Agent System with Evolution Timeline

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
  agentType: 'optimizer' | 'stress-tester';
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

// --- Adversarial Agent Engine ---

function randomConfig(stationId: string): ProcessConfig {
  return {
    stationId,
    speed: Math.round((0.5 + Math.random() * 2) * 10) / 10,
    pressure: Math.floor(Math.random() * 60 + 20),
    temperature: Math.floor(Math.random() * 100 + 20),
    batchSize: Math.floor(Math.random() * 80 + 10),
    qualityThreshold: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
    routingPriority: Math.floor(Math.random() * 10) + 1,
  };
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

function applyAttacks(score: number, attacks: StressAttack[]): number {
  let penalty = 0;
  attacks.forEach(a => {
    penalty += a.impactScore * (a.severity / 10);
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

export function runAdversarialGeneration(state: SDMFState): EvolutionGeneration {
  const genId = state.currentGeneration + 1;
  const proposals: AgentProposal[] = [];

  // Generate optimizer proposals
  const numProposals = 3 + Math.floor(Math.random() * 3); // 3-5 proposals
  for (let i = 0; i < numProposals; i++) {
    const strategy = OPTIMIZER_STRATEGIES[i % OPTIMIZER_STRATEGIES.length];
    const configs = state.stations.map(st => {
      const cfg = randomConfig(st.id);
      // Bias configs based on strategy
      if (strategy.bias === 'speed') cfg.speed = Math.min(3, cfg.speed * 1.5);
      if (strategy.bias === 'cost') { cfg.speed = Math.max(0.3, cfg.speed * 0.7); cfg.pressure *= 0.6; }
      if (strategy.bias === 'quality') cfg.qualityThreshold = Math.min(0.99, cfg.qualityThreshold + 0.1);
      return cfg;
    });

    const eval_ = evaluateProposal(configs, state.stations);
    const reasonings = OPTIMIZER_REASONING[strategy.bias] || OPTIMIZER_REASONING.balanced;

    proposals.push({
      id: `prop-${genId}-${i}`,
      agentType: 'optimizer',
      agentName: strategy.name,
      configs,
      projectedThroughput: eval_.throughput,
      projectedCost: eval_.cost,
      projectedDefectRate: eval_.defectRate,
      projectedUptime: eval_.uptime,
      score: eval_.score,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
      survived: true,
      generation: genId,
    });
  }

  // Stress-tester generates attacks
  const attacks = generateAttacks(state.stations, 4 + Math.floor(Math.random() * 4));

  // Apply attacks to each proposal
  proposals.forEach(p => {
    const postAttackScore = applyAttacks(p.score, attacks);
    p.attacks = attacks;
    p.survived = postAttackScore > 30; // survival threshold
    p.score = postAttackScore;
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
    attacks,
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
