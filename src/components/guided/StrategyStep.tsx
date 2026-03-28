import { useEffect } from "react";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { TeamCard } from "@/components/TeamCard";
import { EvolutionInsightsPanel } from "@/components/EvolutionInsightsPanel";
import { TournamentPanel } from "@/components/TournamentPanel";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { RotateCcw, Rocket, Brain, Users, Server } from "lucide-react";
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
