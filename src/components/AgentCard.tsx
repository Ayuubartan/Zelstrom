import { SimulationResult } from "@/lib/factory";
import { DollarSign, Zap, Scale, Brain, Trophy, Rocket, ChevronDown, ChevronUp, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useZelstromStore } from "@/store/zelstromStore";
import { toast } from "sonner";

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

const STRATEGY_LABELS: Record<string, string> = {
  cost: "Cost Optimizer",
  speed: "Speed Maximizer",
  balanced: "Balanced Strategist",
  llm: "AI Reasoner",
};

// Generate execution plan preview based on agent type and score
function generateExecutionPlan(result: SimulationResult) {
  const stageCount = result.agentType === "speed" ? 4 : result.agentType === "cost" ? 6 : 5;
  const bottleneckRisk = result.score > 70 ? "Low" : result.score > 50 ? "Medium" : "High";
  const failureRisk = result.agentType === "speed" ? "Medium" : result.agentType === "cost" ? "Low" : "Low";

  const allocations = result.assignments.slice(0, 3).map(a => 
    `${a.jobId.replace('job-', 'J')} → ${a.machineId.replace('machine-', 'M')}`
  );

  return { stageCount, bottleneckRisk, failureRisk, allocations };
}

// Generate winning reason based on metrics
function generateWinReason(result: SimulationResult, allResults: SimulationResult[]) {
  const reasons: string[] = [];
  
  const lowestCost = Math.min(...allResults.map(r => r.totalCost));
  const fastestTime = Math.min(...allResults.map(r => r.totalTime));
  const highestThroughput = Math.max(...allResults.map(r => r.throughput));

  if (result.totalCost === lowestCost) reasons.push("Lowest operational cost");
  if (result.totalTime === fastestTime) reasons.push("Fastest execution time");
  if (result.throughput === highestThroughput) reasons.push("Highest throughput");
  
  if (result.score > 75) reasons.push("Superior cost/time balance");
  if (result.throughput > 1.5) reasons.push("High throughput per dollar");
  
  if (reasons.length === 0) reasons.push("Best overall fitness score");
  
  return reasons;
}

interface AgentCardProps {
  result: SimulationResult;
  rank: number;
  isWinner: boolean;
  allResults?: SimulationResult[];
}

export function AgentCard({ result, rank, isWinner, allResults = [] }: AgentCardProps) {
  const Icon = ICONS[result.agentType] || Brain;
  const [expanded, setExpanded] = useState(isWinner);
  const navigate = useNavigate();
  const deployFromSandbox = useZelstromStore(s => s.deployFromSandbox);

  const plan = generateExecutionPlan(result);
  const winReasons = isWinner ? generateWinReason(result, allResults) : [];

  const handleDeploy = () => {
    deployFromSandbox(result);
    toast.success(`Deployed "${result.agentName}" strategy to Workflow Builder`);
    navigate("/workflow");
  };

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

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-md bg-secondary ${AGENT_TEXT[result.agentType]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${AGENT_TEXT[result.agentType]}`}>
            {result.agentName}
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground">
            {STRATEGY_LABELS[result.agentType]} · Rank #{rank + 1}
          </p>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Stat label="Score" value={result.score} unit="/100" highlight />
        <Stat label="Cost" value={`$${result.totalCost}`} />
        <Stat label="Time" value={`${result.totalTime}m`} />
        <Stat label="Throughput" value={result.throughput} unit="j/m" />
      </div>

      {/* Why This Won — only for winner */}
      {isWinner && winReasons.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-3">
          <p className="text-[9px] font-mono uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Why This Won
          </p>
          <ul className="space-y-0.5">
            {winReasons.map((reason, i) => (
              <li key={i} className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable execution plan */}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between text-[9px] font-mono text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors py-1"
      >
        <span>Execution Plan Preview</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 animate-slide-in">
          <div className="bg-secondary/50 rounded-md p-2.5 space-y-1.5">
            <PlanRow label="Machine Allocation" value={plan.allocations.join(", ")} />
            <PlanRow label="Pipeline Stages" value={`${plan.stageCount} stages`} />
            <PlanRow label="Bottleneck Risk" value={plan.bottleneckRisk} warn={plan.bottleneckRisk !== "Low"} />
            <PlanRow label="Failure Risk" value={plan.failureRisk} warn={plan.failureRisk !== "Low"} />
          </div>

          {/* Flow visualization */}
          <div className="flex items-center justify-center gap-1 py-2">
            {["Strategy", "Pipeline", "Execution", "Feedback"].map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`px-2 py-1 rounded text-[8px] font-mono ${i === 0 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {step}
                </div>
                {i < 3 && <span className="text-muted-foreground/50 text-[10px]">→</span>}
              </div>
            ))}
          </div>

          {/* Deploy button */}
          <Button 
            size="sm" 
            onClick={handleDeploy}
            className="w-full gap-1.5 font-mono text-[10px] h-8 glow-cyan"
          >
            <Rocket className="w-3 h-3" />
            Deploy to Workflow
          </Button>
        </div>
      )}
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

function PlanRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
      <span className={`text-[9px] font-mono ${warn ? "text-amber-400" : "text-foreground"}`}>
        {warn && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
        {value}
      </span>
    </div>
  );
}
