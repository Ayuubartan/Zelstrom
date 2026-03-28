import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useZelstromStore } from "@/store/zelstromStore";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Workflow, ArrowLeft } from "lucide-react";
import zelstromLogo from "@/assets/zelstrom-logo.png";

import { HeroSection } from "@/components/guided/HeroSection";
import { FlowSteps, type FlowStep } from "@/components/guided/FlowSteps";
import { ScenarioStep } from "@/components/guided/ScenarioStep";
import { StrategyStep } from "@/components/guided/StrategyStep";
import { ExecutionPathStep } from "@/components/guided/ExecutionPathStep";

const Index = () => {
  const [step, setStep] = useState<FlowStep>("hero");
  const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([]);
  const navigate = useNavigate();

  const scenario = useZelstromStore(s => s.scenario);
  const sandboxResults = useZelstromStore(s => s.sandboxResults);
  const sandboxRound = useZelstromStore(s => s.sandboxRound);
  const isSandboxRunning = useZelstromStore(s => s.isSandboxRunning);
  const sdmf = useZelstromStore(s => s.sdmf);
  const activePlan = useZelstromStore(s => s.activePlan);

  const initializeScenario = useZelstromStore(s => s.initializeScenario);
  const runSandboxCompetition = useZelstromStore(s => s.runSandboxCompetition);
  const newSandboxRound = useZelstromStore(s => s.newSandboxRound);
  const orchestrate = useZelstromStore(s => s.orchestrate);
  const deployFromSandbox = useZelstromStore(s => s.deployFromSandbox);
  const getSystemHealth = useZelstromStore(s => s.getSystemHealth);

  const health = getSystemHealth();

  // Auto-advance when scenario is created
  useEffect(() => {
    if (scenario && step === "hero") {
      setStep("scenario");
    }
  }, [scenario, step]);

  // Auto-advance when results come in
  useEffect(() => {
    if (sandboxResults.length > 0 && step === "scenario") {
      markComplete("scenario");
      setStep("strategy");
    }
  }, [sandboxResults.length, step]);

  const markComplete = useCallback((s: FlowStep) => {
    setCompletedSteps(prev => prev.includes(s) ? prev : [...prev, s]);
  }, []);

  const handleStart = useCallback(() => {
    setStep("scenario");
  }, []);

  const handleInitialize = useCallback((jobs?: number, machines?: number) => {
    initializeScenario(jobs, machines);
  }, [initializeScenario]);

  const handleGenerateStrategies = useCallback(() => {
    runSandboxCompetition();
  }, [runSandboxCompetition]);

  const handleSelectWinner = useCallback(() => {
    if (sandboxResults.length > 0) {
      deployFromSandbox(sandboxResults[0]);
      markComplete("strategy");
      setStep("execution-path");
    }
  }, [sandboxResults, deployFromSandbox, markComplete]);

  const handleOrchestrate = useCallback(() => {
    orchestrate();
    markComplete("strategy");
    setStep("execution-path");
  }, [orchestrate, markComplete]);

  // Hero screen
  if (step === "hero") {
    return <HeroSection onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("hero")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
              <img src={zelstromLogo} alt="Zelstrom" className="w-7 h-7" width={512} height={512} />
            </button>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">
                Zel<span className="text-primary">·</span>strom
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                Autonomous Factory AI
              </p>
            </div>
          </div>

          {/* Health indicators */}
          <div className="hidden md:flex items-center gap-3 text-[9px] font-mono">
            {[
              { label: "World", active: health.worldReady },
              { label: "Brain", active: health.brainActive },
              { label: "Exec", active: health.executionReady },
              { label: "Loop", active: health.loopClosed, isPrimary: true },
            ].map(h => (
              <div key={h.label} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  h.active
                    ? h.isPrimary
                      ? "bg-primary shadow-[0_0_4px_hsl(185,80%,50%,0.5)]"
                      : "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                    : "bg-muted-foreground/30"
                }`} />
                <span className="text-muted-foreground">{h.label}</span>
              </div>
            ))}
            {sdmf.currentGeneration > 0 && (
              <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
                Gen {sdmf.currentGeneration}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step !== "scenario" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step === "execution-path" ? "strategy" : "scenario")}
                className="gap-1 font-mono text-xs"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
            )}
            <Link to="/command-center">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Command Center</span>
              </Button>
            </Link>
            <Link to="/workflow">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Workflow className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workflow</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Flow progress */}
        <FlowSteps currentStep={step} completedSteps={completedSteps} />

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === "scenario" && (
            <ScenarioStep
              key="scenario"
              scenario={scenario}
              isSandboxRunning={isSandboxRunning}
              onInitialize={handleInitialize}
              onGenerateStrategies={handleGenerateStrategies}
            />
          )}

          {step === "strategy" && sandboxResults.length > 0 && (
            <StrategyStep
              key="strategy"
              results={sandboxResults}
              round={sandboxRound}
              isSandboxRunning={isSandboxRunning}
              onNewRound={newSandboxRound}
              onOrchestrate={handleOrchestrate}
              onSelectWinner={handleSelectWinner}
            />
          )}

          {step === "execution-path" && (
            <ExecutionPathStep
              key="execution-path"
              activePlan={activePlan}
              winnerName={sandboxResults[0]?.agentName}
              winnerScore={sandboxResults[0]?.score}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
