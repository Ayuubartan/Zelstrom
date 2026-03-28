import {
  DollarSign, Zap, Award, Target, ShieldAlert, Gauge,
  Thermometer, Factory, Wrench, Users, Package, CalendarClock,
} from "lucide-react";
import type { Objectives, FactorySettings } from "@/lib/objectives";

interface FactoryConfigSummaryProps {
  objectives: Objectives;
  factorySettings: FactorySettings;
}

export function FactoryConfigSummary({ objectives, factorySettings }: FactoryConfigSummaryProps) {
  const w = objectives.weights;
  const c = objectives.constraints;
  const p = factorySettings.productionParams;
  const e = factorySettings.environment;
  const m = factorySettings.maintenance;
  const mat = factorySettings.materials;
  const wf = factorySettings.workforce;
  const shifts = factorySettings.shiftPatterns;
  const activeMachines = factorySettings.machineTypes.filter(m => m.enabled);
  const totalMachineCount = activeMachines.reduce((s, m) => s + m.count, 0);

  // Determine dominant priority
  const dominant = w.cost >= w.speed && w.cost >= w.quality
    ? { label: "Cost-Focused", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" }
    : w.speed >= w.quality
    ? { label: "Speed-Focused", color: "text-primary", bg: "bg-primary/10 border-primary/30" }
    : { label: "Quality-Focused", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30" };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Factory className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
          Configuration Summary
        </h3>
        <span className={`ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border ${dominant.bg} ${dominant.color}`}>
          {dominant.label}
        </span>
      </div>

      {/* Priority bar */}
      <div className="space-y-1">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-400/70 transition-all" style={{ width: `${w.cost}%` }} />
          <div className="bg-primary/70 transition-all" style={{ width: `${w.speed}%` }} />
          <div className="bg-violet-400/70 transition-all" style={{ width: `${w.quality}%` }} />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5 text-emerald-400" />Cost {w.cost}%</span>
          <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-primary" />Speed {w.speed}%</span>
          <span className="flex items-center gap-1"><Award className="w-2.5 h-2.5 text-violet-400" />Quality {w.quality}%</span>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard icon={Target} label="KPIs" value={`${objectives.kpiTargets.length}`} sub="targets" />
        <MetricCard icon={Gauge} label="Machines" value={`${totalMachineCount}`} sub={`${activeMachines.length} types`} />
        <MetricCard icon={ShieldAlert} label="Budget" value={`$${c.maxBudget}`} sub="max" />
        <MetricCard icon={CalendarClock} label="Shifts" value={`${shifts.filter(s => s.enabled).length}`} sub="active" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard icon={Users} label="Operators" value={`${wf.operatorsPerShift}`} sub={wf.operatorSkillLevel} />
        <MetricCard icon={Wrench} label="Maint." value={`${m.preventiveIntervalHours}h`} sub="interval" />
        <MetricCard icon={Package} label="Steel" value={`$${mat.steelPerKg}`} sub="/kg" />
        <MetricCard icon={Zap} label="Automation" value={`${wf.automationLevel}%`} sub="level" />
      </div>

      {/* Active machines list */}
      <div className="flex flex-wrap gap-1">
        {activeMachines.map(m => (
          <span key={m.id} className="text-[8px] font-mono bg-secondary/60 border border-border rounded px-1.5 py-0.5 text-muted-foreground">
            {m.name} ×{m.count}
          </span>
        ))}
      </div>

      {/* Production params row */}
      <div className="flex gap-3 text-[9px] font-mono text-muted-foreground border-t border-border/50 pt-2">
        <span>Speed: <span className="text-foreground font-bold">{p.speedMultiplier}x</span></span>
        <span>Cost/unit: <span className="text-foreground font-bold">${p.costPerUnit}</span></span>
        <span>Defect: <span className="text-foreground font-bold">{p.defectRate}%</span></span>
        <span>Batch: <span className="text-foreground font-bold">{p.batchSize}</span></span>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub: string;
}) {
  return (
    <div className="bg-secondary/40 rounded-md p-2 text-center">
      <Icon className="w-3 h-3 text-primary mx-auto mb-1" />
      <p className="text-xs font-mono font-bold text-foreground">{value}</p>
      <p className="text-[8px] font-mono text-muted-foreground">{label} {sub}</p>
    </div>
  );
}
