import { type EvolutionGeneration } from "@/lib/sdmf";
import { type PipelineRunResult } from "@/lib/feedback-bridge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ProjectedVsActualChartProps {
  generations: EvolutionGeneration[];
  pipelineResults: PipelineRunResult[];
}

interface ChartRow {
  label: string;
  projectedThroughput: number;
  actualThroughput: number | null;
  projectedCost: number;
  actualCost: number | null;
  projectedDefects: number;
  actualDefects: number | null;
}

export function ProjectedVsActualChart({ generations, pipelineResults }: ProjectedVsActualChartProps) {
  // Build rows: one per generation that has a survivor
  const rows: ChartRow[] = generations
    .filter(g => g.survivor)
    .map(g => {
      const survivor = g.survivor!;
      // Find matching pipeline result (deployed from this generation)
      const actual = pipelineResults.find(r => r.deployedGenerationId === g.id);

      return {
        label: `G${g.id}`,
        projectedThroughput: survivor.projectedThroughput,
        actualThroughput: actual ? actual.totals.totalUnitsOut : null,
        projectedCost: survivor.projectedCost,
        actualCost: actual ? actual.totals.totalCost : null,
        projectedDefects: Math.round(survivor.projectedDefectRate * 100),
        actualDefects: actual ? actual.totals.totalDefects : null,
      };
    })
    .slice(-8); // last 8 generations

  if (rows.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-[10px] font-mono">
        Run generations and deploy to see projected vs actual data.
      </div>
    );
  }

  const hasActual = rows.some(r => r.actualThroughput !== null);

  const tooltipStyle = {
    backgroundColor: 'hsl(220, 18%, 10%)',
    border: '1px solid hsl(220, 15%, 18%)',
    borderRadius: '6px',
    fontSize: '10px',
    fontFamily: 'monospace',
  };

  const tickStyle = { fontSize: 9, fill: 'hsl(215, 15%, 50%)' };

  return (
    <div className="space-y-3">
      {/* Throughput comparison */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Throughput — Projected vs Actual
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Bar dataKey="projectedThroughput" name="Projected" fill="hsl(185, 80%, 50%)" opacity={0.6} radius={[2, 2, 0, 0]} />
              {hasActual && (
                <Bar dataKey="actualThroughput" name="Actual" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost comparison */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Cost ($) — Projected vs Actual
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Bar dataKey="projectedCost" name="Projected" fill="hsl(35, 90%, 55%)" opacity={0.6} radius={[2, 2, 0, 0]} />
              {hasActual && (
                <Bar dataKey="actualCost" name="Actual" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Defects comparison */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Defects — Projected vs Actual
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Bar dataKey="projectedDefects" name="Projected %" fill="hsl(270, 60%, 55%)" opacity={0.6} radius={[2, 2, 0, 0]} />
              {hasActual && (
                <Bar dataKey="actualDefects" name="Actual" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!hasActual && (
        <p className="text-[9px] font-mono text-muted-foreground text-center italic">
          Deploy a generation and run the pipeline to see actual data overlay.
        </p>
      )}
    </div>
  );
}
