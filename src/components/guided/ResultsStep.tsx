import { useZelstromStore } from "@/store/zelstromStore";
import { StepExplainer } from "./StepExplainer";
import { PipelineFeedbackPanel } from "@/components/sdmf/PipelineFeedbackPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, Trophy, ArrowRight, RotateCcw,
  CheckCircle2, AlertTriangle, Zap, DollarSign, Activity,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ResultsStepProps {
  onBackToStrategy: () => void;
  onBackToDefine?: () => void;
}

export function ResultsStep({ onBackToStrategy, onBackToDefine }: ResultsStepProps) {
  const pipelineResults = useZelstromStore(s => s.pipelineResults);
  const independentTeams = useZelstromStore(s => s.independentTeams);
  const sdmf = useZelstromStore(s => s.sdmf);
  const tournament = useZelstromStore(s => s.tournament);
  const objectives = useZelstromStore(s => s.objectives);
  const activePlan = useZelstromStore(s => s.activePlan);

  const winner = independentTeams.find(t => t.isWinner);
  const deployedName = activePlan?.deployedAgent?.agentName ?? winner?.name ?? "—";
  const deployedScore = activePlan?.score ?? winner?.result.score ?? 0;

  // Compute aggregate stats from pipeline results
  const latestRun = pipelineResults.length > 0 ? pipelineResults[pipelineResults.length - 1] : null;
  const avgEfficiency = pipelineResults.length > 0
    ? Math.round(pipelineResults.reduce((s, r) => s + r.totals.overallEfficiency, 0) / pipelineResults.length)
    : 0;
  const totalUnits = pipelineResults.reduce((s, r) => s + r.totals.totalUnitsOut, 0);
  const totalDefects = pipelineResults.reduce((s, r) => s + r.totals.totalDefects, 0);
  const totalCost = pipelineResults.reduce((s, r) => s + r.totals.totalCost, 0);

  // KPI target checks
  const kpiResults = objectives.kpiTargets.map(kpi => {
    let actual = 0;
    if (latestRun) {
      if (kpi.metric === "cost") actual = latestRun.totals.totalCost;
      else if (kpi.metric === "throughput") actual = latestRun.totals.totalUnitsOut;
      else if (kpi.metric === "defectRate") actual = latestRun.totals.totalDefects;
      else if (kpi.metric === "score") actual = deployedScore;
    }
    let met = false;
    if (kpi.operator === "<") met = actual < kpi.value;
    else if (kpi.operator === ">") met = actual > kpi.value;
    else if (kpi.operator === "<=") met = actual <= kpi.value;
    else if (kpi.operator === ">=") met = actual >= kpi.value;
    else if (kpi.operator === "=") met = actual === kpi.value;
    return { ...kpi, actual, met };
  });

  const completedRounds = tournament.completedRounds.length;
  const champion = tournament.completedRounds.length > 0
    ? tournament.completedRounds[tournament.completedRounds.length - 1]?.teams
        .reduce((best, t) => t.result.score > best.result.score ? t : best)
    : null;

  return (
    <div className="space-y-5 animate-slide-in">
      <StepExplainer
        title="Step 4 — Track & Evolve"
        description="Review production outcomes, KPI compliance, and pipeline feedback. Results feed back into the evolution engine for continuous improvement."
        detail="Closed-loop system: Production data → Evolution engine → Better strategies → Repeat"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Trophy}
          label="Deployed Strategy"
          value={deployedName}
          sub={`Score: ${deployedScore}/100`}
          accent="text-primary"
        />
        <SummaryCard
          icon={Activity}
          label="Avg Efficiency"
          value={`${avgEfficiency}%`}
          sub={`${pipelineResults.length} run${pipelineResults.length !== 1 ? "s" : ""}`}
          accent="text-emerald-400"
        />
        <SummaryCard
          icon={Zap}
          label="Total Output"
          value={totalUnits.toLocaleString()}
          sub={`${totalDefects} defects`}
          accent="text-amber-400"
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Cost"
          value={`$${totalCost.toLocaleString()}`}
          sub={pipelineResults.length > 0 ? `$${Math.round(totalCost / pipelineResults.length)}/run avg` : "—"}
          accent="text-violet-400"
        />
      </div>

      {/* KPI Target Compliance */}
      {kpiResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold font-mono text-foreground">KPI Target Compliance</span>
            <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
              {kpiResults.filter(k => k.met).length}/{kpiResults.length} MET
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {kpiResults.map(kpi => (
              <div key={kpi.id} className={`flex items-center gap-2 rounded-md p-2.5 border ${kpi.met ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"}`}>
                {kpi.met
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono font-semibold text-foreground">{kpi.label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">
                    Target: {kpi.operator} {kpi.value}{kpi.unit} · Actual: {latestRun ? kpi.actual : "—"}
                  </p>
                </div>
                <Badge variant={kpi.met ? "secondary" : "destructive"} className="text-[7px] font-mono h-4 px-1.5 shrink-0">
                  {kpi.met ? "PASS" : "MISS"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament Summary */}
      {completedRounds > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono text-foreground">Tournament Summary</span>
            <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
              {completedRounds} rounds
            </Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tournament.completedRounds.map(round => {
              const sorted = [...round.teams].sort((a, b) => b.result.score - a.result.score);
              const roundWinner = sorted[0];
              return (
                <div key={round.roundNumber} className="bg-secondary/50 rounded-md p-2.5 min-w-[120px] shrink-0">
                  <p className="text-[8px] font-mono text-muted-foreground uppercase">Round {round.roundNumber}</p>
                  <p className="text-[10px] font-mono font-bold text-primary truncate">{roundWinner?.name}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{roundWinner?.result.score}/100</p>
                </div>
              );
            })}
          </div>
          {champion && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-bold text-primary">Champion: {champion.name}</p>
                <p className="text-[9px] font-mono text-muted-foreground">
                  Final score: {champion.result.score}/100 across {completedRounds} rounds
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution Summary */}
      {sdmf.generations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-mono text-foreground">Evolution Summary</span>
            <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
              Gen {sdmf.currentGeneration}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[8px] font-mono text-muted-foreground uppercase">Generations</p>
              <p className="text-lg font-mono font-bold text-foreground">{sdmf.generations.length}</p>
            </div>
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[8px] font-mono text-muted-foreground uppercase">Best Fitness</p>
              <p className="text-lg font-mono font-bold text-primary">
                {sdmf.generations.length > 0
                  ? Math.max(...sdmf.generations.map(g => g.fitnessScore)).toFixed(1)
                  : "—"}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[8px] font-mono text-muted-foreground uppercase">Active Agents</p>
              <p className="text-lg font-mono font-bold text-foreground">
                {sdmf.generations.length > 0
                  ? sdmf.generations[sdmf.generations.length - 1].proposals.length
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Runs */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold font-mono text-foreground">Pipeline Run History</span>
          <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
            {pipelineResults.length} runs
          </Badge>
        </div>
        <PipelineFeedbackPanel results={pipelineResults} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onBackToStrategy} className="gap-1.5 font-mono text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          Back to Strategies
        </Button>
        <Link to="/workflow">
          <Button size="sm" className="gap-1.5 font-mono text-xs glow-cyan">
            <ArrowRight className="w-3.5 h-3.5" />
            Run Another Pipeline
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType; label: string; value: string; sub: string; accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-mono font-bold text-foreground truncate">{value}</p>
      <p className="text-[9px] font-mono text-muted-foreground">{sub}</p>
    </div>
  );
}
