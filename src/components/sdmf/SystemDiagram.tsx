import { useZelstromStore } from "@/store/zelstromStore";
import { Globe, Brain, Cpu, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

const NODE_STYLES = {
  primary: {
    border: "hsl(185 80% 50%)",
    bg: "hsl(185 80% 50% / 0.1)",
    glow: "0 0 20px hsl(185 80% 50% / 0.3)",
    textClass: "text-primary",
  },
  accent: {
    border: "hsl(38 90% 55%)",
    bg: "hsl(38 90% 55% / 0.1)",
    glow: "0 0 20px hsl(38 90% 55% / 0.3)",
    textClass: "text-accent",
  },
  success: {
    border: "hsl(150 70% 45%)",
    bg: "hsl(150 70% 45% / 0.1)",
    glow: "0 0 20px hsl(150 70% 45% / 0.3)",
    textClass: "text-success",
  },
} as const;

type ColorKey = keyof typeof NODE_STYLES;

interface NodeProps {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  active: boolean;
  metrics: string[];
  color: ColorKey;
}

function DiagramNode({ label, sublabel, icon: Icon, active, metrics, color }: NodeProps) {
  const s = NODE_STYLES[color];
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
      <div
        className="relative w-16 h-16 rounded-xl border-2 border-border bg-card/50 flex items-center justify-center transition-all duration-700"
        style={active ? { borderColor: s.border, backgroundColor: s.bg, boxShadow: s.glow } : {}}
      >
        {active && (
          <div className="absolute inset-0 rounded-xl animate-pulse opacity-30" style={{ backgroundColor: s.bg }} />
        )}
        <Icon className={`w-6 h-6 ${active ? s.textClass : "text-muted-foreground"}`} />
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${active ? "bg-success" : "bg-muted-foreground/30"}`}>
          {active && <div className="absolute inset-0.5 rounded-full bg-success animate-ping opacity-50" />}
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold text-foreground tracking-wide">{label}</span>
      <span className="text-[8px] font-mono text-muted-foreground">{sublabel}</span>
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
    <div className="flex flex-col items-center gap-1 mx-1 flex-1 min-w-[60px]">
      <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="relative w-full h-6 flex items-center">
        {/* Track line */}
        <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 bg-border rounded-full overflow-hidden">
          {active && (
            <div
              className="absolute h-full w-8 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(185 80% 50%), transparent)",
                animation: reverse
                  ? "flowReverse 1.5s linear infinite"
                  : "flowForward 1.5s linear infinite",
              }}
            />
          )}
        </div>
        {/* Particles */}
        {active && (
          <>
            <div
              className="absolute w-2 h-2 rounded-full bg-primary"
              style={{
                boxShadow: "0 0 8px hsl(185 80% 50% / 0.6)",
                animation: reverse
                  ? "particleReverse 2s ease-in-out infinite"
                  : "particleForward 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
              style={{
                boxShadow: "0 0 6px hsl(185 80% 50% / 0.4)",
                animation: reverse
                  ? "particleReverse 2s ease-in-out infinite 0.7s"
                  : "particleForward 2s ease-in-out infinite 0.7s",
              }}
            />
          </>
        )}
        {/* Arrow */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
          {reverse ? (
            <polygon points="8,12 14,8 14,16" fill={active ? "hsl(185 80% 50%)" : "hsl(215 15% 50% / 0.3)"} />
          ) : (
            <polygon points="92,12 86,8 86,16" fill={active ? "hsl(185 80% 50%)" : "hsl(215 15% 50% / 0.3)"} />
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
  const strategy = useZelstromStore(s => s.strategy);
  const health = useZelstromStore(s => s.getSystemHealth)();

  const worldMetrics = scenario
    ? [`${scenario.jobs.length}j · ${scenario.machines.length}m`, `$${scenario.maxBudget} budget`]
    : ["No scenario"];

  const brainMetrics = sdmf.generations.length > 0
    ? [`Gen ${sdmf.currentGeneration} · ${strategy}`, `Fitness: ${sdmf.overallScore}/100`]
    : ["Idle"];

  const execMetrics = pipelineResults.length > 0
    ? [`${pipelineResults.length} runs`, `${pipelineResults[pipelineResults.length - 1]?.totals.overallEfficiency ?? 0}% eff`]
    : ["No runs"];

  const loopActive = health.worldReady && health.brainActive && health.loopClosed;

  return (
    <div className="bg-card/50 border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <RotateCcw
            className={`w-3.5 h-3.5 text-primary ${loopActive ? "animate-spin" : ""}`}
            style={loopActive ? { animationDuration: "4s" } : {}}
          />
          System Data Flow
        </h3>
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

      {/* Main flow: World → Brain → Exec */}
      <div className="flex items-start justify-between py-2">
        <DiagramNode label="WORLD" sublabel="Factory Scenario" icon={Globe} active={health.worldReady} metrics={worldMetrics} color="primary" />
        <AnimatedConnector active={health.worldReady && health.brainActive} label="state" />
        <DiagramNode label="BRAIN" sublabel="Evolution Engine" icon={Brain} active={health.brainActive} metrics={brainMetrics} color="accent" />
        <AnimatedConnector active={health.brainActive && health.executionReady} label="deploy" />
        <DiagramNode label="EXEC" sublabel="Pipeline Runner" icon={Cpu} active={health.executionReady} metrics={execMetrics} color="success" />
      </div>

      {/* Feedback loop */}
      <div className="relative h-6 mx-10">
        <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 bg-border/50 rounded-full overflow-hidden">
          {health.loopClosed && (
            <div
              className="absolute h-full w-12 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(150 70% 45%), transparent)",
                animation: "flowReverse 2s linear infinite",
              }}
            />
          )}
        </div>
        <svg className="absolute left-0 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12">
          <polygon points="2,6 8,2 8,10" fill={health.loopClosed ? "hsl(150 70% 45%)" : "hsl(215 15% 50% / 0.2)"} />
        </svg>
        <span className="absolute inset-x-0 top-full text-center text-[7px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
          {health.loopClosed ? "⚡ feedback loop active" : "feedback loop open — run pipeline"}
        </span>
      </div>
    </div>
  );
}
