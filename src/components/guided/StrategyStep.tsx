import { useMemo } from "react";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { TeamCard } from "@/components/TeamCard";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { RotateCcw, Rocket, Brain, Users } from "lucide-react";
import type { SimulationResult } from "@/lib/factory";
import { buildTeams } from "@/lib/teams";

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
  const teams = useMemo(() => buildTeams(results), [results]);
  const winner = teams.find(t => t.isWinner);

  return (
    <div className="space-y-5 animate-slide-in">
      <StepExplainer
        title="Step 2 — AI Teams Competing to Design Your Factory"
        description="Multiple AI teams — each with specialized roles — collaborate internally then compete against each other. The winning team's strategy becomes your factory blueprint."
        detail="Each team has a Strategy Lead, Cost Engineer, Throughput Engineer, and Systems Optimizer working together with different influence weights"
      />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={onNewRound} disabled={isSandboxRunning} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            {isSandboxRunning ? "Generating..." : "New Scenario"}
          </Button>
          <Button onClick={onOrchestrate} size="sm" className="gap-1.5 font-mono text-xs">
            <Brain className="w-3.5 h-3.5" />
            Orchestrate
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
              <Users className="w-3 h-3" />
              {teams.length} teams · {teams.length * 4} agents
            </div>
          )}
          {winner && (
            <Button onClick={onSelectWinner} size="sm" className="gap-1.5 font-mono text-xs glow-cyan">
              <Rocket className="w-3.5 h-3.5" />
              Deploy {winner.name} to Workflow →
            </Button>
          )}
        </div>
      </div>

      {/* Team cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((team, i) => (
          <TeamCard key={team.id} team={team} rank={i} />
        ))}
      </div>

      {/* Charts + Log (still use original results) */}
      <ResultsChart results={results} />
      <CompetitionLog results={results} round={round} />
    </div>
  );
}
