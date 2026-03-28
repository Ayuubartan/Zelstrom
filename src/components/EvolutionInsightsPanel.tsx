import { useMemo } from "react";
import {
  Brain, TrendingUp, Users, Skull, Dna, AlertTriangle,
  Trophy, Shield, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TeamGeneration, EvolutionMeta, TeamSnapshot } from "@/lib/team-evolution";

interface EvolutionInsightsPanelProps {
  generations: TeamGeneration[];
  meta: EvolutionMeta;
}

export function EvolutionInsightsPanel({ generations, meta }: EvolutionInsightsPanelProps) {
  const latestGen = generations[generations.length - 1];

  if (!latestGen) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 text-center">
        <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-mono text-muted-foreground">
          Run a generation to see evolution insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Evolution Intelligence</h3>
          <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
            Gen {latestGen.generationId}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
          <span>{meta.totalTeamsCreated} created</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{meta.totalTeamsRetired} retired</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{meta.totalMutations} mutations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Stats card */}
        <StatsCard latestGen={latestGen} meta={meta} />

        {/* Meta evaluation */}
        <MetaCard meta={meta} />

        {/* Retired teams */}
        <RetiredCard latestGen={latestGen} />
      </div>

      {/* Mutations log */}
      {latestGen.mutations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Dna className="w-3 h-3 text-primary" />
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              Mutations Applied (Gen {latestGen.generationId})
            </p>
          </div>
          <div className="space-y-1">
            {latestGen.mutations.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[9px] font-mono">
                {m.impact === "positive" && <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />}
                {m.impact === "negative" && <ArrowDownRight className="w-3 h-3 text-red-400 shrink-0" />}
                {m.impact === "neutral" && <Minus className="w-3 h-3 text-muted-foreground shrink-0" />}
                <span className="text-muted-foreground">{m.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation history timeline */}
      {generations.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-3 h-3 text-primary" />
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              Team History Across Generations
            </p>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {generations.map((gen) => (
                <div key={gen.generationId} className="flex flex-col gap-1 min-w-[100px]">
                  <p className="text-[8px] font-mono text-muted-foreground text-center mb-1">
                    Gen {gen.generationId}
                  </p>
                  {gen.teams.map(t => (
                    <div
                      key={t.teamId}
                      className={`rounded px-2 py-1 text-[8px] font-mono flex items-center justify-between gap-1 ${
                        t.status === "winner"
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : t.status === "survived"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-secondary/50 text-muted-foreground border border-transparent"
                      }`}
                    >
                      <span className="truncate">{t.teamName.replace("Team ", "")}</span>
                      <span>{t.score}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ latestGen, meta }: { latestGen: TeamGeneration; meta: EvolutionMeta }) {
  const winner = latestGen.teams.find(t => t.status === "winner");
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Trophy className="w-3 h-3 text-primary" />
        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Generation Stats</p>
      </div>
      <div className="space-y-2">
        <StatRow label="Teams Competed" value={`${latestGen.teams.length}`} />
        <StatRow label="Survived" value={`${latestGen.survivorIds.length}`} accent="emerald" />
        <StatRow label="Retired" value={`${latestGen.retiredIds.length}`} accent="red" />
        <StatRow label="Winner" value={winner?.teamName || "—"} accent="primary" />
        <StatRow label="Fitness Score" value={`${latestGen.fitnessScore}/100`} accent="primary" />
        {latestGen.improvementPct !== 0 && (
          <StatRow
            label="Improvement"
            value={`${latestGen.improvementPct > 0 ? "+" : ""}${latestGen.improvementPct}%`}
            accent={latestGen.improvementPct > 0 ? "emerald" : "red"}
          />
        )}
      </div>
    </div>
  );
}

function MetaCard({ meta }: { meta: EvolutionMeta }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-primary" />
        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">System Intelligence</p>
      </div>
      <div className="space-y-2">
        <StatRow label="Avg Improvement" value={`${meta.improvementRate > 0 ? "+" : ""}${meta.improvementRate}%/gen`} />
        <StatRow label="Diversity Score" value={`${meta.diversityScore}/100`} accent={meta.diversityScore < 20 ? "red" : undefined} />
        <StatRow
          label="Convergence Risk"
          value={meta.convergenceRisk.toUpperCase()}
          accent={meta.convergenceRisk === "high" ? "red" : meta.convergenceRisk === "medium" ? "amber" : "emerald"}
        />
        {meta.dominantTeam && (
          <StatRow label="Dominant" value={`${meta.dominantTeam.replace("team-", "").toUpperCase()} (×${meta.dominantStreak})`} />
        )}
      </div>
      {meta.convergenceRisk === "high" && (
        <div className="flex items-start gap-1.5 bg-red-500/10 rounded p-2">
          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[8px] font-mono text-red-400">
            High convergence risk — diversity is dropping. Consider injecting new team strategies.
          </p>
        </div>
      )}
    </div>
  );
}

function RetiredCard({ latestGen }: { latestGen: TeamGeneration }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Skull className="w-3 h-3 text-muted-foreground" />
        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Retired Teams</p>
      </div>
      {latestGen.retirementReasons.length === 0 ? (
        <p className="text-[9px] font-mono text-muted-foreground">No retirements this generation</p>
      ) : (
        <div className="space-y-3">
          {latestGen.retirementReasons.map(rr => (
            <div key={rr.teamId} className="space-y-1">
              <p className="text-[10px] font-mono font-semibold text-foreground">{rr.teamName}</p>
              {rr.reasons.map((reason, i) => (
                <p key={i} className="text-[9px] font-mono text-muted-foreground flex items-start gap-1.5">
                  <span className="text-red-400 shrink-0">✕</span> {reason}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const colorClass = accent === "emerald" ? "text-emerald-400"
    : accent === "red" ? "text-red-400"
    : accent === "amber" ? "text-amber-400"
    : accent === "primary" ? "text-primary"
    : "text-foreground";

  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
      <span className={`text-[9px] font-mono font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}
