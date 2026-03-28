import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <StepExplainer
        title="Step 1 — Define Your World"
        description="Create your factory environment. Everything the system does will optimize within these constraints."
        detail="Configure jobs, machines, budget, and time limits for the simulation"
      />

      {!scenario ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 space-y-5"
        >
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
                className="w-full accent-primary"
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
                className="w-full accent-primary"
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
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto space-y-4"
        >
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
        </motion.div>
      )}
    </motion.div>
  );
}
