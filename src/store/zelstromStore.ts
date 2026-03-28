// Zelstrom Global State Store — The central nervous system connecting all layers
// Factory Scenario (WORLD) ↔ Command Center (BRAIN) ↔ Simulation/Workflow (EXECUTION)

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { TeamGeneration, EvolutionMeta } from "@/lib/team-evolution";
import { recordGeneration, computeEvolutionMeta } from "@/lib/team-evolution";
import { buildTeams, buildTeamsFromGenerations, TEAM_DEFINITIONS, type AITeam, type TeamGenerationResult } from "@/lib/teams";
import type { TournamentState } from "@/lib/tournament";
import { INITIAL_TOURNAMENT, scoreTournamentRound } from "@/lib/tournament";
import type { Objectives, FactorySettings } from "@/lib/objectives";
import { DEFAULT_OBJECTIVES, DEFAULT_FACTORY_SETTINGS } from "@/lib/objectives";
import {
  generateScenario,
  runCompetition,
  type FactoryScenario,
  type SimulationResult,
  type AgentType,
} from "@/lib/factory";
import {
  initializeFactory,
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
import { saveOrchestrationPlan, saveHealEvents } from "@/lib/db";

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

  // === TEAM EVOLUTION INTELLIGENCE ===
  teamGenerations: TeamGeneration[];
  evolutionMeta: EvolutionMeta;
  independentTeams: AITeam[];
  recordTeamGeneration: () => void;
  runTeamCompetition: () => void;

  // === TOURNAMENT MODE ===
  tournament: TournamentState;
  startTournament: (rounds?: number) => void;
  resetTournament: () => void;

  // === OBJECTIVES & FACTORY SETTINGS ===
  objectives: Objectives;
  factorySettings: FactorySettings;
  teamNotes: Record<string, string>;
  setObjectives: (o: Objectives) => void;
  setFactorySettings: (s: FactorySettings) => void;
  setTeamNote: (teamId: string, note: string) => void;

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
  orchestrate: () => void;
  deployFromSandbox: (result: SimulationResult) => void;
  getSystemHealth: () => { worldReady: boolean; brainActive: boolean; executionReady: boolean; loopClosed: boolean };
}

export const useZelstromStore = create<ZelstromStore>()(persist((set, get) => ({
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
  teamGenerations: [],
  evolutionMeta: computeEvolutionMeta([]),
  independentTeams: [],
  tournament: INITIAL_TOURNAMENT,

  recordTeamGeneration: () => {
    const { independentTeams, sandboxResults, teamGenerations } = get();
    const teams = independentTeams.length > 0 ? independentTeams : buildTeams(sandboxResults);
    if (teams.length === 0) return;
    const genId = teamGenerations.length + 1;
    const gen = recordGeneration(teams, genId, teamGenerations);
    const newGens = [...teamGenerations, gen].slice(-20);
    set({
      teamGenerations: newGens,
      evolutionMeta: computeEvolutionMeta(newGens),
    });
  },

  runTeamCompetition: () => {
    const { sdmf } = get();
    set({ isSandboxRunning: true, independentTeams: [] });

    // Collect ancestor configs for genetic inheritance
    const ancestorConfigs: any[] = [];
    for (let i = sdmf.generations.length - 1; i >= 0 && ancestorConfigs.length < 2; i--) {
      const gen = sdmf.generations[i];
      if (gen.survivor) ancestorConfigs.push(gen.survivor.configs);
    }
    const previousScores = sdmf.generations.map((g: any) => g.fitnessScore);

    // Call edge function 4 times in parallel — each team gets its own strategy bias
    const teamCalls = TEAM_DEFINITIONS.map((def, idx) =>
      supabase.functions.invoke('evolve', {
        body: {
          strategy: def.strategyBias,
          ancestorConfigs: ancestorConfigs.length > 0 ? ancestorConfigs : null,
          previousScores,
          currentGeneration: sdmf.currentGeneration,
        },
      }).then(({ data, error }) => {
        if (error || !data) {
          console.error(`Team ${def.name} evolution error:`, error);
          return null;
        }
        return { teamIndex: idx, generation: data } as TeamGenerationResult;
      })
    );

    Promise.all(teamCalls).then(results => {
      const validResults = results.filter((r): r is TeamGenerationResult => r !== null);
      if (validResults.length === 0) {
        set({ isSandboxRunning: false });
        return;
      }

      const teams = buildTeamsFromGenerations(validResults);

      // Also create SimulationResult array for backwards compatibility (charts, logs)
      const sandboxResults: SimulationResult[] = teams.map(t => t.result);

      set(state => ({
        independentTeams: teams,
        sandboxResults,
        sandboxRound: state.sandboxRound + 1,
        isSandboxRunning: false,
      }));
    });
  },

  // === TOURNAMENT MODE ===
  startTournament: (rounds = 5) => {
    const state = get();
    if (state.tournament.isRunning) return;

    set({
      tournament: { ...INITIAL_TOURNAMENT, isActive: true, isRunning: true, totalRounds: rounds },
    });

    // Run 5 rounds sequentially
    const runRound = (roundIndex: number) => {
      if (roundIndex >= rounds) {
        set(s => ({
          tournament: { ...s.tournament, isRunning: false },
        }));
        return;
      }

      const { sdmf } = get();
      const ancestorConfigs: any[] = [];
      for (let i = sdmf.generations.length - 1; i >= 0 && ancestorConfigs.length < 2; i--) {
        if (sdmf.generations[i].survivor) ancestorConfigs.push(sdmf.generations[i].survivor!.configs);
      }
      const previousScores = sdmf.generations.map((g: any) => g.fitnessScore);

      const teamCalls = TEAM_DEFINITIONS.map((def, idx) =>
        supabase.functions.invoke('evolve', {
          body: {
            strategy: def.strategyBias,
            ancestorConfigs: ancestorConfigs.length > 0 ? ancestorConfigs : null,
            previousScores,
            currentGeneration: sdmf.currentGeneration + roundIndex,
          },
        }).then(({ data, error }) => {
          if (error || !data) return null;
          return { teamIndex: idx, generation: data } as TeamGenerationResult;
        })
      );

      Promise.all(teamCalls).then(results => {
        const valid = results.filter((r): r is TeamGenerationResult => r !== null);
        if (valid.length === 0) {
          set(s => ({ tournament: { ...s.tournament, isRunning: false } }));
          return;
        }

        const teams = buildTeamsFromGenerations(valid);
        const round = {
          roundNumber: roundIndex + 1,
          teams,
          scenarioLabel: `Scenario ${roundIndex + 1}`,
          timestamp: Date.now(),
        };

        set(s => {
          const newRounds = [...s.tournament.completedRounds, round];
          const standings = scoreTournamentRound(round, s.tournament.standings);
          return {
            tournament: {
              ...s.tournament,
              completedRounds: newRounds,
              standings,
              currentRoundIndex: roundIndex + 1,
            },
            // Show latest round's teams in the UI
            independentTeams: teams,
            sandboxResults: teams.map(t => t.result),
            sandboxRound: s.sandboxRound + 1,
          };
        });

        // Next round after a short delay
        setTimeout(() => runRound(roundIndex + 1), 800);
      });
    };

    runRound(0);
  },

  resetTournament: () => {
    set({ tournament: INITIAL_TOURNAMENT });
  },

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

    const { sdmf, strategy } = get();

    // Collect ancestor configs for genetic inheritance
    const ancestorConfigs: any[] = [];
    for (let i = sdmf.generations.length - 1; i >= 0 && ancestorConfigs.length < 2; i--) {
      const gen = sdmf.generations[i];
      if (gen.survivor) ancestorConfigs.push(gen.survivor.configs);
    }

    const previousScores = sdmf.generations.map(g => g.fitnessScore);

    // Call server-side evolution engine
    supabase.functions.invoke('evolve', {
      body: {
        strategy,
        ancestorConfigs: ancestorConfigs.length > 0 ? ancestorConfigs : null,
        previousScores,
        currentGeneration: sdmf.currentGeneration,
      },
    }).then(({ data: gen, error }) => {
      if (error || !gen) {
        console.error('Evolution edge function error:', error);
        set({ isEvolving: false });
        return;
      }

      set(state => {
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
            selfHealingEvents: state.sdmf.selfHealingEvents + (gen.attacks?.some((a: any) => a.severity > 7) ? 1 : 0),
          },
        };
      });
    });
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

      // Persist anomalies to database
      if (newAnomalies.length > 0) {
        saveHealEvents(newAnomalies).catch(console.error);
      }

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
    set({ isEvolving: true });

    // Collect ancestor configs
    const ancestorConfigs: any[] = [];
    for (let i = sdmf.generations.length - 1; i >= 0 && ancestorConfigs.length < 2; i--) {
      if (sdmf.generations[i].survivor) ancestorConfigs.push(sdmf.generations[i].survivor!.configs);
    }
    const previousScores = sdmf.generations.map(g => g.fitnessScore);

    supabase.functions.invoke('evolve', {
      body: {
        strategy,
        ancestorConfigs: ancestorConfigs.length > 0 ? ancestorConfigs : null,
        previousScores,
        currentGeneration: sdmf.currentGeneration,
      },
    }).then(({ data: gen, error }) => {
      if (error || !gen) {
        console.error('Orchestration edge function error:', error);
        set({ isEvolving: false });
        return;
      }

      const newGens = [...sdmf.generations, gen];

      let newTests = [...sdmf.abTests];
      if (newGens.length >= 2) {
        const ab = runABTest(sdmf, newGens[newGens.length - 2], gen);
        newTests = [...newTests.slice(-4), ab];
      }

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

      if (gen.survivor) {
        notifyGenerationComplete({
          generationId: gen.id,
          winnerId: gen.survivor.id,
          winnerName: gen.survivor.agentName,
          score: gen.survivor.score,
        });
      }

      saveOrchestrationPlan(plan).catch(console.error);

      set(state => ({
        isEvolving: false,
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
    });
  },

  // === OBJECTIVES & FACTORY SETTINGS ===
  objectives: DEFAULT_OBJECTIVES,
  factorySettings: DEFAULT_FACTORY_SETTINGS,
  teamNotes: {} as Record<string, string>,
  setObjectives: (o) => set({ objectives: o }),
  setFactorySettings: (s) => set({ factorySettings: s }),
  setTeamNote: (teamId, note) => set(state => ({ teamNotes: { ...state.teamNotes, [teamId]: note } })),


  deployFromSandbox: (result: SimulationResult) => {
    // Create a minimal deployment from sandbox result to workflow
    const stageConfigs: Record<string, any> = {};
    result.assignments.forEach(a => {
      stageConfigs[a.machineId] = {
        machineCount: 1,
        speedMultiplier: 1.0,
        costPerUnit: result.totalCost / Math.max(result.assignments.length, 1),
        defectRate: 0.02,
        batchSize: 10,
        maxCapacity: 40,
      };
    });
    const deployed = {
      generationId: 0,
      agentName: result.agentName,
      score: result.score,
      timestamp: Date.now(),
      stageConfigs,
    };
    localStorage.setItem("sdmf-deployed-config", JSON.stringify(deployed));
    window.dispatchEvent(new CustomEvent("sdmf-deploy", { detail: deployed }));
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
}), {
  name: 'zelstrom-store',
  partialize: (state) => ({
    scenario: state.scenario,
    sandboxResults: state.sandboxResults,
    sandboxRound: state.sandboxRound,
    sdmf: state.sdmf,
    strategy: state.strategy,
    plans: state.plans,
    activePlan: state.activePlan,
    leaderboardKey: state.leaderboardKey,
    teamGenerations: state.teamGenerations,
    evolutionMeta: state.evolutionMeta,
    independentTeams: state.independentTeams,
    tournament: state.tournament,
    objectives: state.objectives,
    factorySettings: state.factorySettings,
    teamNotes: state.teamNotes,
  }),
}));
