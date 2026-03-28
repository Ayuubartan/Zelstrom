import { FactoryScenario } from "@/lib/factory";
import { Cpu, Box } from "lucide-react";

interface ScenarioPanelProps {
  scenario: FactoryScenario | null;
}

export function ScenarioPanel({ scenario }: ScenarioPanelProps) {
  if (!scenario) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Box className="w-4 h-4 text-primary" />
        <span>Factory Scenario</span>
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Jobs</p>
          <p className="text-2xl font-mono font-bold text-foreground">{scenario.jobs.length}</p>
        </div>
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Machines</p>
          <p className="text-2xl font-mono font-bold text-foreground">{scenario.machines.length}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Machines</p>
        {scenario.machines.map((m) => (
          <div key={m.id} className="flex items-center gap-2 bg-secondary/30 rounded px-3 py-2">
            <Cpu className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-xs font-mono text-foreground flex-1">{m.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{m.speedMultiplier.toFixed(1)}x</span>
            <span className="text-[10px] text-accent font-mono">${m.costPerMinute}/m</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground font-mono">
        <span>Budget: <span className="text-accent">${scenario.maxBudget}</span></span>
        <span>Time: <span className="text-primary">{scenario.maxTime}m</span></span>
      </div>
    </div>
  );
}
