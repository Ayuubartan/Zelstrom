import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useZelstromStore } from "@/store/zelstromStore";
import { toast } from "sonner";
import type { AITeam } from "@/lib/teams";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamOrgChart } from "@/components/TeamOrgChart";
import { TeamDocPanel } from "@/components/TeamDocPanel";
import {
  Trophy, Rocket, ChevronDown, ChevronUp,
  Brain, DollarSign, Zap, Scale,
  CheckCircle2, XCircle,
} from "lucide-react";
import type { KPITarget } from "@/lib/objectives";

const ROLE_ICONS: Record<string, React.ElementType> = {
  Brain, DollarSign, Zap, Scale,
};

const TEAM_COLORS: Record<string, string> = {
  "team-alpha": "border-primary/30 hover:border-primary/60",
  "team-sigma": "border-emerald-500/30 hover:border-emerald-500/60",
  "team-omega": "border-violet-500/30 hover:border-violet-500/60",
  "team-nova": "border-amber-500/30 hover:border-amber-500/60",
};

const TEAM_ACCENT: Record<string, string> = {
  "team-alpha": "text-primary",
  "team-sigma": "text-emerald-400",
  "team-omega": "text-violet-400",
  "team-nova": "text-amber-400",
};

function getActualValue(metric: KPITarget["metric"], result: { totalCost: number; throughput: number; totalTime: number; score: number }) {
  switch (metric) {
    case "cost": return result.totalCost;
    case "throughput": return result.throughput;
    case "time": return result.totalTime;
    case "score": return result.score;
    case "defectRate": return 0; // not tracked per-team yet
  }
}

function evaluateKPIs(targets: KPITarget[], result: { totalCost: number; throughput: number; totalTime: number; score: number }) {
  return targets.map(kpi => {
    const actual = getActualValue(kpi.metric, result);
    let passed = false;
    switch (kpi.operator) {
      case "<": passed = actual < kpi.value; break;
      case ">": passed = actual > kpi.value; break;
      case "<=": passed = actual <= kpi.value; break;
      case ">=": passed = actual >= kpi.value; break;
      case "=": passed = actual === kpi.value; break;
    }
    return { ...kpi, actual, passed };
  });
}

export function TeamCard({ team, rank }: { team: AITeam; rank: number }) {
  const [expanded, setExpanded] = useState(team.isWinner);
  const navigate = useNavigate();
  const deployFromSandbox = useZelstromStore(s => s.deployFromSandbox);
  const tournament = useZelstromStore(s => s.tournament);
  const teamNotes = useZelstromStore(s => s.teamNotes);
  const setTeamNote = useZelstromStore(s => s.setTeamNote);
  const kpiTargets = useZelstromStore(s => s.objectives.kpiTargets);
  const accent = TEAM_ACCENT[team.id] || "text-primary";
  const border = TEAM_COLORS[team.id] || "border-border";

  const kpiResults = evaluateKPIs(kpiTargets, team.result);

  const handleDeploy = () => {
    deployFromSandbox(team.result);
    toast.success(`Deployed "${team.name}" strategy to Workflow Builder`);
    navigate("/workflow");
  };

  return (
    <div
      className={`relative bg-card border rounded-lg p-5 transition-all duration-300 animate-slide-in ${border} ${
        team.isWinner ? "ring-1 ring-primary/40 glow-cyan" : ""
      }`}
      style={{ animationDelay: `${rank * 120}ms` }}
    >
      {team.isWinner && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-1.5">
          <Trophy className="w-4 h-4" />
        </div>
      )}

      {/* Team Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={`font-bold text-sm ${accent}`}>{team.name}</h3>
          <p className="text-[10px] font-mono text-muted-foreground">
            {team.philosophy}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-mono font-bold ${accent}`}>
            {team.result.score}<span className="text-[10px] text-muted-foreground">/100</span>
          </p>
          <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
            Rank #{rank + 1}
          </Badge>
        </div>
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {team.roles.map(role => {
          const Icon = ROLE_ICONS[role.icon] || Brain;
          return (
            <div key={role.role} className="bg-secondary/50 rounded-md p-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${accent}`} />
                <span className="text-[9px] font-mono font-semibold text-foreground">{role.label}</span>
              </div>
              <p className="text-[8px] font-mono text-muted-foreground leading-tight">{role.focus}</p>
            </div>
          );
        })}
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Cost" value={`$${team.result.totalCost}`} />
        <Stat label="Time" value={`${team.result.totalTime}m`} />
        <Stat label="Throughput" value={team.result.throughput} unit="j/m" />
      </div>

      {/* Winner reasoning */}
      {team.isWinner && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-3">
          <p className="text-[9px] font-mono uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Why This Team Won
          </p>
          <ul className="space-y-0.5">
            {team.reasoning.slice(0, 3).map((r, i) => (
              <li key={i} className="text-[10px] font-mono text-muted-foreground flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary shrink-0 mt-1" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[9px] font-mono text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors py-1"
      >
        <span>Team Reasoning & Decision Flow</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 animate-slide-in">
          {/* Internal reasoning */}
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Team Reasoning</p>
            {team.reasoning.map((r, i) => (
              <p key={i} className="text-[9px] font-mono text-muted-foreground flex items-start gap-1.5">
                <span className={`text-[8px] ${accent}`}>›</span> {r}
              </p>
            ))}
          </div>

          {/* Team Documentation */}
          <TeamDocPanel
            team={team}
            accent={accent}
            tournamentRounds={tournament.completedRounds}
            savedNotes={teamNotes[team.id] || ""}
            onSaveNotes={setTeamNote}
          />

          {/* Visual org chart */}
          <TeamOrgChart roles={team.roles} accent={accent} />

          {/* Role suggestions */}
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-1.5">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Role Contributions</p>
            {team.roles.map(role => {
              const Icon = ROLE_ICONS[role.icon] || Brain;
              return (
                <div key={role.role} className="flex items-start gap-2">
                  <Icon className={`w-3 h-3 mt-0.5 ${accent} shrink-0`} />
                  <div>
                    <span className="text-[9px] font-mono font-semibold text-foreground">{role.label}: </span>
                    <span className="text-[9px] font-mono text-muted-foreground">{role.suggestion}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deploy */}
          <Button
            size="sm"
            onClick={handleDeploy}
            className="w-full gap-1.5 font-mono text-[10px] h-8 glow-cyan"
          >
            <Rocket className="w-3 h-3" />
            Deploy Team Strategy to Workflow
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
      <p className="text-sm font-mono font-semibold text-foreground">
        {value}
        {unit && <span className="text-muted-foreground text-[10px] ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
