import { type PipelineRunResult } from "@/lib/feedback-bridge";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus, Clock, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface PipelineFeedbackPanelProps {
  results: PipelineRunResult[];
}

export function PipelineFeedbackPanel({ results }: PipelineFeedbackPanelProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-[10px] font-mono">
        No pipeline feedback yet.
        <br />
        Run a pipeline in the Workflow Builder.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r, i) => {
        const prev = i > 0 ? results[i - 1] : null;
        const effDelta = prev ? r.totals.overallEfficiency - prev.totals.overallEfficiency : 0;

        return (
          <div key={r.id} className="bg-secondary/40 border border-border rounded-lg p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-[10px] font-mono font-bold text-foreground">
                  Run #{results.length - i}
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">
                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                {new Date(r.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Source */}
            {r.deployedAgentName && (
              <Badge variant="outline" className="text-[9px] font-mono h-5 border-primary/30 text-primary">
                Gen {r.deployedGenerationId} · {r.deployedAgentName}
              </Badge>
            )}

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <MetricCell label="Yield" value={`${Math.round(r.totals.yieldRate * 100)}%`} />
              <MetricCell label="Efficiency" value={`${r.totals.overallEfficiency}%`} delta={effDelta} />
              <MetricCell label="Units Out" value={r.totals.totalUnitsOut.toString()} />
              <MetricCell label="Defects" value={r.totals.totalDefects.toString()} warn={r.totals.totalDefects > 5} />
              <MetricCell label="Total Cost" value={`$${r.totals.totalCost.toLocaleString()}`} />
              <MetricCell label="Utilization" value={`${r.totals.avgUtilization}%`} />
            </div>

            {/* Per-stage breakdown */}
            <div className="space-y-1 pt-1 border-t border-border/50">
              {r.stages.map((s) => (
                <div key={s.stageType} className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                  <span>{s.name}</span>
                  <span>
                    {s.metrics.unitsProcessed}u · {s.metrics.defectsFound}d · {s.metrics.utilization}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCell({ label, value, delta, warn }: { label: string; value: string; delta?: number; warn?: boolean }) {
  return (
    <div className="bg-background/50 rounded px-2 py-1">
      <div className="text-[8px] text-muted-foreground uppercase">{label}</div>
      <div className={`font-bold ${warn ? "text-destructive" : "text-foreground"}`}>
        {value}
        {delta !== undefined && delta !== 0 && (
          <span className={`ml-1 text-[8px] ${delta > 0 ? "text-success" : "text-destructive"}`}>
            {delta > 0 ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />}
            {Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}
