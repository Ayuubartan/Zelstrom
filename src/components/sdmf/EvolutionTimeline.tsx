import { EvolutionGeneration } from "@/lib/sdmf";
import { Skull, Crown, Shield, Swords, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EvolutionTimelineProps {
  generations: EvolutionGeneration[];
}

export function EvolutionTimeline({ generations }: EvolutionTimelineProps) {
  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Swords className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-xs text-muted-foreground font-mono">No evolution cycles yet</p>
        <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">Run adversarial simulation to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {generations.map((gen, gi) => {
        const isLatest = gi === generations.length - 1;
        const ImprovementIcon = gen.improvement > 0 ? TrendingUp : gen.improvement < 0 ? TrendingDown : Minus;
        const improvementColor = gen.improvement > 0 ? 'text-success' : gen.improvement < 0 ? 'text-destructive' : 'text-muted-foreground';

        return (
          <div
            key={gen.id}
            className={`border rounded-lg p-3 transition-colors ${
              isLatest ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            {/* Gen header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  GEN {gen.id}
                </span>
                <div className={`flex items-center gap-1 text-[10px] font-mono ${improvementColor}`}>
                  <ImprovementIcon className="w-3 h-3" />
                  {gen.improvement > 0 ? '+' : ''}{gen.improvement}%
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary font-bold">
                Fitness: {gen.fitnessScore}/100
              </span>
            </div>

            {/* Proposals lineage */}
            <div className="space-y-1">
              {gen.proposals.map((prop) => {
                const isSurvivor = gen.survivor?.id === prop.id;
                return (
                  <div
                    key={prop.id}
                    className={`flex items-center gap-2 text-[10px] font-mono px-2 py-1.5 rounded ${
                      isSurvivor
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-destructive/5 border border-destructive/10'
                    }`}
                  >
                    {isSurvivor ? (
                      <Crown className="w-3 h-3 text-success shrink-0" />
                    ) : (
                      <Skull className="w-3 h-3 text-destructive/50 shrink-0" />
                    )}
                    <span className={`font-semibold ${isSurvivor ? 'text-success' : 'text-muted-foreground line-through'}`}>
                      {prop.agentName}
                    </span>
                    <span className="text-muted-foreground ml-auto">{prop.score}pts</span>
                    <span className="text-muted-foreground/60">T:{prop.projectedThroughput}</span>
                    <span className="text-muted-foreground/60">$:{prop.projectedCost}</span>
                  </div>
                );
              })}
            </div>

            {/* Attacks summary */}
            <div className="mt-2 flex items-start gap-1.5">
              <Shield className="w-3 h-3 text-destructive/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {gen.attacks.slice(0, 4).map((atk, ai) => (
                  <span
                    key={ai}
                    className="text-[8px] font-mono bg-destructive/10 text-destructive/80 px-1.5 py-0.5 rounded"
                  >
                    {atk.type} (sev:{atk.severity})
                  </span>
                ))}
                {gen.attacks.length > 4 && (
                  <span className="text-[8px] font-mono text-muted-foreground">
                    +{gen.attacks.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Survivor reasoning */}
            {gen.survivor && (
              <p className="text-[9px] text-muted-foreground mt-2 italic leading-relaxed">
                "{gen.survivor.reasoning}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
