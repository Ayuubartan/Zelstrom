import { useEffect, useState } from "react";
import { buildAgentLeaderboard, type AgentDNA } from "@/lib/evolution-engine";
import { Badge } from "@/components/ui/badge";
import { Crown, Skull, Swords, Dna, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";

interface AgentLeaderboardProps {
  /** Force refresh counter — increment to re-fetch leaderboard */
  refreshKey?: number;
}

const STATUS_STYLES: Record<AgentDNA['status'], { bg: string; text: string; icon: React.ElementType }> = {
  alpha: { bg: 'bg-success/15 border-success/30', text: 'text-success', icon: Crown },
  contender: { bg: 'bg-primary/10 border-primary/30', text: 'text-primary', icon: Swords },
  retired: { bg: 'bg-destructive/10 border-destructive/30', text: 'text-destructive', icon: Skull },
};

export function AgentLeaderboard({ refreshKey }: AgentLeaderboardProps) {
  const [agents, setAgents] = useState<AgentDNA[]>([]);

  useEffect(() => {
    setAgents(buildAgentLeaderboard());
  }, [refreshKey]);

  if (agents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-[10px] font-mono">
        No agent DNA recorded yet.
        <br />
        Deploy configs and run the pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map((agent, idx) => {
        const style = STATUS_STYLES[agent.status];
        const StatusIcon = style.icon;
        const hasFeedback = agent.deployments > 0 && agent.avgEfficiency > 0;

        return (
          <div
            key={agent.agentName}
            className={`rounded-lg border p-3 space-y-2 transition-all ${style.bg} ${
              idx === 0 ? 'ring-1 ring-success/20' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-3.5 h-3.5 ${style.text}`} />
                <span className="text-[11px] font-mono font-bold text-foreground">
                  {agent.agentName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 border-0 ${style.bg} ${style.text}`}>
                  {agent.status.toUpperCase()}
                </Badge>
                <span className="text-[8px] font-mono text-muted-foreground flex items-center gap-0.5">
                  <Dna className="w-2.5 h-2.5" />
                  v{agent.version}
                </span>
              </div>
            </div>

            {/* Fitness bar */}
            <div>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                <span>Bayesian Fitness</span>
                <span className={`font-bold ${style.text}`}>{agent.fitnessScore.toFixed(1)}</span>
              </div>
              <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    agent.status === 'alpha' ? 'bg-success' :
                    agent.status === 'contender' ? 'bg-primary' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(agent.fitnessScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Metrics grid */}
            {hasFeedback && (
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                <MetricPill
                  label="Yield"
                  value={`${(agent.avgYield * 100).toFixed(0)}%`}
                  good={agent.avgYield > 0.85}
                />
                <MetricPill
                  label="Efficiency"
                  value={`${agent.avgEfficiency.toFixed(0)}%`}
                  good={agent.avgEfficiency > 50}
                />
                <MetricPill
                  label="Avg Defects"
                  value={agent.avgDefects.toFixed(1)}
                  good={agent.avgDefects < 5}
                />
                <MetricPill
                  label="Avg Cost"
                  value={`$${agent.avgCost.toLocaleString()}`}
                  good={agent.avgCost < 5000}
                />
              </div>
            )}

            {/* Deployment stats */}
            <div className="flex justify-between text-[8px] font-mono text-muted-foreground uppercase pt-1 border-t border-border/30">
              <span>Deployments: <span className="text-foreground">{agent.deployments}</span></span>
              <span>Pipeline Runs: <span className="text-foreground">{agent.totalRuns}</span></span>
              <span>Rank: <span className={style.text}>#{agent.dominanceRank}</span></span>
            </div>

            {/* Battle-tested badge */}
            {agent.deployments >= 2 && agent.avgEfficiency > 50 && (
              <div className="flex items-center gap-1 text-[8px] font-mono text-success">
                <Zap className="w-3 h-3" />
                Battle-Tested · 1.5x Genetic Dominance
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricPill({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="bg-background/30 rounded px-2 py-1">
      <div className="text-[7px] text-muted-foreground uppercase">{label}</div>
      <div className={`font-bold flex items-center gap-0.5 ${good ? 'text-foreground' : 'text-destructive'}`}>
        {good ? <TrendingUp className="w-2.5 h-2.5 text-success" /> : <TrendingDown className="w-2.5 h-2.5 text-destructive" />}
        {value}
      </div>
    </div>
  );
}
