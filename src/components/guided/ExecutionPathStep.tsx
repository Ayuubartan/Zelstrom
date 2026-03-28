import { useEffect, useRef } from "react";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, ArrowRight, BarChart3, CheckCircle2, Loader2,
  Factory, Gauge, AlertTriangle, Settings2, Hash,
} from "lucide-react";
import { useZelstromStore } from "@/store/zelstromStore";

interface ExecutionPathStepProps {
  activePlan: import("@/store/zelstromStore").OrchestrationPlan | null;
  winnerName?: string;
  winnerScore?: number;
  onGoToResults?: () => void;
}

export function ExecutionPathStep({ activePlan, winnerName, winnerScore, onGoToResults }: ExecutionPathStepProps) {
  const name = activePlan?.deployedAgent?.agentName ?? winnerName ?? "—";
  const score = activePlan?.score ?? winnerScore ?? 0;

  const testRunCount = useZelstromStore(s => s.testRunCount);
  const maxTestRuns = useZelstromStore(s => s.maxTestRuns);
  const isProductionRunning = useZelstromStore(s => s.isProductionRunning);
  const runProduction = useZelstromStore(s => s.runProduction);
  const setMaxTestRuns = useZelstromStore(s => s.setMaxTestRuns);
  const pipelineResults = useZelstromStore(s => s.pipelineResults);
  const latestRun = pipelineResults.length > 0 ? pipelineResults[pipelineResults.length - 1] : null;

  const runsRemaining = maxTestRuns - testRunCount;
  const runProgress = maxTestRuns > 0 ? (testRunCount / maxTestRuns) * 100 : 0;
  const hasRunOnce = testRunCount > 0;

  // Auto-advance to results after first completed run
  const prevRunCount = useRef(testRunCount);
  useEffect(() => {
    if (testRunCount > prevRunCount.current && onGoToResults) {
      prevRunCount.current = testRunCount;
      // Small delay so user sees the completion
      const timer = setTimeout(onGoToResults, 800);
      return () => clearTimeout(timer);
    }
    prevRunCount.current = testRunCount;
  }, [testRunCount, onGoToResults]);

  return (
    <div className="space-y-5 animate-slide-in">
      <StepExplainer
        title="Step 3 — Run Production"
        description="Execute the deployed strategy against your factory. Each test run generates real metrics that feed back into the evolution engine."
        detail="Run → Measure → Track — results auto-advance to the feedback dashboard"
      />

      {/* Deployed Strategy Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Factory className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-bold text-primary truncate">{name}</p>
          <p className="text-[9px] font-mono text-muted-foreground">
            Deployed strategy · Score {score}/100
          </p>
        </div>
        <Badge variant="secondary" className="text-[8px] font-mono h-5 px-2 shrink-0">
          Ready
        </Badge>
      </div>

      {/* Test Run Controls */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold font-mono text-foreground">Test Run Control</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-mono text-muted-foreground flex items-center gap-1.5">
              <Settings2 className="w-3 h-3" />
              Max Runs
            </label>
            <select
              value={maxTestRuns}
              onChange={e => setMaxTestRuns(Number(e.target.value))}
              className="bg-secondary border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground"
            >
              {[5, 10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Run counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Runs Completed
            </span>
            <span className="text-foreground font-bold">{testRunCount} / {maxTestRuns}</span>
          </div>
          <Progress value={runProgress} className="h-2" />
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
            <span>{runsRemaining} remaining</span>
            {runsRemaining === 0 && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Limit reached
              </span>
            )}
          </div>
        </div>

        {/* Run button */}
        <Button
          onClick={runProduction}
          disabled={isProductionRunning || runsRemaining === 0}
          className="w-full gap-2 font-mono text-xs h-10 glow-cyan"
          size="lg"
        >
          {isProductionRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Production…
            </>
          ) : runsRemaining === 0 ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              Max Test Runs Reached
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Production Test #{testRunCount + 1}
            </>
          )}
        </Button>
      </div>

      {/* Latest Run Quick Stats */}
      {latestRun && hasRunOnce && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-mono text-foreground">Latest Run Results</span>
            <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
              Run #{testRunCount}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MiniStat label="Efficiency" value={`${latestRun.totals.overallEfficiency}%`} />
            <MiniStat label="Output" value={`${latestRun.totals.totalUnitsOut}`} />
            <MiniStat label="Defects" value={`${latestRun.totals.totalDefects}`} />
            <MiniStat label="Cost" value={`$${latestRun.totals.totalCost}`} />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground text-center">
            Auto-advancing to Track & Evolve…
          </p>
        </div>
      )}

      {/* Manual navigation */}
      {hasRunOnce && onGoToResults && (
        <div className="flex justify-center">
          <Button onClick={onGoToResults} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            View All Results & Feedback
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2 text-center">
      <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}
