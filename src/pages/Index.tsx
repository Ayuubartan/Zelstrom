import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { generateScenario, runCompetition, FactoryScenario, SimulationResult } from "@/lib/factory";
import { AgentCard } from "@/components/AgentCard";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { Button } from "@/components/ui/button";
import { Factory, Play, RotateCcw, Swords, Workflow, Shield, ChevronDown } from "lucide-react";
import zelstromLogo from "@/assets/zelstrom-logo.png";
import heroBg from "@/assets/zelstrom-hero-bg.jpg";

const Index = () => {
  const [scenario, setScenario] = useState<FactoryScenario | null>(null);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [round, setRound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);

  // Animate splash entrance
  useEffect(() => {
    const timer = setTimeout(() => setSplashFade(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleGenerate = useCallback(() => {
    const s = generateScenario(8, 4);
    setScenario(s);
    setResults([]);
    setRound(0);
  }, []);

  const handleRun = useCallback(() => {
    if (!scenario) return;
    setIsRunning(true);
    setTimeout(() => {
      const r = runCompetition(scenario);
      setResults(r);
      setRound(prev => prev + 1);
      setIsRunning(false);
    }, 800);
  }, [scenario]);

  const handleNewRound = useCallback(() => {
    const s = generateScenario(
      Math.floor(Math.random() * 6) + 6,
      Math.floor(Math.random() * 3) + 3
    );
    setScenario(s);
    setIsRunning(true);
    setTimeout(() => {
      const r = runCompetition(s);
      setResults(r);
      setRound(prev => prev + 1);
      setIsRunning(false);
    }, 800);
  }, []);

  if (showSplash) {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-background">
        {/* Hero background */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-40"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 scanline" />
        </div>

        {/* Content */}
        <div
          className={`relative z-10 h-full flex flex-col items-center justify-center transition-all duration-1000 ${
            splashFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Logo */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
            <img
              src={zelstromLogo}
              alt="Zelstrom"
              className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_30px_hsl(185,80%,50%,0.3)]"
              width={512}
              height={512}
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-2">
            Zel<span className="text-primary text-glow-cyan">·</span>strom
          </h1>
          <p className="text-xs md:text-sm font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2">
            Autonomous Micro-Factory AI
          </p>

          {/* Tagline */}
          <p className="text-sm md:text-base text-muted-foreground/70 max-w-md text-center mb-12 leading-relaxed">
            Self-optimizing adversarial agents compete, evolve, and deploy — 
            building the factory that builds itself.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            <Link to="/command-center">
              <Button size="lg" className="gap-2 font-mono text-sm h-12 px-8 glow-cyan">
                <Shield className="w-4 h-4" />
                Enter Command Center
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleEnter}
              className="gap-2 font-mono text-sm h-12 px-8 border-border/50"
            >
              <Factory className="w-4 h-4" />
              Agent Sandbox
            </Button>
          </div>

          {/* Quick nav */}
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

          {/* Scroll hint */}
          <button
            onClick={handleEnter}
            className="absolute bottom-8 animate-bounce text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Version tag */}
        <div className="absolute bottom-4 right-4 text-[8px] font-mono text-muted-foreground/30 z-10">
          ZELSTROM v2.0 · SDMF ENGINE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      {/* Header */}
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
              <Button onClick={handleGenerate} className="gap-2 font-mono text-xs">
                <Play className="w-3.5 h-3.5" />
                Initialize Factory
              </Button>
            )}
            {scenario && results.length === 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="gap-2 font-mono text-xs">
                <Swords className="w-3.5 h-3.5" />
                {isRunning ? "Running..." : "Start Competition"}
              </Button>
            )}
            {results.length > 0 && (
              <Button onClick={handleNewRound} disabled={isRunning} className="gap-2 font-mono text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                {isRunning ? "Running..." : "New Round"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
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
            <Button onClick={handleGenerate} size="lg" className="gap-2 font-mono">
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
              {results.length > 0 ? (
                results.map((r, i) => (
                  <AgentCard key={r.agentId} result={r} rank={i} isWinner={i === 0} />
                ))
              ) : (
                <div className="lg:col-span-3 flex items-center justify-center bg-card border border-border rounded-lg p-12">
                  <div className="text-center">
                    <Swords className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isRunning ? "Agents competing..." : "Press Start Competition to begin"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Charts */}
            {results.length > 0 && <ResultsChart results={results} />}

            {/* Log */}
            {results.length > 0 && <CompetitionLog results={results} round={round} />}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
