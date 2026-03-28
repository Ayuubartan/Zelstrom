import { useState, useCallback, useEffect, useRef } from "react";
import { getPipelineHistory, onPipelineFeedback, type PipelineRunResult } from "@/lib/feedback-bridge";
import { Link, useNavigate } from "react-router-dom";
import {
  initializeFactory,
  runAdversarialGeneration,
  runABTest,
  updateSensors,
  LOGIC_OVERLAYS,
  type SDMFState,
  type LogicOverlay,
} from "@/lib/sdmf";
import { deployWinnerToWorkflow } from "@/lib/deploy-bridge";
import { DigitalTwinPanel } from "@/components/sdmf/DigitalTwinPanel";
import { EvolutionTimeline } from "@/components/sdmf/EvolutionTimeline";
import { ABTestPanel } from "@/components/sdmf/ABTestPanel";
import { LogicOverlayPanel } from "@/components/sdmf/LogicOverlayPanel";
import { FitnessChart } from "@/components/sdmf/FitnessChart";
import { ProjectedVsActualChart } from "@/components/sdmf/ProjectedVsActualChart";
import { PipelineFeedbackPanel } from "@/components/sdmf/PipelineFeedbackPanel";
import { AgentLeaderboard } from "@/components/sdmf/AgentLeaderboard";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { toast } from "sonner";

export default function CommandCenter() {
  const navigate = useNavigate();
  const [state, setState] = useState<SDMFState>(() => initializeFactory());
  const [isEvolving, setIsEvolving] = useState(false);
  const [autoEvolve, setAutoEvolve] = useState(false);
  const sensorInterval = useRef<ReturnType<typeof setInterval>>();
  const [pipelineResults, setPipelineResults] = useState<PipelineRunResult[]>(() => getPipelineHistory());

  // Listen for real-time pipeline feedback
  useEffect(() => {
    return onPipelineFeedback((result) => {
      setPipelineResults(prev => [...prev.slice(-9), result]);
      toast.info(`Pipeline feedback received — Efficiency: ${result.totals.overallEfficiency}%`);
    });
  }, []);

  const handleDeployToPipeline = useCallback(() => {
    const latestGen = state.generations[state.generations.length - 1];
    if (!latestGen?.survivor) {
      toast.error("No winning configuration to deploy");
      return;
    }
    deployWinnerToWorkflow(latestGen.survivor, latestGen.id);
    toast.success(`Deployed Gen ${latestGen.id} winner to Workflow Builder`);
    navigate("/workflow");
  }, [state.generations, navigate]);

  // Live sensor updates
  useEffect(() => {
    sensorInterval.current = setInterval(() => {
      setState(prev => ({ ...prev, stations: updateSensors(prev.stations) }));
    }, 3000);
    return () => clearInterval(sensorInterval.current);
  }, []);

  // Auto-evolve loop
  useEffect(() => {
    if (!autoEvolve) return;
    const timer = setInterval(() => {
      setState(prev => {
        const gen = runAdversarialGeneration(prev);
        const newGens = [...prev.generations, gen];

        // Auto A/B test if we have 2+ gens
        let newTests = [...prev.abTests];
        if (newGens.length >= 2) {
          const ab = runABTest(prev, newGens[newGens.length - 2], gen);
          newTests = [...newTests.slice(-4), ab]; // keep last 5
        }

        return {
          ...prev,
          generations: newGens,
          currentGeneration: gen.id,
          abTests: newTests,
          overallScore: gen.fitnessScore,
          totalUnitsProduced: prev.totalUnitsProduced + Math.floor(Math.random() * 50 + 20),
        };
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [autoEvolve]);

  const handleEvolve = useCallback(() => {
    setIsEvolving(true);
    setTimeout(() => {
      setState(prev => {
        const gen = runAdversarialGeneration(prev);
        const newGens = [...prev.generations, gen];

        let newTests = [...prev.abTests];
        if (newGens.length >= 2) {
          const ab = runABTest(prev, newGens[newGens.length - 2], gen);
          newTests = [...newTests.slice(-4), ab];
        }

        toast.success(
          `Gen ${gen.id}: ${gen.survivor?.agentName} survived (${gen.retired.length} retired)`,
        );

        return {
          ...prev,
          generations: newGens,
          currentGeneration: gen.id,
          abTests: newTests,
          overallScore: gen.fitnessScore,
          totalUnitsProduced: prev.totalUnitsProduced + Math.floor(Math.random() * 50 + 20),
          selfHealingEvents: prev.selfHealingEvents + (gen.attacks.some(a => a.severity > 7) ? 1 : 0),
        };
      });
      setIsEvolving(false);
    }, 600);
  }, []);

  const handleActivateOverlay = useCallback((overlay: LogicOverlay) => {
    setState(prev => ({ ...prev, activeOverlay: overlay }));
    toast.success(`Logic overlay deployed: ${overlay.name}`);
  }, []);

  const handleReset = useCallback(() => {
    setState(initializeFactory());
    setAutoEvolve(false);
    toast.info("Factory re-initialized");
  }, []);

  const latestGen = state.generations[state.generations.length - 1];

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
                SDMF<span className="text-primary">·</span>Command<span className="text-primary">·</span>Center
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                Software-Defined Micro-Factory • Gen {state.currentGeneration}
              </p>
            </div>
          </div>

          {/* Status strip */}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
            <span className="text-muted-foreground">Score: <span className="text-primary font-bold">{state.overallScore}/100</span></span>
            <span className="text-muted-foreground">Units: <span className="text-foreground">{state.totalUnitsProduced.toLocaleString()}</span></span>
            <span className="text-muted-foreground">Self-Heal: <span className="text-success">{state.selfHealingEvents}</span></span>
            {latestGen && (
              <span className="text-muted-foreground">
                <Crown className="w-3 h-3 inline text-success mr-0.5" />
                {latestGen.survivor?.agentName}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {latestGen?.survivor && (
              <Button variant="outline" size="sm" onClick={handleDeployToPipeline} className="gap-1.5 font-mono text-[10px] h-8 border-success/30 text-success hover:bg-success/10">
                <Rocket className="w-3 h-3" />
                Deploy to Pipeline
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
              onClick={() => setAutoEvolve(!autoEvolve)}
              className="gap-1.5 font-mono text-[10px] h-8"
            >
              <Zap className="w-3 h-3" />
              {autoEvolve ? "Stop Auto" : "Auto-Evolve"}
            </Button>
            <Button
              size="sm"
              onClick={handleEvolve}
              disabled={isEvolving || autoEvolve}
              className="gap-1.5 font-mono text-[10px] h-8"
            >
              <Swords className="w-3 h-3" />
              {isEvolving ? "Evolving..." : "Run Generation"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout: 3-column */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Digital Twin + Logic Overlays */}
        <ScrollArea className="w-80 shrink-0 border-r border-border">
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Digital Twin — Live
              </h2>
              <DigitalTwinPanel stations={state.stations} />
            </div>

            <div className="border-t border-border pt-4">
              <LogicOverlayPanel
                overlays={LOGIC_OVERLAYS}
                activeId={state.activeOverlay?.id ?? null}
                onActivate={handleActivateOverlay}
              />
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
                {state.generations.length} generations
              </span>
            </div>

            {/* Fitness chart */}
            <FitnessChart generations={state.generations} />

            {/* Projected vs Actual */}
            <ProjectedVsActualChart generations={state.generations} pipelineResults={pipelineResults} />

            {/* Timeline */}
            <EvolutionTimeline generations={[...state.generations].reverse()} />
          </div>
        </ScrollArea>

        {/* Right: A/B Tests */}
        <ScrollArea className="w-72 shrink-0 border-l border-border">
          <div className="p-4 space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-agent-balanced" />
              A/B Field Tests
            </h2>
            <ABTestPanel tests={state.abTests} />

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
