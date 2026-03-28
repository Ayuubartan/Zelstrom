import { useZelstromStore } from "@/store/zelstromStore";
import { Globe, Brain, Cpu, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

interface NodeProps {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  active: boolean;
  metrics: string[];
  position: "left" | "center" | "right";
  color: string;
}

function DiagramNode({ label, sublabel, icon: Icon, active, metrics, color }: NodeProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      {/* Glow ring */}
      <div
        className={`relative w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-700 ${
          active
            ? `border-${color} bg-${color}/10 shadow-[0_0_20px_hsl(var(--${color})/0.3)]`
            : "border-border bg-card/50"
        }`}
      >
        {active && (
          <div className={`absolute inset-0 rounded-xl animate-pulse bg-${color}/5`} />
        )}
        <Icon className={`w-6 h-6 ${active ? `text-${color}` : "text-muted-foreground"}`} />
        {/* Status dot */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
          active ? "bg-success" : "bg-muted-foreground/30"
        }`}>
          {active && <div className="absolute inset-0.5 rounded-full bg-success animate-ping opacity-50" />}
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold text-foreground tracking-wide">{label}</span>
      <span className="text-[8px] font-mono text-muted-foreground">{sublabel}</span>
      {/* Metrics */}
      <div className="flex flex-col items-center gap-0.5 mt-1">
        {metrics.map((m, i) => (
          <span key={i} className="text-[8px] font-mono text-muted-foreground/70">{m}</span>
        ))}
      </div>
    </div>
  );
}

function AnimatedConnector({ active, label, reverse }: { active: boolean; label: string; reverse?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 mx-2 flex-1">
      <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="relative w-full h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 bg-border rounded-full overflow-hidden">
          {active && (
            <div
              className={`absolute h-full w-8 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent ${
                reverse ? "animate-[flowReverse_1.5s_linear_infinite]" : "animate-[flowForward_1.5s_linear_infinite]"
              }`}
            />
          )}
        </div>
        {/* Particles */}
        {active && (
          <>
            <div
              className={`absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] ${
                reverse ? "animate-[particleReverse_2s_ease-in-out_infinite]" : "animate-[particleForward_2s_ease-in-out_infinite]"
              }`}
            />
            <div
              className={`absolute w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_6px_hsl(var(--primary)/0.4)] ${
                reverse
                  ? "animate-[particleReverse_2s_ease-in-out_infinite_0.7s]"
                  : "animate-[particleForward_2s_ease-in-out_infinite_0.7s]"
              }`}
            />
          </>
        )}
        {/* Arrows */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
          {reverse ? (
            <polygon points="8,12 14,8 14,16" fill={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)"} />
          ) : (
            <polygon points="92,12 86,8 86,16" fill={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)"} />
          )}
        </svg>
      </div>
    </div>
  );
}

export function SystemDiagram() {
  const scenario = useZelstromStore(s => s.scenario);
  const sdmf = useZelstromStore(s => s.sdmf);
  const pipelineResults = useZelstromStore(s => s.pipelineResults);
  const activePlan = useZelstromStore(s => s.activePlan);
  const strategy = useZelstromStore(s => s.strategy);

  const health = useZelstromStore(s => s.getSystemHealth)();

  const worldMetrics = scenario
    ? [`${scenario.jobs.length} jobs · ${scenario.machines.length} machines`, `Budget: $${scenario.maxBudget}`]
    : ["No scenario"];

  const brainMetrics = sdmf.generations.length > 0
    ? [`Gen ${sdmf.currentGeneration} · ${strategy}`, `Score: ${sdmf.overallScore}/100`]
    : ["Idle"];

  const execMetrics = pipelineResults.length > 0
    ? [`${pipelineResults.length} runs`, `Last: ${pipelineResults[pipelineResults.length - 1]?.totals.overallEfficiency ?? 0}% eff`]
    : ["No runs"];

  // Loop status
  const loopActive = health.worldReady && health.brainActive && health.loopClosed;

  return (
    <div className="bg-card/50 border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <RotateCcw className={`w-3.5 h-3.5 text-primary ${loopActive ? "animate-spin" : ""}`} style={loopActive ? { animationDuration: "4s" } : {}} />
          System Data Flow
        </h3>
        <div className="flex items-center gap-1.5">
          {loopActive ? (
            <span className="flex items-center gap-1 text-[8px] font-mono text-success">
              <CheckCircle2 className="w-3 h-3" /> Closed Loop
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground">
              <AlertCircle className="w-3 h-3" /> Open Loop
            </span>
          )}
        </div>
      </div>

      {/* Diagram */}
      <div className="flex items-center justify-between py-2">
        <DiagramNode
          label="WORLD"
          sublabel="Factory Scenario"
          icon={Globe}
          active={health.worldReady}
          metrics={worldMetrics}
          position="left"
          color="primary"
        />
        <AnimatedConnector
          active={health.worldReady && health.brainActive}
          label="state input"
        />
        <DiagramNode
          label="BRAIN"
          sublabel="Evolution Engine"
          icon={Brain}
          active={health.brainActive}
          metrics={brainMetrics}
          position="center"
          color="accent"
        />
        <AnimatedConnector
          active={health.brainActive && health.executionReady}
          label="deploy"
        />
        <DiagramNode
          label="EXEC"
          sublabel="Pipeline Runner"
          icon={Cpu}
          active={health.executionReady}
          metrics={execMetrics}
          position="right"
          color="success"
        />
      </div>

      {/* Feedback loop arrow */}
      <div className="relative h-6 mx-8">
        <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 bg-border/50 rounded-full overflow-hidden">
          {health.loopClosed && (
            <div className="absolute h-full w-12 rounded-full bg-gradient-to-r from-transparent via-success to-transparent animate-[flowReverse_2s_linear_infinite]" />
          )}
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <polygon points="2,6 8,2 8,10" fill={health.loopClosed ? "hsl(var(--success))" : "hsl(var(--muted-foreground)/0.2)"} />
          </svg>
        </div>
        <span className="absolute inset-x-0 top-full text-center text-[7px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
          {health.loopClosed ? "feedback loop active" : "feedback loop open — run pipeline"}
        </span>
      </div>
    </div>
  );
}
