import { SimulationResult } from "@/lib/factory";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface ResultsChartProps {
  results: SimulationResult[];
}

export function ResultsChart({ results }: ResultsChartProps) {
  const barData = results.map(r => ({
    name: r.agentName.split(' ')[0],
    Score: r.score,
    fill: r.color,
  }));

  const radarData = [
    { metric: 'Score', ...Object.fromEntries(results.map(r => [r.agentName.split(' ')[0], r.score])) },
    { metric: 'Efficiency', ...Object.fromEntries(results.map(r => [r.agentName.split(' ')[0], Math.round(r.throughput * 30)])) },
    { metric: 'Cost Saving', ...Object.fromEntries(results.map(r => [r.agentName.split(' ')[0], Math.max(0, 100 - Math.round(r.totalCost / 5))])) },
    { metric: 'Speed', ...Object.fromEntries(results.map(r => [r.agentName.split(' ')[0], Math.max(0, 100 - r.totalTime)])) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Agent Scores</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={32}>
            <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }}
              labelStyle={{ color: 'hsl(200, 20%, 90%)' }}
              itemStyle={{ color: 'hsl(185, 80%, 50%)' }}
            />
            <Bar dataKey="Score" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Performance Radar</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(220, 15%, 18%)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            {results.map(r => (
              <Radar key={r.agentId} name={r.agentName.split(' ')[0]} dataKey={r.agentName.split(' ')[0]} stroke={r.color} fill={r.color} fillOpacity={0.15} strokeWidth={2} />
            ))}
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
