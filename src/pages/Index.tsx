import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { generateScenario, runCompetition, FactoryScenario, SimulationResult } from "@/lib/factory";
import { AgentCard } from "@/components/AgentCard";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { ResultsChart } from "@/components/ResultsChart";
import { CompetitionLog } from "@/components/CompetitionLog";
import { Button } from "@/components/ui/button";
import { Factory, Play, RotateCcw, Swords, Workflow } from "lucide-react";

const Index = () => {
  const [scenario, setScenario] = useState<FactoryScenario | null>(null);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [round, setRound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleGenerate = useCallback(() => {
    const s = generateScenario(8, 4);
    setScenario(s);
    setResults([]);
    setRound(0);
  }, []);

  const handleRun = useCallback(() => {
    if (!scenario) return;
    setIsRunning(true);
    // Simulate processing delay for dramatic effect
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

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg glow-cyan">
              <Factory className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Factory<span className="text-primary">·</span>as<span className="text-primary">·</span>a<span className="text-primary">·</span>Service
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Autonomous Multi-Agent AI System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <div className="p-4 bg-primary/5 rounded-2xl mb-6 glow-cyan">
              <Factory className="w-12 h-12 text-primary animate-pulse-glow" />
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
