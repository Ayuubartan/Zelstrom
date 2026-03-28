import { useEffect } from "react";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { TeamCard } from "@/components/TeamCard";
import { EvolutionInsightsPanel } from "@/components/EvolutionInsightsPanel";
import { TournamentPanel } from "@/components/TournamentPanel";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw, Rocket, Brain, Users, Server,
  Target, DollarSign, Zap, Shield, AlertTriangle, TrendingUp,
} from "lucide-react";
import type { SimulationResult } from "@/lib/factory";
import { useZelstromStore } from "@/store/zelstromStore";

interface StrategyStepProps {
  results: SimulationResult[];
  round: number;
  isSandboxRunning: boolean;
  onNewRound: () => void;
  onOrchestrate: () => void;
  onSelectWinner: () => void;
}

export function StrategyStep({
  results,
  round,
  isSandboxRunning,
  onNewRound,
  onOrchestrate,
  onSelectWinner,
}: StrategyStepProps) {
  const independentTeams = useZelstromStore(s => s.independentTeams);
  const teamGenerations = useZelstromStore(s => s.teamGenerations);
  const evolutionMeta = useZelstromStore(s => s.evolutionMeta);
  const recordTeamGeneration = useZelstromStore(s => s.recordTeamGeneration);
  const runTeamCompetition = useZelstromStore(s => s.runTeamCompetition);
  const tournament = useZelstromStore(s => s.tournament);
  const startTournament = useZelstromStore(s => s.startTournament);
  const resetTournament = useZelstromStore(s => s.resetTournament);
  const objectives = useZelstromStore(s => s.objectives);
  const factorySettings = useZelstromStore(s => s.factorySettings);

  const teams = independentTeams;
  const winner = teams.find(t => t.isWinner);
  const hasServerTeams = teams.length > 0 && teams[0].proposals && teams[0].proposals.length > 0;

  // Record generation whenever new teams come in
  useEffect(() => {
    if (teams.length > 0 && round > 0) {
      recordTeamGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div className="space-y-5 animate-slide-in">
      <StepExplainer
        title="Step 2 — AI Teams Competing to Design Your Factory"
        description="Each team runs its own independent AI evolution with a different strategy bias. Teams compete with genuinely different strategies — not just weighted blends."
        detail="4 parallel server-side calls, each with unique bias (speed, cost, balanced, adaptive), independent stress tests, and separate LLM reasoning"
      />

      {/* Active Objectives Summary */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold font-mono text-foreground">Optimizing For</span>
          <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">ACTIVE</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Priority Weights */}
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-2">
            <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Priority Weights</p>
            <div className="space-y-1.5">
              {[
                { label: "Cost", value: objectives.weights.cost, icon: DollarSign, color: "text-emerald-400", bar: "bg-emerald-500" },
                { label: "Speed", value: objectives.weights.speed, icon: Zap, color: "text-amber-400", bar: "bg-amber-500" },
                { label: "Quality", value: objectives.weights.quality, icon: Shield, color: "text-violet-400", bar: "bg-violet-500" },
              ].map(w => (
                <div key={w.label} className="flex items-center gap-2">
                  <w.icon className={`w-3 h-3 ${w.color} shrink-0`} />
                  <span className="text-[9px] font-mono text-muted-foreground w-12">{w.label}</span>
                  <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${w.bar}`} style={{ width: `${w.value}%` }} />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-foreground w-8 text-right">{w.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* KPI Targets */}
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-2">
            <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">KPI Targets</p>
            {objectives.kpiTargets.length === 0 ? (
              <p className="text-[9px] font-mono text-muted-foreground/50 italic">No targets set</p>
            ) : (
              <div className="space-y-1">
                {objectives.kpiTargets.map(kpi => (
                  <div key={kpi.id} className="flex items-center gap-1.5 bg-background/50 rounded px-2 py-1">
                    <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[9px] font-mono text-foreground">{kpi.label}</span>
                    <span className="text-[9px] font-mono text-primary font-bold ml-auto">{kpi.operator} {kpi.value}{kpi.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Constraints & Factory */}
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-2">
            <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Constraints & Factory</p>
            <div className="space-y-1">
              {objectives.constraints.maxBudget > 0 && (
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Budget</span>
                  <span className="text-foreground font-bold">≤ ${objectives.constraints.maxBudget}</span>
                </div>
              )}
              {objectives.constraints.maxDefectRate > 0 && (
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Defects</span>
                  <span className="text-foreground font-bold">≤ {objectives.constraints.maxDefectRate}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-muted-foreground">Speed ×</span>
                <span className="text-foreground font-bold">{factorySettings.productionParams.speedMultiplier}x</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-muted-foreground">Cost/Unit</span>
                <span className="text-foreground font-bold">${factorySettings.productionParams.costPerUnit}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-muted-foreground">Machines</span>
                <span className="text-foreground font-bold">{factorySettings.machineTypes.filter(m => m.enabled).length} active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={onNewRound} disabled={isSandboxRunning} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            {isSandboxRunning ? "Generating..." : "Quick Round"}
          </Button>
          <Button onClick={runTeamCompetition} disabled={isSandboxRunning} size="sm" className="gap-1.5 font-mono text-xs">
            <Server className="w-3.5 h-3.5" />
            {isSandboxRunning ? "Teams Evolving..." : "Run Team Competition"}
          </Button>
          <Button onClick={onOrchestrate} disabled={isSandboxRunning} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <Brain className="w-3.5 h-3.5" />
            Orchestrate
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
              <Users className="w-3 h-3" />
              {teams.length} teams · {hasServerTeams ? "server-side" : "local"}
            </div>
          )}
          {winner && (
            <Button onClick={onSelectWinner} size="sm" className="gap-1.5 font-mono text-xs glow-cyan">
              <Rocket className="w-3.5 h-3.5" />
              Deploy {winner.name} →
            </Button>
          )}
        </div>
      </div>

      {/* Team cards grid */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team, i) => (
            <TeamCard key={team.id} team={team} rank={i} />
          ))}
        </div>
      )}

      {/* Tournament Mode */}
      <TournamentPanel
        tournament={tournament}
        isRunning={tournament.isRunning}
        onStart={startTournament}
        onReset={resetTournament}
      />

      {/* Evolution Intelligence */}
      <EvolutionInsightsPanel
        generations={teamGenerations}
        meta={evolutionMeta}
      />

      {/* Charts + Log */}
      {results.length > 0 && (
        <>
          <ResultsChart results={results} />
          <CompetitionLog results={results} round={round} />
        </>
      )}
    </div>
  );
}
