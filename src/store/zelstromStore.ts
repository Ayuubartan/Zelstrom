// Zelstrom Global State Store — The central nervous system connecting all layers
// Factory Scenario (WORLD) ↔ Command Center (BRAIN) ↔ Simulation/Workflow (EXECUTION)

import { create } from "zustand";
import {
  generateScenario,
  runCompetition,
  type FactoryScenario,
  type SimulationResult,
  type AgentType,
} from "@/lib/factory";
import {
  initializeFactory,
  runAdversarialGeneration,
  runABTest,
  updateSensors,
  type SDMFState,
  type EvolutionGeneration,
  type AgentProposal,
} from "@/lib/sdmf";
import { deployWinnerToWorkflow } from "@/lib/deploy-bridge";
import { getPipelineHistory, type PipelineRunResult } from "@/lib/feedback-bridge";
import { detectAnomalies, type SelfHealEvent } from "@/lib/self-healing";
import { notifyGenerationComplete } from "@/lib/external-agent-bridge";

// --- Strategy types ---
export type Strategy = "minimize-cost" | "maximize-speed" | "balanced" | "adaptive";

export interface OrchestrationPlan {
  id: string;
  strategy: Strategy;
  timestamp: number;
  scenarioId: string;
  sandboxResults: SimulationResult[];
  sdmfGeneration: EvolutionGeneration | null;
  deployedAgent: AgentProposal | null;
  score: number;
  status: "planning" | "executing" | "completed" | "failed";
}

// --- The unified store ---
export interface ZelstromStore {
  // === WORLD STATE (Factory Scenario) ===
  scenario: FactoryScenario | null;
  sandboxResults: SimulationResult[];
  sandboxRound: number;
  isSandboxRunning: boolean;

  // === BRAIN STATE (Command Center / SDMF) ===
  sdmf: SDMFState;
  strategy: Strategy;
  isEvolving: boolean;
  autoEvolve: boolean;
  pipelineResults: PipelineRunResult[];
  healEvents: SelfHealEvent[];
  leaderboardKey: number;

  // === ORCHESTRATION (the missing link) ===
  plans: OrchestrationPlan[];
  activePlan: OrchestrationPlan | null;

  // === WORLD ACTIONS ===
  initializeScenario: (jobCount?: number, machineCount?: number) => void;
  runSandboxCompetition: () => void;
  newSandboxRound: () => void;

  // === BRAIN ACTIONS ===
  setStrategy: (s: Strategy) => void;
  runGeneration: () => void;
  toggleAutoEvolve: () => void;
  deployWinner: () => { generationId: number; agentName: string } | null;
  resetFactory: () => void;
  updateSensorTick: () => void;
  addPipelineResult: (r: PipelineRunResult) => void;

  // === ORCHESTRATION ACTIONS ===
  orchestrate: () => void; // The key connection: scenario → brain → execution
  getSystemHealth: () => { worldReady: boolean; brainActive: boolean; executionReady: boolean; loopClosed: boolean };
}

export const useZelstromStore = create<ZelstromStore>((set, get) => ({
  // --- Initial state ---
  scenario: null,
  sandboxResults: [],
  sandboxRound: 0,
  isSandboxRunning: false,

  sdmf: initializeFactory(),
  strategy: "balanced",
  isEvolving: false,
  autoEvolve: false,
  pipelineResults: getPipelineHistory(),
  healEvents: [],
  leaderboardKey: 0,

  plans: [],
  activePlan: null,

  // === WORLD ACTIONS ===
  initializeScenario: (jobCount = 8, machineCount = 4) => {
    const scenario = generateScenario(jobCount, machineCount);
    set({ scenario, sandboxResults: [], sandboxRound: 0 });
  },

  runSandboxCompetition: () => {
    const { scenario } = get();
    if (!scenario) return;
    set({ isSandboxRunning: true });
    // Simulate delay
    setTimeout(() => {
      const results = runCompetition(scenario);
      set(state => ({
        sandboxResults: results,
        sandboxRound: state.sandboxRound + 1,
        isSandboxRunning: false,
      }));
    }, 800);
  },

  newSandboxRound: () => {
    const jobCount = Math.floor(Math.random() * 6) + 6;
    const machineCount = Math.floor(Math.random() * 3) + 3;
    const scenario = generateScenario(jobCount, machineCount);
    set({ scenario, isSandboxRunning: true });
    setTimeout(() => {
      const results = runCompetition(scenario);
      set(state => ({
        sandboxResults: results,
        sandboxRound: state.sandboxRound + 1,
        isSandboxRunning: false,
      }));
    }, 800);
  },

  // === BRAIN ACTIONS ===
  setStrategy: (strategy) => set({ strategy }),

  runGeneration: () => {
    set({ isEvolving: true });
    setTimeout(() => {
      set(state => {
        const gen = runAdversarialGeneration(state.sdmf);
        const newGens = [...state.sdmf.generations, gen];

        let newTests = [...state.sdmf.abTests];
        if (newGens.length >= 2) {
          const ab = runABTest(state.sdmf, newGens[newGens.length - 2], gen);
          newTests = [...newTests.slice(-4), ab];
        }

        // Notify external agents
        if (gen.survivor) {
          notifyGenerationComplete({
            generationId: gen.id,
            winnerId: gen.survivor.id,
            winnerName: gen.survivor.agentName,
            score: gen.survivor.score,
          });
        }

        return {
          isEvolving: false,
          leaderboardKey: state.leaderboardKey + 1,
          sdmf: {
            ...state.sdmf,
            generations: newGens,
            currentGeneration: gen.id,
            abTests: newTests,
            overallScore: gen.fitnessScore,
            totalUnitsProduced: state.sdmf.totalUnitsProduced + Math.floor(Math.random() * 50 + 20),
            selfHealingEvents: state.sdmf.selfHealingEvents + (gen.attacks.some(a => a.severity > 7) ? 1 : 0),
          },
        };
      });
    }, 600);
  },

  toggleAutoEvolve: () => set(state => ({ autoEvolve: !state.autoEvolve })),

  deployWinner: () => {
    const { sdmf } = get();
    const latestGen = sdmf.generations[sdmf.generations.length - 1];
    if (!latestGen?.survivor) return null;
    deployWinnerToWorkflow(latestGen.survivor, latestGen.id);
    return { generationId: latestGen.id, agentName: latestGen.survivor.agentName };
  },

  resetFactory: () => {
    set({
      sdmf: initializeFactory(),
      autoEvolve: false,
      healEvents: [],
      plans: [],
      activePlan: null,
    });
  },

  updateSensorTick: () => {
    set(state => {
      const updatedStations = updateSensors(state.sdmf.stations);
      const newAnomalies = detectAnomalies(updatedStations);
      const newHealEvents = newAnomalies.length > 0
        ? [...newAnomalies, ...state.healEvents].slice(0, 50)
        : state.healEvents;
      const healed = newAnomalies.filter(e => e.success).length;
      return {
        healEvents: newHealEvents,
        sdmf: {
          ...state.sdmf,
          stations: updatedStations,
          selfHealingEvents: state.sdmf.selfHealingEvents + healed,
        },
      };
    });
  },

  addPipelineResult: (result) => {
    set(state => ({
      pipelineResults: [...state.pipelineResults.slice(-9), result],
      leaderboardKey: state.leaderboardKey + 1,
    }));
  },

  // === ORCHESTRATION — THE MISSING LINK ===
  orchestrate: () => {
    const { scenario, sdmf, strategy, sandboxResults } = get();

    // 1. Run a generation influenced by strategy
    const gen = runAdversarialGeneration(sdmf);
    const newGens = [...sdmf.generations, gen];

    let newTests = [...sdmf.abTests];
    if (newGens.length >= 2) {
      const ab = runABTest(sdmf, newGens[newGens.length - 2], gen);
      newTests = [...newTests.slice(-4), ab];
    }

    // 2. Build orchestration plan linking world → brain → execution
    const plan: OrchestrationPlan = {
      id: `plan-${Date.now()}`,
      strategy,
      timestamp: Date.now(),
      scenarioId: scenario ? `scenario-${scenario.jobs.length}j-${scenario.machines.length}m` : "none",
      sandboxResults: [...sandboxResults],
      sdmfGeneration: gen,
      deployedAgent: gen.survivor,
      score: gen.fitnessScore,
      status: "completed",
    };

    // 3. Notify external agents
    if (gen.survivor) {
      notifyGenerationComplete({
        generationId: gen.id,
        winnerId: gen.survivor.id,
        winnerName: gen.survivor.agentName,
        score: gen.survivor.score,
      });
    }

    set(state => ({
      sdmf: {
        ...state.sdmf,
        generations: newGens,
        currentGeneration: gen.id,
        abTests: newTests,
        overallScore: gen.fitnessScore,
        totalUnitsProduced: state.sdmf.totalUnitsProduced + Math.floor(Math.random() * 50 + 20),
      },
      plans: [...state.plans.slice(-19), plan],
      activePlan: plan,
      leaderboardKey: state.leaderboardKey + 1,
    }));
  },

  getSystemHealth: () => {
    const { scenario, sdmf, pipelineResults } = get();
    return {
      worldReady: scenario !== null,
      brainActive: sdmf.generations.length > 0,
      executionReady: sdmf.stations.some(s => s.status === "online" || s.status === "running"),
      loopClosed: pipelineResults.length > 0,
    };
  },
}));
