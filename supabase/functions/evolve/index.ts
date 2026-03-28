import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ——— Types ———
interface ProcessConfig {
  stationId: string;
  speed: number;
  pressure: number;
  temperature: number;
  batchSize: number;
  qualityThreshold: number;
  routingPriority: number;
}

interface StressAttack {
  type: string;
  targetStation: string;
  severity: number;
  description: string;
  impactScore: number;
}

interface AgentProposal {
  id: string;
  agentType: string;
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

// ——— Station templates (same as client) ———
const STATIONS = [
  { id: "stn-cnc", name: "CNC Machining Cell", type: "cnc", defectRate: 0.02, uptime: 98.5 },
  { id: "stn-3dp", name: "3D Print Bay", type: "3dprint", defectRate: 0.01, uptime: 96.2 },
  { id: "stn-laser", name: "Laser Cutting", type: "laser", defectRate: 0.015, uptime: 99.1 },
  { id: "stn-weld", name: "Robotic Welding", type: "welding", defectRate: 0.04, uptime: 97.3 },
  { id: "stn-paint", name: "Paint & Coating", type: "painting", defectRate: 0.03, uptime: 95.8 },
  { id: "stn-asm", name: "Assembly Line", type: "assembly", defectRate: 0.035, uptime: 98.0 },
  { id: "stn-qc", name: "Quality Control", type: "qc", defectRate: 0.005, uptime: 99.5 },
  { id: "stn-pkg", name: "Packaging & Ship", type: "packaging", defectRate: 0.01, uptime: 99.0 },
];

// ——— Config generation ———
function randomConfig(stationId: string): ProcessConfig {
  return {
    stationId,
    speed: Math.round((0.8 + Math.random() * 1.2) * 10) / 10,
    pressure: Math.floor(Math.random() * 35 + 25),
    temperature: Math.floor(Math.random() * 60 + 30),
    batchSize: Math.floor(Math.random() * 40 + 20),
    qualityThreshold: Math.round((0.8 + Math.random() * 0.15) * 100) / 100,
    routingPriority: Math.floor(Math.random() * 6) + 3,
  };
}

const MUTATION_RATE = 0.3;
const MUTATION_STRENGTH = 0.15;

function mutateConfig(parent: ProcessConfig): ProcessConfig {
  const m = (val: number, min: number, max: number): number => {
    if (Math.random() > MUTATION_RATE) return val;
    const delta = val * MUTATION_STRENGTH * (Math.random() * 2 - 1);
    return Math.round(Math.min(max, Math.max(min, val + delta)) * 100) / 100;
  };
  return {
    stationId: parent.stationId,
    speed: Math.round(m(parent.speed, 0.3, 3.0) * 10) / 10,
    pressure: Math.floor(m(parent.pressure, 10, 80)),
    temperature: Math.floor(m(parent.temperature, 15, 120)),
    batchSize: Math.floor(m(parent.batchSize, 5, 90)),
    qualityThreshold: Math.round(m(parent.qualityThreshold, 0.7, 0.99) * 100) / 100,
    routingPriority: Math.max(1, Math.min(10, Math.floor(m(parent.routingPriority, 1, 10)))),
  };
}

function crossoverConfigs(a: ProcessConfig, b: ProcessConfig): ProcessConfig {
  const pick = <T>(x: T, y: T): T => (Math.random() < 0.5 ? x : y);
  return {
    stationId: a.stationId,
    speed: pick(a.speed, b.speed),
    pressure: pick(a.pressure, b.pressure),
    temperature: pick(a.temperature, b.temperature),
    batchSize: pick(a.batchSize, b.batchSize),
    qualityThreshold: pick(a.qualityThreshold, b.qualityThreshold),
    routingPriority: pick(a.routingPriority, b.routingPriority),
  };
}

// ——— Evaluation (uses custom weights & constraints) ———
interface ObjectivesInput {
  weights?: { cost: number; speed: number; quality: number };
  kpiTargets?: { metric: string; operator: string; value: number }[];
  constraints?: { maxBudget?: number; minOutput?: number; maxTime?: number; maxDefectRate?: number };
}

interface FactorySettingsInput {
  productionParams?: { speedMultiplier?: number; costPerUnit?: number; defectRate?: number; batchSize?: number };
  environment?: { energyCostPerKwh?: number; shiftsPerDay?: number };
}

function evaluateProposal(configs: ProcessConfig[], objectives?: ObjectivesInput, factorySettings?: FactorySettingsInput) {
  const speedMult = factorySettings?.productionParams?.speedMultiplier ?? 1.0;
  const baseCostPerUnit = factorySettings?.productionParams?.costPerUnit ?? 12;
  const baseDefectMod = factorySettings?.productionParams?.defectRate ?? 2;
  const energyCost = factorySettings?.environment?.energyCostPerKwh ?? 0.12;
  const shifts = factorySettings?.environment?.shiftsPerDay ?? 2;

  let throughput = 0, cost = 0, defects = 0, uptimeSum = 0;
  configs.forEach((cfg) => {
    const st = STATIONS.find((s) => s.id === cfg.stationId);
    if (!st) return;
    const effectiveSpeed = cfg.speed * speedMult;
    throughput += effectiveSpeed * cfg.batchSize * (cfg.qualityThreshold > 0.9 ? 0.85 : 1) * (shifts / 2);
    cost += effectiveSpeed * cfg.pressure * 0.1 + cfg.batchSize * (baseCostPerUnit / 24) + energyCost * effectiveSpeed * 10;
    defects += (st.defectRate + baseDefectMod / 100) * (1 - cfg.qualityThreshold) * (effectiveSpeed > 1.5 ? 1.5 : 1);
    uptimeSum += st.uptime - (effectiveSpeed > 2 ? 3 : 0);
  });
  const avgUptime = uptimeSum / Math.max(configs.length, 1);

  // Use custom weights if provided, otherwise defaults
  const w = objectives?.weights ?? { cost: 35, speed: 25, quality: 20 };
  const totalW = w.cost + w.speed + w.quality;
  const wCost = totalW > 0 ? w.cost / totalW : 0.35;
  const wSpeed = totalW > 0 ? w.speed / totalW : 0.25;
  const wQuality = totalW > 0 ? w.quality / totalW : 0.2;
  const wUptime = Math.max(0, 1 - wCost - wSpeed - wQuality);

  let score = Math.round(
    (throughput / 10) * wSpeed +
    Math.max(0, 100 - cost / 5) * wCost +
    Math.max(0, (1 - defects) * 100) * wQuality +
    avgUptime * wUptime
  );

  // Apply KPI target bonuses/penalties
  if (objectives?.kpiTargets) {
    for (const kpi of objectives.kpiTargets) {
      let actual = 0;
      if (kpi.metric === "cost") actual = cost;
      else if (kpi.metric === "throughput") actual = throughput / 10;
      else if (kpi.metric === "defectRate") actual = defects * 100;
      else if (kpi.metric === "time") actual = configs.length * 10; // proxy
      else if (kpi.metric === "score") actual = score;

      let met = false;
      if (kpi.operator === "<") met = actual < kpi.value;
      else if (kpi.operator === ">") met = actual > kpi.value;
      else if (kpi.operator === "<=") met = actual <= kpi.value;
      else if (kpi.operator === ">=") met = actual >= kpi.value;
      else if (kpi.operator === "=") met = Math.abs(actual - kpi.value) < kpi.value * 0.05;

      score += met ? 5 : -3; // Reward meeting targets, penalize missing them
    }
  }

  // Apply constraint penalties
  if (objectives?.constraints) {
    const c = objectives.constraints;
    if (c.maxBudget && cost > c.maxBudget) score -= Math.round((cost - c.maxBudget) / c.maxBudget * 15);
    if (c.minOutput && throughput / 10 < c.minOutput) score -= 8;
    if (c.maxDefectRate && defects * 100 > c.maxDefectRate) score -= 10;
  }

  return {
    throughput: Math.round(throughput),
    cost: Math.round(cost),
    defectRate: Math.round(defects * 1000) / 1000,
    uptime: Math.round(avgUptime * 10) / 10,
    score: Math.min(100, Math.max(0, score)),
  };
}

// ——— Stress tests ———
const ATTACK_DESCRIPTIONS: Record<string, string[]> = {
  bottleneck: ["Queue overflow at station", "Upstream delay causing backpressure"],
  failure: ["Actuator failure", "Power supply interruption"],
  "demand-spike": ["300% demand surge", "Rush order injection"],
  "supply-shortage": ["Raw material depletion", "Supplier delivery delay"],
  "thermal-overload": ["Coolant system failure", "Ambient temperature spike"],
  "quality-drift": ["Calibration drift detected", "Tool wear acceleration"],
};

function analyzeVulnerabilities(configs: ProcessConfig[]) {
  const vulns: { type: string; weight: number; reason: string }[] = [];
  const avgSpeed = configs.reduce((s, c) => s + c.speed, 0) / configs.length;
  const avgQuality = configs.reduce((s, c) => s + c.qualityThreshold, 0) / configs.length;
  const avgPressure = configs.reduce((s, c) => s + c.pressure, 0) / configs.length;
  const avgBatch = configs.reduce((s, c) => s + c.batchSize, 0) / configs.length;

  if (avgSpeed > 1.8) vulns.push({ type: "thermal-overload", weight: avgSpeed / 1.5, reason: `high speed ${avgSpeed.toFixed(1)}` });
  if (avgQuality < 0.85) vulns.push({ type: "quality-drift", weight: (0.9 - avgQuality) * 8, reason: `low quality ${avgQuality.toFixed(2)}` });
  if (avgPressure > 55) vulns.push({ type: "supply-shortage", weight: avgPressure / 40, reason: `high pressure` });
  if (avgBatch > 60) vulns.push({ type: "bottleneck", weight: avgBatch / 40, reason: `large batches` });
  if (avgSpeed > 1.5 && avgBatch > 40) vulns.push({ type: "demand-spike", weight: 1.2, reason: "near capacity" });

  return vulns;
}

function generateTargetedAttacks(configs: ProcessConfig[], baseCount: number): StressAttack[] {
  // Base random attacks
  const baseAttacks: StressAttack[] = Array.from({ length: Math.max(2, Math.floor(baseCount * 0.4)) }, () => {
    const types = Object.keys(ATTACK_DESCRIPTIONS);
    const type = types[Math.floor(Math.random() * types.length)];
    const target = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    const descs = ATTACK_DESCRIPTIONS[type];
    return {
      type,
      targetStation: target.id,
      severity: Math.floor(Math.random() * 7) + 3,
      description: `${descs[Math.floor(Math.random() * descs.length)]} → ${target.name}`,
      impactScore: Math.floor(Math.random() * 20) + 5,
    };
  });

  // Targeted attacks
  const vulns = analyzeVulnerabilities(configs);
  const targeted = vulns.map((vuln) => {
    const target = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    const descs = ATTACK_DESCRIPTIONS[vuln.type] || ["Unknown attack"];
    return {
      type: vuln.type,
      targetStation: target.id,
      severity: Math.min(10, Math.floor(vuln.weight * 3 + Math.random() * 3 + 2)),
      description: `${descs[Math.floor(Math.random() * descs.length)]} → ${target.name} [targeted: ${vuln.reason}]`,
      impactScore: Math.floor(vuln.weight * 8 + Math.random() * 10 + 3),
    };
  });

  return [...baseAttacks, ...targeted];
}

function applyAttacks(score: number, attacks: StressAttack[], configs: ProcessConfig[]): number {
  let penalty = 0;
  attacks.forEach((a) => {
    let multiplier = 1.0;
    const cfg = configs.find((c) => c.stationId === a.targetStation);
    if (cfg) {
      if (a.type === "thermal-overload" && cfg.speed > 2.0) multiplier = 1.4;
      if (a.type === "quality-drift" && cfg.qualityThreshold < 0.85) multiplier = 1.5;
      if (a.type === "thermal-overload" && cfg.speed < 1.0) multiplier = 0.6;
      if (a.type === "quality-drift" && cfg.qualityThreshold > 0.95) multiplier = 0.5;
    }
    penalty += a.impactScore * (a.severity / 10) * multiplier;
  });
  return Math.max(0, Math.round(score - penalty));
}

// ——— LLM Strategy Generation ———
async function generateLLMStrategy(
  ancestorConfigs: ProcessConfig[][] | null,
  strategy: string,
  genId: number,
  previousScores: number[]
): Promise<{ configs: ProcessConfig[]; reasoning: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    // Fallback to heuristic if no API key
    return {
      configs: STATIONS.map((st) => randomConfig(st.id)),
      reasoning: "LLM unavailable — using random exploration",
    };
  }

  const systemPrompt = `You are an AI factory optimization agent. You generate ProcessConfig arrays for factory stations.
Each config has: stationId, speed (0.3-3.0), pressure (10-80), temperature (15-120), batchSize (5-90), qualityThreshold (0.7-0.99), routingPriority (1-10).

Strategy: ${strategy}
Generation: ${genId}
Previous best scores: ${previousScores.slice(-3).join(", ") || "none"}
${ancestorConfigs ? `Ancestor configs available — improve upon them.` : "No ancestors — explore freely."}

Return a JSON object with:
- "configs": array of 8 ProcessConfig objects (one per station)
- "reasoning": a 1-sentence explanation of your strategy

Station IDs: ${STATIONS.map((s) => s.id).join(", ")}`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: ancestorConfigs
              ? `Improve on these ancestor configs:\n${JSON.stringify(ancestorConfigs[0]?.slice(0, 3))}\n\nGenerate optimized configs for strategy "${strategy}".`
              : `Generate optimal factory configs for strategy "${strategy}".`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_strategy",
              description: "Submit a factory optimization strategy with configs for all 8 stations",
              parameters: {
                type: "object",
                properties: {
                  configs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stationId: { type: "string" },
                        speed: { type: "number" },
                        pressure: { type: "number" },
                        temperature: { type: "number" },
                        batchSize: { type: "number" },
                        qualityThreshold: { type: "number" },
                        routingPriority: { type: "number" },
                      },
                      required: ["stationId", "speed", "pressure", "temperature", "batchSize", "qualityThreshold", "routingPriority"],
                    },
                  },
                  reasoning: { type: "string" },
                },
                required: ["configs", "reasoning"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_strategy" } },
      }),
    });

    if (!resp.ok) {
      console.error("LLM error:", resp.status);
      return {
        configs: STATIONS.map((st) => randomConfig(st.id)),
        reasoning: `LLM returned ${resp.status} — using random fallback`,
      };
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      // Validate and clamp configs
      const configs: ProcessConfig[] = STATIONS.map((st) => {
        const llmCfg = args.configs?.find((c: any) => c.stationId === st.id);
        if (!llmCfg) return randomConfig(st.id);
        return {
          stationId: st.id,
          speed: Math.max(0.3, Math.min(3.0, llmCfg.speed || 1.0)),
          pressure: Math.max(10, Math.min(80, llmCfg.pressure || 40)),
          temperature: Math.max(15, Math.min(120, llmCfg.temperature || 50)),
          batchSize: Math.max(5, Math.min(90, llmCfg.batchSize || 30)),
          qualityThreshold: Math.max(0.7, Math.min(0.99, llmCfg.qualityThreshold || 0.85)),
          routingPriority: Math.max(1, Math.min(10, llmCfg.routingPriority || 5)),
        };
      });
      return { configs, reasoning: args.reasoning || "LLM-optimized strategy" };
    }

    return {
      configs: STATIONS.map((st) => randomConfig(st.id)),
      reasoning: "LLM response parsing failed — using random fallback",
    };
  } catch (e) {
    console.error("LLM call failed:", e);
    return {
      configs: STATIONS.map((st) => randomConfig(st.id)),
      reasoning: `LLM error: ${e instanceof Error ? e.message : "unknown"} — using random fallback`,
    };
  }
}

// ——— Main handler ———
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { strategy = "balanced", ancestorConfigs = null, previousScores = [], currentGeneration = 0 } = await req.json();

    const genId = currentGeneration + 1;
    const proposals: AgentProposal[] = [];
    const hasAncestors = ancestorConfigs && ancestorConfigs.length > 0;

    // ——— Heuristic agents (3-4 proposals with genetic inheritance) ———
    const strategies = [
      { name: "Throughput Maximizer", bias: "speed" },
      { name: "Cost Minimizer", bias: "cost" },
      { name: "Quality Guardian", bias: "quality" },
      { name: "Balance Architect", bias: "balanced" },
    ];

    for (let i = 0; i < strategies.length; i++) {
      const strat = strategies[i];
      let configs: ProcessConfig[];
      let origin: string;

      if (!hasAncestors || i === strategies.length - 1) {
        configs = STATIONS.map((st) => randomConfig(st.id));
        origin = "random";
      } else if (ancestorConfigs.length >= 2 && i % 3 === 1) {
        const [pA, pB] = ancestorConfigs;
        configs = STATIONS.map((st) => {
          const cfgA = pA.find((c: any) => c.stationId === st.id) || randomConfig(st.id);
          const cfgB = pB.find((c: any) => c.stationId === st.id) || randomConfig(st.id);
          return mutateConfig(crossoverConfigs(cfgA, cfgB));
        });
        origin = "crossover";
      } else {
        const parent = ancestorConfigs[0];
        configs = STATIONS.map((st) => {
          const parentCfg = parent.find((c: any) => c.stationId === st.id) || randomConfig(st.id);
          return mutateConfig(parentCfg);
        });
        origin = "mutated";
      }

      // Apply strategy bias
      configs.forEach((cfg) => {
        if (strat.bias === "speed") cfg.speed = Math.min(3, cfg.speed * 1.3);
        if (strat.bias === "cost") { cfg.speed = Math.max(0.3, cfg.speed * 0.8); cfg.pressure = Math.max(10, cfg.pressure * 0.7); }
        if (strat.bias === "quality") cfg.qualityThreshold = Math.min(0.99, cfg.qualityThreshold + 0.05);
      });

      const eval_ = evaluateProposal(configs);
      const attacks = generateTargetedAttacks(configs, 5);
      const postAttackScore = applyAttacks(eval_.score, attacks, configs);

      proposals.push({
        id: `prop-${genId}-${i}`,
        agentType: "optimizer",
        agentName: strat.name,
        configs,
        projectedThroughput: eval_.throughput,
        projectedCost: eval_.cost,
        projectedDefectRate: eval_.defectRate,
        projectedUptime: eval_.uptime,
        score: postAttackScore,
        reasoning: `${strat.bias} strategy [${origin}]`,
        attacks,
        survived: postAttackScore > 30,
        generation: genId,
      });
    }

    // ——— LLM Agent (REAL AI reasoning) ———
    const llmResult = await generateLLMStrategy(ancestorConfigs, strategy, genId, previousScores);
    const llmEval = evaluateProposal(llmResult.configs);
    const llmAttacks = generateTargetedAttacks(llmResult.configs, 5);
    const llmPostAttack = applyAttacks(llmEval.score, llmAttacks, llmResult.configs);

    proposals.push({
      id: `prop-${genId}-llm`,
      agentType: "optimizer",
      agentName: "LLM Strategist",
      configs: llmResult.configs,
      projectedThroughput: llmEval.throughput,
      projectedCost: llmEval.cost,
      projectedDefectRate: llmEval.defectRate,
      projectedUptime: llmEval.uptime,
      score: llmPostAttack,
      reasoning: `🧠 ${llmResult.reasoning}`,
      attacks: llmAttacks,
      survived: llmPostAttack > 30,
      generation: genId,
    });

    // Sort and pick survivor
    proposals.sort((a, b) => b.score - a.score);
    const survivor = proposals.find((p) => p.survived) || proposals[0];
    const retired = proposals.filter((p) => p !== survivor);

    const prevBest = previousScores.length > 0 ? previousScores[previousScores.length - 1] : 50;
    const improvement = prevBest > 0 ? Math.round(((survivor.score - prevBest) / prevBest) * 100) : 0;

    const generation = {
      id: genId,
      timestamp: Date.now(),
      proposals,
      attacks: proposals.flatMap((p) => p.attacks || []).slice(0, 10),
      survivor,
      retired,
      fitnessScore: survivor.score,
      improvement,
    };

    // ——— Persist to database ———
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("generations").insert({
      generation_number: genId,
      timestamp: generation.timestamp,
      proposals: generation.proposals as any,
      attacks: generation.attacks as any,
      survivor: generation.survivor as any,
      retired: generation.retired as any,
      fitness_score: generation.fitnessScore,
      improvement: generation.improvement,
      strategy_bias: strategy,
    });

    return new Response(JSON.stringify(generation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Evolution error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
