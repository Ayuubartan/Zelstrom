import { type OrchestrationPlan, type Strategy } from "@/store/zelstromStore";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, Minus, Clock, Target, Layers } from "lucide-react";
import { useMemo } from "react";

interface DecisionMemoryPanelProps {
  plans: OrchestrationPlan[];
}

const STRATEGY_LABELS: Record<Strategy, { label: string; color: string }> = {
  "minimize-cost": { label: "Min Cost", color: "text-success" },
  "maximize-speed": { label: "Max Speed", color: "text-accent" },
  "balanced": { label: "Balanced", color: "text-primary" },
  "adaptive": { label: "Adaptive", color: "text-foreground" },
};

export function DecisionMemoryPanel({ plans }: DecisionMemoryPanelProps) {
  // Compute strategy performance insights
  const insights = useMemo(() => {
    const byStrategy: Record<string, { scores: number[]; scenarios: Set<string> }> = {};
    const byScenario: Record<string, { strategy: string; score: number }[]> = {};

    plans.forEach(p => {
      if (!byStrategy[p.strategy]) byStrategy[p.strategy] = { scores: [], scenarios: new Set() };
      byStrategy[p.strategy].scores.push(p.score);
      byStrategy[p.strategy].scenarios.add(p.scenarioId);

      if (!byScenario[p.scenarioId]) byScenario[p.scenarioId] = [];
      byScenario[p.scenarioId].push({ strategy: p.strategy, score: p.score });
    });

    // Best strategy overall
    const strategyAvgs = Object.entries(byStrategy).map(([s, data]) => ({
      strategy: s as Strategy,
      avg: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.scores.length,
      scenarios: data.scenarios.size,
    }));
    strategyAvgs.sort((a, b) => b.avg - a.avg);

    // Best strategy per scenario
    const scenarioBest: Record<string, { strategy: string; avg: number }> = {};
    Object.entries(byScenario).forEach(([scId, runs]) => {
      const grouped: Record<string, number[]> = {};
      runs.forEach(r => {
        if (!grouped[r.strategy]) grouped[r.strategy] = [];
        grouped[r.strategy].push(r.score);
      });
      let best = { strategy: "", avg: 0 };
      Object.entries(grouped).forEach(([s, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > best.avg) best = { strategy: s, avg };
      });
      scenarioBest[scId] = best;
    });

    return { strategyAvgs, scenarioBest };
  }, [plans]);

  if (plans.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-[10px] font-mono">
        No decisions recorded yet.
        <br />
        Use Orchestrate to build decision history.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Strategy performance summary */}
      {insights.strategyAvgs.length > 0 && (
        <div className="bg-card/80 border border-border rounded-lg p-3 space-y-2">
          <h4 className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3 h-3 text-primary" />
            Strategy Ranking (by avg score)
          </h4>
          <div className="space-y-1.5">
            {insights.strategyAvgs.map((s, i) => {
              const info = STRATEGY_LABELS[s.strategy];
              return (
                <div key={s.strategy} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold ${i === 0 ? info.color : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <span className={`text-[9px] font-mono ${info.color}`}>{info.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-muted-foreground">{s.count} runs · {s.scenarios} scenarios</span>
                    <Badge variant="outline" className={`text-[8px] h-4 px-1.5 font-mono ${i === 0 ? "border-success/30 text-success" : "border-border"}`}>
                      {s.avg.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best strategy per scenario */}
      {Object.keys(insights.scenarioBest).length > 1 && (
        <div className="bg-card/80 border border-border rounded-lg p-3 space-y-2">
          <h4 className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-accent" />
            Best Strategy by Scenario
          </h4>
          <div className="space-y-1">
            {Object.entries(insights.scenarioBest).map(([scId, best]) => {
              const info = STRATEGY_LABELS[best.strategy as Strategy] || { label: best.strategy, color: "text-foreground" };
              return (
                <div key={scId} className="flex items-center justify-between text-[8px] font-mono">
                  <span className="text-muted-foreground">{scId}</span>
                  <span className={info.color}>{info.label} ({best.avg.toFixed(0)})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan history */}
      {[...plans].reverse().map((plan, idx) => {
        const info = STRATEGY_LABELS[plan.strategy];
        const prevPlan = plans[plans.length - 1 - idx - 1];
        const scoreDelta = prevPlan ? plan.score - prevPlan.score : 0;
        const timeAgo = formatTimeAgo(plan.timestamp);

        return (
          <div
            key={plan.id}
            className={`border rounded-lg p-3 space-y-1.5 transition-all ${
              idx === 0 ? "border-primary/20 bg-primary/5" : "border-border bg-card/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className={`w-3 h-3 ${info.color}`} />
                <span className={`text-[9px] font-mono font-bold ${info.color}`}>{info.label}</span>
                {idx === 0 && (
                  <Badge className="text-[7px] h-3.5 px-1 bg-primary/20 text-primary border-0">LATEST</Badge>
                )}
              </div>
              <span className="text-[8px] font-mono text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-muted-foreground">{plan.scenarioId}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-foreground">{plan.score}</span>
                {scoreDelta !== 0 && (
                  <span className={`text-[8px] font-mono flex items-center ${scoreDelta > 0 ? "text-success" : "text-destructive"}`}>
                    {scoreDelta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                  </span>
                )}
                {scoreDelta === 0 && prevPlan && (
                  <Minus className="w-2.5 h-2.5 text-muted-foreground" />
                )}
              </div>
            </div>

            {plan.deployedAgent && (
              <div className="text-[8px] font-mono text-muted-foreground">
                Winner: <span className="text-foreground">{plan.deployedAgent.agentName}</span>
                {" · "}T:{plan.deployedAgent.projectedThroughput} · $:{plan.deployedAgent.projectedCost}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
