import { SimulationResult } from "@/lib/factory";
import { Terminal } from "lucide-react";

interface CompetitionLogProps {
  results: SimulationResult[];
  round: number;
}

export function CompetitionLog({ results, round }: CompetitionLogProps) {
  if (results.length === 0) return null;

  const winner = results[0];

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-primary" />
        Competition Log — Round {round}
      </h3>
      <div className="space-y-1.5 font-mono text-xs">
        <LogLine type="info" text={`[SYS] Initializing competition round ${round}...`} />
        <LogLine type="info" text={`[SYS] ${results.length} agents loaded. Starting simulation.`} />
        {results.map((r, i) => (
          <LogLine
            key={r.agentId}
            type={i === 0 ? "success" : "default"}
            text={`[${r.agentName.toUpperCase()}] Score: ${r.score} | Cost: $${r.totalCost} | Time: ${r.totalTime}m | Throughput: ${r.throughput} j/m`}
          />
        ))}
        <LogLine type="success" text={`[RESULT] Winner: ${winner.agentName} with score ${winner.score}/100`} />
        <LogLine type="info" text="[SYS] Round complete. Ready for next cycle." />
      </div>
    </div>
  );
}

function LogLine({ type, text }: { type: 'info' | 'success' | 'default'; text: string }) {
  const colors = {
    info: 'text-primary/80',
    success: 'text-success',
    default: 'text-muted-foreground',
  };

  return (
    <p className={`${colors[type]} leading-relaxed`}>
      <span className="text-muted-foreground/50 mr-2">{'>'}</span>
      {text}
    </p>
  );
}
