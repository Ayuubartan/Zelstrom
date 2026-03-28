import { useEffect, useRef, useCallback } from "react";
import { onPipelineFeedback } from "@/lib/feedback-bridge";
import { Link, useNavigate } from "react-router-dom";
import { LOGIC_OVERLAYS, type LogicOverlay } from "@/lib/sdmf";
import { mountZelstromAPI } from "@/lib/external-agent-bridge";
import { useZelstromStore, type Strategy } from "@/store/zelstromStore";
import { DigitalTwinPanel } from "@/components/sdmf/DigitalTwinPanel";
import { EvolutionTimeline } from "@/components/sdmf/EvolutionTimeline";
import { ABTestPanel } from "@/components/sdmf/ABTestPanel";
import { LogicOverlayPanel } from "@/components/sdmf/LogicOverlayPanel";
import { FitnessChart } from "@/components/sdmf/FitnessChart";
import { ProjectedVsActualChart } from "@/components/sdmf/ProjectedVsActualChart";
import { PipelineFeedbackPanel } from "@/components/sdmf/PipelineFeedbackPanel";
import { AgentLeaderboard } from "@/components/sdmf/AgentLeaderboard";
import { SelfHealingLog } from "@/components/sdmf/SelfHealingLog";
import { ExternalAgentPanel } from "@/components/sdmf/ExternalAgentPanel";
import { SystemDiagram } from "@/components/sdmf/SystemDiagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Swords,
  Zap,
  FlaskConical,
  Activity,
  Shield,
  Skull,
  Crown,
  Factory,
  Workflow,
  RefreshCw,
  Rocket,
  BarChart3,
  Dna,
  HeartPulse,
  Plug,
  Brain,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const STRATEGY_OPTIONS: { value: Strategy; label: string; desc: string }[] = [
  { value: "minimize-cost", label: "Min Cost", desc: "Optimize for lowest operational cost" },
  { value: "maximize-speed", label: "Max Speed", desc: "Maximize throughput and velocity" },
  { value: "balanced", label: "Balanced", desc: "Pareto-optimal tradeoffs" },
  { value: "adaptive", label: "Adaptive", desc: "Learn from pipeline feedback" },
];

export default function CommandCenter() {
  const navigate = useNavigate();
  const sensorInterval = useRef<ReturnType<typeof setInterval>>();

  // Global store selectors
  const sdmf = useZelstromStore(s => s.sdmf);
  const strategy = useZelstromStore(s => s.strategy);
  const isEvolving = useZelstromStore(s => s.isEvolving);
  const autoEvolve = useZelstromStore(s => s.autoEvolve);
  const pipelineResults = useZelstromStore(s => s.pipelineResults);
  const leaderboardKey = useZelstromStore(s => s.leaderboardKey);
  const healEvents = useZelstromStore(s => s.healEvents);
  const activePlan = useZelstromStore(s => s.activePlan);
  const scenario = useZelstromStore(s => s.scenario);

  const setStrategy = useZelstromStore(s => s.setStrategy);
  const runGeneration = useZelstromStore(s => s.runGeneration);
  const toggleAutoEvolve = useZelstromStore(s => s.toggleAutoEvolve);
  const deployWinner = useZelstromStore(s => s.deployWinner);
  const resetFactory = useZelstromStore(s => s.resetFactory);
  const updateSensorTick = useZelstromStore(s => s.updateSensorTick);
  const addPipelineResult = useZelstromStore(s => s.addPipelineResult);
  const orchestrate = useZelstromStore(s => s.orchestrate);
  const getSystemHealth = useZelstromStore(s => s.getSystemHealth);

  // Mount window.Zelstrom API
  useEffect(() => { mountZelstromAPI(); }, []);

  // Listen for pipeline feedback
  useEffect(() => {
    return onPipelineFeedback((result) => {
      addPipelineResult(result);
      toast.info(`Pipeline feedback received — Efficiency: ${result.totals.overallEfficiency}%`);
    });
  }, [addPipelineResult]);

  // Live sensor updates
  useEffect(() => {
    sensorInterval.current = setInterval(updateSensorTick, 3000);
    return () => clearInterval(sensorInterval.current);
  }, [updateSensorTick]);

  // Auto-evolve loop
  useEffect(() => {
    if (!autoEvolve) return;
    const timer = setInterval(runGeneration, 2500);
    return () => clearInterval(timer);
  }, [autoEvolve, runGeneration]);

  const handleDeployToPipeline = useCallback(() => {
    const result = deployWinner();
    if (!result) {
      toast.error("No winning configuration to deploy");
      return;
    }
    toast.success(`Deployed Gen ${result.generationId} winner to Workflow Builder`);
    navigate("/workflow");
  }, [deployWinner, navigate]);

  const handleEvolve = useCallback(() => {
    runGeneration();
    const latestGen = sdmf.generations[sdmf.generations.length - 1];
    if (latestGen?.survivor) {
      toast.success(`Gen ${latestGen.id}: ${latestGen.survivor.agentName} survived (${latestGen.retired.length} retired)`);
    }
  }, [runGeneration, sdmf.generations]);

  const handleActivateOverlay = useCallback((overlay: LogicOverlay) => {
    // Overlays still local to SDMF for now
    toast.success(`Logic overlay deployed: ${overlay.name}`);
  }, []);

  const handleReset = useCallback(() => {
    resetFactory();
    toast.info("Factory re-initialized");
  }, [resetFactory]);

  const handleOrchestrate = useCallback(() => {
    orchestrate();
    toast.success("Orchestration complete — scenario linked to evolution engine");
  }, [orchestrate]);

  const latestGen = sdmf.generations[sdmf.generations.length - 1];
  const health = getSystemHealth();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm z-20 shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="p-2 bg-primary/10 rounded-lg glow-cyan">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Zel<span className="text-primary">·</span>strom<span className="text-primary">·</span>Command
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                Autonomous Micro-Factory • Gen {sdmf.currentGeneration}
              </p>
            </div>
          </div>

          {/* System health + status */}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
            {/* Health dots */}
            <div className="flex items-center gap-2 border-r border-border pr-4">
              {[
                { ok: health.worldReady, label: "W" },
                { ok: health.brainActive, label: "B" },
                { ok: health.executionReady, label: "E" },
                { ok: health.loopClosed, label: "L" },
              ].map(h => (
                <div key={h.label} className="flex items-center gap-1" title={h.label}>
                  <div className={`w-1.5 h-1.5 rounded-full ${h.ok ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/30"}`} />
                  <span className="text-muted-foreground/50">{h.label}</span>
                </div>
              ))}
            </div>
            <span className="text-muted-foreground">Score: <span className="text-primary font-bold">{sdmf.overallScore}/100</span></span>
            <span className="text-muted-foreground">Units: <span className="text-foreground">{sdmf.totalUnitsProduced.toLocaleString()}</span></span>
            <span className="text-muted-foreground">Self-Heal: <span className="text-success">{sdmf.selfHealingEvents}</span></span>
            {latestGen && (
              <span className="text-muted-foreground">
                <Crown className="w-3 h-3 inline text-success mr-0.5" />
                {latestGen.survivor?.agentName}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Strategy selector */}
            <div className="flex items-center gap-1 border border-border rounded-md px-1 h-8">
              {STRATEGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStrategy(opt.value)}
                  title={opt.desc}
                  className={`px-2 py-1 rounded text-[9px] font-mono transition-colors ${
                    strategy === opt.value
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {scenario && (
              <Button variant="outline" size="sm" onClick={handleOrchestrate} className="gap-1.5 font-mono text-[10px] h-8 border-primary/30 text-primary hover:bg-primary/10">
                <Brain className="w-3 h-3" />
                Orchestrate
              </Button>
            )}

            {latestGen?.survivor && (
              <Button variant="outline" size="sm" onClick={handleDeployToPipeline} className="gap-1.5 font-mono text-[10px] h-8 border-success/30 text-success hover:bg-success/10">
                <Rocket className="w-3 h-3" />
                Deploy
              </Button>
            )}
            <Link to="/workflow">
              <Button variant="ghost" size="sm" className="gap-1.5 font-mono text-[10px] h-8">
                <Workflow className="w-3 h-3" />
                Builder
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 font-mono text-[10px] h-8">
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>
            <Button
              variant={autoEvolve ? "destructive" : "outline"}
              size="sm"
              onClick={toggleAutoEvolve}
              className="gap-1.5 font-mono text-[10px] h-8"
            >
              <Zap className="w-3 h-3" />
              {autoEvolve ? "Stop" : "Auto"}
            </Button>
            <Button
              size="sm"
              onClick={handleEvolve}
              disabled={isEvolving || autoEvolve}
              className="gap-1.5 font-mono text-[10px] h-8"
            >
              <Swords className="w-3 h-3" />
              {isEvolving ? "..." : "Evolve"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout: 3-column */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Digital Twin + Logic Overlays */}
        <ScrollArea className="w-80 shrink-0 border-r border-border">
          <div className="p-4 space-y-6">
            {/* Active plan indicator */}
            {activePlan && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-mono font-semibold text-primary uppercase">Active Plan</span>
                </div>
                <p className="text-[9px] font-mono text-muted-foreground">
                  Strategy: {activePlan.strategy} · Score: {activePlan.score}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground">
                  Agent: {activePlan.deployedAgent?.agentName} · {activePlan.scenarioId}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Digital Twin — Live
              </h2>
              <DigitalTwinPanel stations={sdmf.stations} />
            </div>

            <div className="border-t border-border pt-4">
              <LogicOverlayPanel
                overlays={LOGIC_OVERLAYS}
                activeId={sdmf.activeOverlay?.id ?? null}
                onActivate={handleActivateOverlay}
              />
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-success" />
                Self-Healing Log
                {healEvents.length > 0 && (
                  <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
                    {healEvents.length}
                  </Badge>
                )}
              </h2>
              <SelfHealingLog events={healEvents} />
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Plug className="w-3.5 h-3.5 text-primary" />
                External Agents
              </h2>
              <ExternalAgentPanel />
            </div>
          </div>
        </ScrollArea>

        {/* Center: Evolution Timeline */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Skull className="w-3.5 h-3.5 text-destructive" />
                Evolution Timeline — Adversarial Generations
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                {sdmf.generations.length} generations
              </span>
            </div>

            <FitnessChart generations={sdmf.generations} />
            <ProjectedVsActualChart generations={sdmf.generations} pipelineResults={pipelineResults} />
            <EvolutionTimeline generations={[...sdmf.generations].reverse()} />
          </div>
        </ScrollArea>

        {/* Right: A/B Tests */}
        <ScrollArea className="w-80 shrink-0 border-l border-border">
          <div className="p-4 space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Dna className="w-3.5 h-3.5 text-primary" />
              Genetic Dominance
            </h2>
            <AgentLeaderboard refreshKey={leaderboardKey} />

            <div className="border-t border-border pt-4">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <FlaskConical className="w-3.5 h-3.5 text-agent-balanced" />
                A/B Field Tests
              </h2>
              <ABTestPanel tests={sdmf.abTests} />
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-success" />
                Pipeline Feedback
              </h2>
              <PipelineFeedbackPanel results={[...pipelineResults].reverse()} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
