import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useZelstromStore } from "@/store/zelstromStore";
import { AgentCard } from "@/components/AgentCard";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, Play, RotateCcw, Swords, Workflow, Shield, ChevronDown, Brain, Zap } from "lucide-react";
import zelstromLogo from "@/assets/zelstrom-logo.png";
import heroBg from "@/assets/zelstrom-hero-bg.jpg";
import { useState } from "react";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);

  const scenario = useZelstromStore(s => s.scenario);
  const sandboxResults = useZelstromStore(s => s.sandboxResults);
  const sandboxRound = useZelstromStore(s => s.sandboxRound);
  const isSandboxRunning = useZelstromStore(s => s.isSandboxRunning);
  const sdmf = useZelstromStore(s => s.sdmf);
  const strategy = useZelstromStore(s => s.strategy);
  const activePlan = useZelstromStore(s => s.activePlan);

  const initializeScenario = useZelstromStore(s => s.initializeScenario);
  const runSandboxCompetition = useZelstromStore(s => s.runSandboxCompetition);
  const newSandboxRound = useZelstromStore(s => s.newSandboxRound);
  const orchestrate = useZelstromStore(s => s.orchestrate);
  const getSystemHealth = useZelstromStore(s => s.getSystemHealth);

  useEffect(() => {
    const timer = setTimeout(() => setSplashFade(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = useCallback(() => {
    setShowSplash(false);
  }, []);

  const health = getSystemHealth();

  if (showSplash) {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 scanline" />
        </div>
        <div className={`relative z-10 h-full flex flex-col items-center justify-center transition-all duration-1000 ${splashFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mb-8 relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
            <img src={zelstromLogo} alt="Zelstrom" className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_30px_hsl(185,80%,50%,0.3)]" width={512} height={512} />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-2">
            Zel<span className="text-primary text-glow-cyan">·</span>strom
          </h1>
          <p className="text-xs md:text-sm font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2">
            Autonomous Micro-Factory AI
          </p>
          <p className="text-sm md:text-base text-muted-foreground/70 max-w-md text-center mb-12 leading-relaxed">
            Self-optimizing adversarial agents compete, evolve, and deploy — building the factory that builds itself.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            <Link to="/command-center">
              <Button size="lg" className="gap-2 font-mono text-sm h-12 px-8 glow-cyan">
                <Shield className="w-4 h-4" />
                Enter Command Center
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={handleEnter} className="gap-2 font-mono text-sm h-12 px-8 border-border/50">
              <Factory className="w-4 h-4" />
              Agent Sandbox
            </Button>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            <Link to="/command-center" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Command
            </Link>
            <span className="text-border">|</span>
            <Link to="/workflow" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Workflow className="w-3 h-3" /> Workflow
            </Link>
            <span className="text-border">|</span>
            <button onClick={handleEnter} className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Swords className="w-3 h-3" /> Arena
            </button>
          </div>
          <button onClick={handleEnter} className="absolute bottom-8 animate-bounce text-muted-foreground/30 hover:text-muted-foreground transition-colors">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4 text-[8px] font-mono text-muted-foreground/30 z-10">
          ZELSTROM v2.0 · SDMF ENGINE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-lg">
              <img src={zelstromLogo} alt="Zelstrom" className="w-8 h-8" width={512} height={512} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Zel<span className="text-primary">·</span>strom
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Autonomous Multi-Agent Factory AI
              </p>
            </div>
          </div>

          {/* System health indicators */}
          <div className="hidden md:flex items-center gap-3 text-[9px] font-mono">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${health.worldReady ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">World</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${health.brainActive ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">Brain</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${health.executionReady ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">Exec</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${health.loopClosed ? "bg-primary shadow-[0_0_4px_hsl(185,80%,50%,0.5)]" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">Loop</span>
            </div>
            {sdmf.currentGeneration > 0 && (
              <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
                Gen {sdmf.currentGeneration}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/command-center">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Shield className="w-3.5 h-3.5" />
                Command Center
              </Button>
            </Link>
            <Link to="/workflow">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Workflow className="w-3.5 h-3.5" />
                Workflow Builder
              </Button>
            </Link>
            {!scenario && (
              <Button onClick={() => initializeScenario()} className="gap-2 font-mono text-xs">
                <Play className="w-3.5 h-3.5" />
                Initialize Factory
              </Button>
            )}
            {scenario && sandboxResults.length === 0 && (
              <Button onClick={runSandboxCompetition} disabled={isSandboxRunning} className="gap-2 font-mono text-xs">
                <Swords className="w-3.5 h-3.5" />
                {isSandboxRunning ? "Running..." : "Start Competition"}
              </Button>
            )}
            {sandboxResults.length > 0 && (
              <>
                <Button onClick={newSandboxRound} disabled={isSandboxRunning} className="gap-2 font-mono text-xs" variant="outline">
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isSandboxRunning ? "Running..." : "New Round"}
                </Button>
                <Button onClick={orchestrate} className="gap-2 font-mono text-xs glow-cyan">
                  <Brain className="w-3.5 h-3.5" />
                  Orchestrate
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Active plan banner */}
        {activePlan && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-mono text-foreground">
                  Orchestration Plan Active — <span className="text-primary">{activePlan.strategy}</span> strategy
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Winner: {activePlan.deployedAgent?.agentName} · Score: {activePlan.score} · {activePlan.scenarioId}
                </p>
              </div>
            </div>
            <Link to="/command-center">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px] h-7">
                <Shield className="w-3 h-3" />
                View in Command Center
              </Button>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!scenario && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl bg-primary/15 rounded-full scale-150" />
              <img src={zelstromLogo} alt="Zelstrom" className="relative w-16 h-16 animate-pulse-glow" width={512} height={512} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Deploy</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Initialize a factory scenario to watch AI agents compete in real-time optimization.
            </p>
            <Button onClick={() => initializeScenario()} size="lg" className="gap-2 font-mono">
              <Play className="w-4 h-4" />
              Initialize Factory
            </Button>
          </div>
        )}

        {/* Scenario + Agents */}
        {scenario && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <ScenarioPanel scenario={scenario} />
              {sandboxResults.length > 0 ? (
                sandboxResults.map((r, i) => (
                  <AgentCard key={r.agentId} result={r} rank={i} isWinner={i === 0} />
                ))
              ) : (
                <div className="lg:col-span-3 flex items-center justify-center bg-card border border-border rounded-lg p-12">
                  <div className="text-center">
                    <Swords className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isSandboxRunning ? "Agents competing..." : "Press Start Competition to begin"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {sandboxResults.length > 0 && <ResultsChart results={sandboxResults} />}
            {sandboxResults.length > 0 && <CompetitionLog results={sandboxResults} round={sandboxRound} />}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
