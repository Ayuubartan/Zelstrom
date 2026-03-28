import { motion } from "framer-motion";
import { AgentCard } from "@/components/AgentCard";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { RotateCcw, Rocket, Brain } from "lucide-react";
import type { SimulationResult } from "@/lib/factory";

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
  const winner = results[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <StepExplainer
        title="Step 2 — AI Strategy Generation"
        description="Multiple AI agents generate competing production strategies. Each represents a different way your factory could operate."
        detail="Agents are stress-tested, scored by Bayesian fitness, and ranked by cost/speed/throughput tradeoffs"
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
        {winner && (
          <Button onClick={onSelectWinner} size="sm" className="gap-1.5 font-mono text-xs glow-cyan">
            <Rocket className="w-3.5 h-3.5" />
            Deploy Winner to Workflow →
          </Button>
        )}
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map((r, i) => (
          <motion.div
            key={r.agentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <AgentCard result={r} rank={i} isWinner={i === 0} allResults={results} />
          </motion.div>
        ))}
      </div>

      {/* Charts + Log */}
      <ResultsChart results={results} />
      <CompetitionLog results={results} round={round} />
    </motion.div>
  );
}
