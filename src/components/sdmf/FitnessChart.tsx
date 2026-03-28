import { EvolutionGeneration } from "@/lib/sdmf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface FitnessChartProps {
  generations: EvolutionGeneration[];
}

export function FitnessChart({ generations }: FitnessChartProps) {
  const data = generations.map(g => ({
    gen: `G${g.id}`,
    fitness: g.fitnessScore,
    proposals: g.proposals.length,
    attacks: g.attacks.length,
    survived: g.proposals.filter(p => p.survived).length,
  }));

  if (data.length < 2) return null;

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
          <XAxis dataKey="gen" tick={{ fontSize: 9, fill: 'hsl(215, 15%, 50%)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(215, 15%, 50%)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 18%, 10%)',
              border: '1px solid hsl(220, 15%, 18%)',
              borderRadius: '6px',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono',
            }}
          />
          <Area type="monotone" dataKey="fitness" stroke="hsl(185, 80%, 50%)" fill="url(#fitGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
