import { WorkflowOptimization } from "@/lib/workflow";
import { DollarSign, Zap, Scale, Brain, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const AGENT_ICONS: Record<string, React.ElementType> = {
  cost: DollarSign, speed: Zap, balanced: Scale, llm: Brain,
};

const AGENT_COLORS: Record<string, string> = {
  cost: "text-agent-cost border-agent-cost/30",
  speed: "text-agent-speed border-agent-speed/30",
  balanced: "text-agent-balanced border-agent-balanced/30",
  llm: "text-agent-llm border-agent-llm/30",
};

interface OptimizationPanelProps {
  optimizations: WorkflowOptimization[];
  onApply: (optimization: WorkflowOptimization) => void;
}

export function OptimizationPanel({ optimizations, onApply }: OptimizationPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
        Agent Recommendations
      </h3>
      {optimizations.map((opt, i) => {
        const Icon = AGENT_ICONS[opt.agentType] || Brain;
        const colorClass = AGENT_COLORS[opt.agentType] || "";

        return (
          <div
            key={opt.agentType}
            className={`bg-card border rounded-lg p-4 animate-slide-in ${colorClass.split(' ')[1]}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {i === 0 && <Trophy className="w-3.5 h-3.5 text-primary" />}
                <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                <span className="text-xs font-semibold text-foreground">{opt.agentName}</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary">{opt.score}/100</span>
            </div>

            <div className="flex gap-3 mb-3 text-[10px] font-mono">
              <span className="text-muted-foreground">
                Cost: <span className="text-accent">${Math.round(opt.projectedCost)}</span>
              </span>
              <span className="text-muted-foreground">
                Time: <span className="text-primary">{Math.round(opt.projectedTime)}m</span>
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              {opt.suggestions.slice(0, 3).map((s, si) => (
                <div key={si} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <ArrowRight className="w-2.5 h-2.5 mt-0.5 text-primary/60 shrink-0" />
                  <span>{s.reason}</span>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] font-mono h-7"
              onClick={() => onApply(opt)}
            >
              Apply {opt.suggestions.length} Changes
            </Button>
          </div>
        );
      })}
    </div>
  );
}
