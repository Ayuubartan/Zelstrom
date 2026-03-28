import { ABTest } from "@/lib/sdmf";
import { FlaskConical, Trophy, ArrowRight } from "lucide-react";

interface ABTestPanelProps {
  tests: ABTest[];
}

export function ABTestPanel({ tests }: ABTestPanelProps) {
  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FlaskConical className="w-6 h-6 text-muted-foreground/30 mb-2" />
        <p className="text-[10px] text-muted-foreground font-mono">Need 2+ generations for A/B testing</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tests.map(test => (
        <div key={test.id} className="border border-border rounded-lg p-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-foreground">{test.name}</span>
            {test.winner && (
              <span className="text-[9px] font-mono text-success flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Variant {test.winner} wins
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            {/* Variant A */}
            <div className={`p-2 rounded border text-center ${test.winner === 'A' ? 'border-success/30 bg-success/5' : 'border-border'}`}>
              <div className="text-[9px] font-mono font-bold text-foreground mb-1">A: {test.variantA.agentName}</div>
              <div className="text-[8px] font-mono text-muted-foreground space-y-0.5">
                <div>Throughput: <span className="text-primary">{test.metricsA.throughput}</span></div>
                <div>Cost: <span className="text-accent">${test.metricsA.cost}</span></div>
                <div>Defects: <span className="text-destructive">{test.metricsA.defects}</span></div>
              </div>
            </div>

            <ArrowRight className="w-3 h-3 text-muted-foreground rotate-0" />

            {/* Variant B */}
            <div className={`p-2 rounded border text-center ${test.winner === 'B' ? 'border-success/30 bg-success/5' : 'border-border'}`}>
              <div className="text-[9px] font-mono font-bold text-foreground mb-1">B: {test.variantB.agentName}</div>
              <div className="text-[8px] font-mono text-muted-foreground space-y-0.5">
                <div>Throughput: <span className="text-primary">{test.metricsB.throughput}</span></div>
                <div>Cost: <span className="text-accent">${test.metricsB.cost}</span></div>
                <div>Defects: <span className="text-destructive">{test.metricsB.defects}</span></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
