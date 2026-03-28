import { Brain, DollarSign, Zap, Scale, ArrowDown } from "lucide-react";
import type { RoleContribution } from "@/lib/teams";

const ROLE_ICONS: Record<string, React.ElementType> = {
  Brain, DollarSign, Zap, Scale,
};

interface TeamOrgChartProps {
  roles: RoleContribution[];
  accent: string;
}

export function TeamOrgChart({ roles, accent }: TeamOrgChartProps) {
  const lead = roles.find(r => r.role === "strategy-lead");
  const engineers = roles.filter(r => r.role === "cost-engineer" || r.role === "throughput-engineer");
  const optimizer = roles.find(r => r.role === "systems-optimizer");

  return (
    <div className="bg-secondary/50 rounded-md p-4">
      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-4 text-center">
        Team Organization & Decision Flow
      </p>

      <div className="flex flex-col items-center gap-0">
        {/* Strategy Lead — top of hierarchy */}
        {lead && <OrgNode role={lead} accent={accent} isTop />}

        {/* Animated arrow down */}
        <AnimatedArrow label="Delegates tasks" />

        {/* Engineers — middle layer, side by side */}
        <div className="flex items-start gap-6 relative">
          {/* Horizontal connector line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] h-px bg-border" />
          {/* Flow particles on horizontal line */}
          <div className="absolute top-0 left-[24px] w-[calc(100%-48px)] h-px overflow-hidden">
            <div className="org-particle-h bg-primary" />
          </div>

          {engineers.map(eng => (
            <div key={eng.role} className="flex flex-col items-center">
              <div className="w-px h-3 bg-border relative overflow-hidden">
                <div className="org-particle-v bg-primary" />
              </div>
              <OrgNode role={eng} accent={accent} />
            </div>
          ))}
        </div>

        {/* Animated arrows converging */}
        <AnimatedArrow label="Submit optimized plans" />

        {/* Systems Optimizer — bottom, validates */}
        {optimizer && <OrgNode role={optimizer} accent={accent} />}

        {/* Final output */}
        <AnimatedArrow label="Final plan" isFinal />

        <div className={`px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-[9px] font-mono ${accent} glow-cyan`}>
          ✓ Merged Strategy Output
        </div>
      </div>
    </div>
  );
}

function OrgNode({ role, accent, isTop }: { role: RoleContribution; accent: string; isTop?: boolean }) {
  const Icon = ROLE_ICONS[role.icon] || Brain;
  return (
    <div className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-300 ${
      isTop
        ? "bg-primary/10 border-primary/30 glow-cyan"
        : "bg-card border-border hover:border-primary/20"
    }`}>
      <div className={`p-1.5 rounded-md ${isTop ? "bg-primary/20" : "bg-secondary"}`}>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <span className="text-[9px] font-mono font-semibold text-foreground whitespace-nowrap">{role.label}</span>
      <span className="text-[8px] font-mono text-muted-foreground whitespace-nowrap max-w-[120px] truncate">
        {Math.round(role.influenceWeight * 100)}% influence
      </span>
      {/* Pulse ring on top node */}
      {isTop && (
        <div className="absolute -inset-px rounded-lg border border-primary/20 animate-[pulse_3s_ease-in-out_infinite]" />
      )}
    </div>
  );
}

function AnimatedArrow({ label, isFinal }: { label: string; isFinal?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0 my-1">
      <div className="relative w-px h-6 bg-border overflow-hidden">
        {/* Flowing particle */}
        <div className="org-particle-v bg-primary" />
      </div>
      <ArrowDown className={`w-3 h-3 ${isFinal ? "text-primary" : "text-muted-foreground"} org-arrow-bounce`} />
      <span className="text-[7px] font-mono text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}
