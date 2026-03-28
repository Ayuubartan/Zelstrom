import { SimulationResult } from "@/lib/factory";
import { DollarSign, Zap, Scale, Brain, Trophy } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  cost: DollarSign,
  speed: Zap,
  balanced: Scale,
  llm: Brain,
};

const AGENT_STYLES: Record<string, string> = {
  cost: "border-agent-cost/30 hover:border-agent-cost/60",
  speed: "border-agent-speed/30 hover:border-agent-speed/60",
  balanced: "border-agent-balanced/30 hover:border-agent-balanced/60",
  llm: "border-agent-llm/30 hover:border-agent-llm/60",
};

const AGENT_TEXT: Record<string, string> = {
  cost: "text-agent-cost",
  speed: "text-agent-speed",
  balanced: "text-agent-balanced",
  llm: "text-agent-llm",
};

const DESCRIPTIONS: Record<string, string> = {
  cost: "Minimizes total operational cost by selecting the cheapest resources",
  speed: "Maximizes throughput by prioritizing the fastest machines",
  balanced: "Uses efficiency heuristics to balance cost and speed",
  llm: "Priority-weighted decisions simulating AI reasoning",
};

interface AgentCardProps {
  result: SimulationResult;
  rank: number;
  isWinner: boolean;
}

export function AgentCard({ result, rank, isWinner }: AgentCardProps) {
  const Icon = ICONS[result.agentType] || Brain;

  return (
    <div
      className={`relative bg-card border rounded-lg p-5 transition-all duration-300 animate-slide-in ${AGENT_STYLES[result.agentType]} ${isWinner ? "ring-1 ring-primary/40 glow-cyan" : ""}`}
      style={{ animationDelay: `${rank * 100}ms` }}
    >
      {isWinner && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-1.5">
          <Trophy className="w-4 h-4" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-md bg-secondary ${AGENT_TEXT[result.agentType]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-semibold text-sm ${AGENT_TEXT[result.agentType]}`}>
            {result.agentName}
          </h3>
          <p className="text-xs text-muted-foreground">Rank #{rank + 1}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{DESCRIPTIONS[result.agentType]}</p>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Score" value={result.score} unit="/100" highlight />
        <Stat label="Cost" value={`$${result.totalCost}`} />
        <Stat label="Time" value={`${result.totalTime}m`} />
        <Stat label="Throughput" value={result.throughput} unit="j/m" />
      </div>
    </div>
  );
}

function Stat({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: boolean }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
      <p className={`text-sm font-mono font-semibold ${highlight ? "text-primary text-glow-cyan" : "text-foreground"}`}>
        {value}
        {unit && <span className="text-muted-foreground text-[10px] ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
