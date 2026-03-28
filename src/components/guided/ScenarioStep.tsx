import { ScenarioPanel } from "@/components/ScenarioPanel";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { Brain, Factory, Sliders } from "lucide-react";
import { useState } from "react";
import type { FactoryScenario } from "@/lib/factory";

interface ScenarioStepProps {
  scenario: FactoryScenario | null;
  isSandboxRunning: boolean;
  onInitialize: (jobs?: number, machines?: number) => void;
  onGenerateStrategies: () => void;
}

export function ScenarioStep({ scenario, isSandboxRunning, onInitialize, onGenerateStrategies }: ScenarioStepProps) {
  const [jobCount, setJobCount] = useState(8);
  const [machineCount, setMachineCount] = useState(4);

  return (
    <div className="space-y-4 animate-slide-in">
      <StepExplainer
        title="Step 1 — Define Your World"
        description="Create your factory environment. Everything the system does will optimize within these constraints."
        detail="Configure jobs, machines, budget, and time limits for the simulation"
      />

      {!scenario ? (
        <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 space-y-5 animate-slide-in">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Factory Parameters</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                Jobs ({jobCount})
              </label>
              <input
                type="range"
                min={4}
                max={16}
                value={jobCount}
                onChange={e => setJobCount(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>4 jobs</span>
                <span>16 jobs</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                Machines ({machineCount})
              </label>
              <input
                type="range"
                min={2}
                max={8}
                value={machineCount}
                onChange={e => setMachineCount(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>2 machines</span>
                <span>8 machines</span>
              </div>
            </div>
          </div>

          <Button onClick={() => onInitialize(jobCount, machineCount)} className="w-full gap-2 font-mono text-xs glow-cyan">
            <Factory className="w-3.5 h-3.5" />
            Create Factory Scenario
          </Button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-4 animate-slide-in">
          <ScenarioPanel scenario={scenario} />
          <Button
            onClick={onGenerateStrategies}
            disabled={isSandboxRunning}
            size="lg"
            className="w-full gap-2 font-mono text-sm glow-cyan"
          >
            <Brain className="w-4 h-4" />
            {isSandboxRunning ? "Generating Strategies..." : "Generate AI Strategies →"}
          </Button>
        </div>
      )}
    </div>
  );
}
