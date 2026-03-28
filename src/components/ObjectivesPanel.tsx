import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Target, Scale, ShieldAlert, Plus, X, ChevronDown, ChevronUp,
  DollarSign, Zap, Award, Thermometer, Gauge, BatteryCharging, Clock,
} from "lucide-react";
import type { Objectives, KPITarget, FactorySettings, MachineTypeConfig } from "@/lib/objectives";

interface ObjectivesPanelProps {
  objectives: Objectives;
  factorySettings: FactorySettings;
  onObjectivesChange: (o: Objectives) => void;
  onFactorySettingsChange: (s: FactorySettings) => void;
}

const METRIC_OPTIONS: { value: KPITarget["metric"]; label: string; unit: string }[] = [
  { value: "cost", label: "Cost", unit: "$" },
  { value: "throughput", label: "Throughput", unit: "j/m" },
  { value: "defectRate", label: "Defect Rate", unit: "%" },
  { value: "time", label: "Time", unit: "min" },
  { value: "score", label: "Score", unit: "/100" },
];

const MACHINE_ICONS: Record<string, React.ElementType> = {
  cnc: Gauge, welding: Zap, laser: Target, plc: BatteryCharging, press: ShieldAlert, robot: Scale,
};

export function ObjectivesPanel({
  objectives,
  factorySettings,
  onObjectivesChange,
  onFactorySettingsChange,
}: ObjectivesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["weights", "kpis", "constraints", "machines", "production", "environment"])
  );

  const toggleSection = (s: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const updateWeight = (key: "cost" | "speed" | "quality", val: number) => {
    const total = objectives.weights.cost + objectives.weights.speed + objectives.weights.quality;
    const oldVal = objectives.weights[key];
    const diff = val - oldVal;
    // Normalize other two to keep sum = 100
    const otherKeys = (["cost", "speed", "quality"] as const).filter(k => k !== key);
    const otherTotal = otherKeys.reduce((s, k) => s + objectives.weights[k], 0);
    const newWeights = { ...objectives.weights, [key]: val };
    if (otherTotal > 0) {
      otherKeys.forEach(k => {
        newWeights[k] = Math.max(0, Math.round(objectives.weights[k] - (diff * objectives.weights[k] / otherTotal)));
      });
    }
    // Fix rounding
    const sum = newWeights.cost + newWeights.speed + newWeights.quality;
    if (sum !== 100) newWeights[otherKeys[0]] += 100 - sum;
    onObjectivesChange({ ...objectives, weights: newWeights });
  };

  const addKPI = () => {
    const newKPI: KPITarget = {
      id: `kpi-${Date.now()}`,
      label: "New Target",
      metric: "score",
      operator: ">",
      value: 50,
      unit: "/100",
    };
    onObjectivesChange({ ...objectives, kpiTargets: [...objectives.kpiTargets, newKPI] });
  };

  const removeKPI = (id: string) => {
    onObjectivesChange({ ...objectives, kpiTargets: objectives.kpiTargets.filter(k => k.id !== id) });
  };

  const updateKPI = (id: string, updates: Partial<KPITarget>) => {
    onObjectivesChange({
      ...objectives,
      kpiTargets: objectives.kpiTargets.map(k => k.id === id ? { ...k, ...updates } : k),
    });
  };

  const updateConstraint = (key: string, val: number) => {
    onObjectivesChange({ ...objectives, constraints: { ...objectives.constraints, [key]: val } });
  };

  const updateMachine = (id: string, updates: Partial<MachineTypeConfig>) => {
    onFactorySettingsChange({
      ...factorySettings,
      machineTypes: factorySettings.machineTypes.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  };

  const w = objectives.weights;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* ---- Priority Weights ---- */}
      <SectionHeader
        icon={Scale}
        title="Priority Weights"
        badge={`${w.cost}/${w.speed}/${w.quality}`}
        expanded={expandedSections.has("weights"}
        onToggle={() => toggleSection("weights")}
      />
      {expandedSections.has("weights" && (
        <div className="px-4 pb-4 space-y-3">
          <WeightSlider label="Cost" icon={DollarSign} value={w.cost} onChange={v => updateWeight("cost", v)} color="text-emerald-400" />
          <WeightSlider label="Speed" icon={Zap} value={w.speed} onChange={v => updateWeight("speed", v)} color="text-primary" />
          <WeightSlider label="Quality" icon={Award} value={w.quality} onChange={v => updateWeight("quality", v)} color="text-violet-400" />
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400/60 transition-all" style={{ width: `${w.cost}%` }} />
            <div className="bg-primary/60 transition-all" style={{ width: `${w.speed}%` }} />
            <div className="bg-violet-400/60 transition-all" style={{ width: `${w.quality}%` }} />
          </div>
        </div>
      )}

      {/* ---- KPI Targets ---- */}
      <SectionHeader
        icon={Target}
        title="KPI Targets"
        badge={`${objectives.kpiTargets.length} targets`}
        expanded={expandedSections.has("kpis"}
        onToggle={() => toggleSection("kpis")}
      />
      {expandedSections.has("kpis" && (
        <div className="px-4 pb-4 space-y-2">
          {objectives.kpiTargets.map(kpi => (
            <div key={kpi.id} className="flex items-center gap-2 bg-secondary/50 rounded-md p-2">
              <select
                value={kpi.metric}
                onChange={e => {
                  const opt = METRIC_OPTIONS.find(o => o.value === e.target.value)!;
                  updateKPI(kpi.id, { metric: opt.value as KPITarget["metric"], unit: opt.unit });
                }}
                className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground"
              >
                {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={kpi.operator}
                onChange={e => updateKPI(kpi.id, { operator: e.target.value as KPITarget["operator"] })}
                className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground w-10"
              >
                {["<", ">", "=", "<=", ">="].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <input
                type="number"
                value={kpi.value}
                onChange={e => updateKPI(kpi.id, { value: Number(e.target.value) })}
                className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground w-16"
              />
              <span className="text-[9px] font-mono text-muted-foreground">{kpi.unit}</span>
              <button onClick={() => removeKPI(kpi.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <Button onClick={addKPI} variant="outline" size="sm" className="w-full gap-1 text-[10px] font-mono">
            <Plus className="w-3 h-3" /> Add KPI Target
          </Button>
        </div>
      )}

      {/* ---- Constraints ---- */}
      <SectionHeader
        icon={ShieldAlert}
        title="Constraints"
        expanded={expandedSections.has("constraints"}
        onToggle={() => toggleSection("constraints")}
      />
      {expandedSections.has("constraints" && (
        <div className="px-4 pb-4 space-y-3">
          <ConstraintRow label="Max Budget" value={objectives.constraints.maxBudget} unit="$" onChange={v => updateConstraint("maxBudget", v)} min={100} max={10000} step={50} />
          <ConstraintRow label="Min Output" value={objectives.constraints.minOutput} unit="units" onChange={v => updateConstraint("minOutput", v)} min={10} max={500} step={10} />
          <ConstraintRow label="Max Time" value={objectives.constraints.maxTime} unit="min" onChange={v => updateConstraint("maxTime", v)} min={30} max={480} step={15} />
          <ConstraintRow label="Max Defect Rate" value={objectives.constraints.maxDefectRate} unit="%" onChange={v => updateConstraint("maxDefectRate", v)} min={0.5} max={15} step={0.5} />
        </div>
      )}

      {/* ---- Machine Types ---- */}
      <SectionHeader
        icon={Gauge}
        title="Machine Types"
        badge={`${factorySettings.machineTypes.filter(m => m.enabled).length} active`}
        expanded={expandedSections.has("machines"}
        onToggle={() => toggleSection("machines")}
      />
      {expandedSections.has("machines" && (
        <div className="px-4 pb-4 space-y-2">
          {factorySettings.machineTypes.map(m => {
            const MIcon = MACHINE_ICONS[m.type] || Gauge;
            return (
              <div key={m.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${m.enabled ? "bg-secondary/50" : "bg-secondary/20 opacity-60"}`}>
                <button
                  onClick={() => updateMachine(m.id, { enabled: !m.enabled })}
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] ${m.enabled ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                >
                  {m.enabled && "✓"}
                </button>
                <MIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-mono text-foreground flex-1">{m.name}</span>
                {m.enabled && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateMachine(m.id, { count: Math.max(0, m.count - 1) })} className="text-muted-foreground hover:text-foreground text-xs px-1">−</button>
                    <span className="text-[10px] font-mono font-bold text-foreground w-4 text-center">{m.count}</span>
                    <button onClick={() => updateMachine(m.id, { count: m.count + 1 })} className="text-muted-foreground hover:text-foreground text-xs px-1">+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Production Params ---- */}
      <SectionHeader
        icon={Zap}
        title="Production Parameters"
        expanded={expandedSections.has("production"}
        onToggle={() => toggleSection("production")}
      />
      {expandedSections.has("production" && (
        <div className="px-4 pb-4 space-y-3">
          <ConstraintRow label="Speed Multiplier" value={factorySettings.productionParams.speedMultiplier} unit="x" onChange={v => onFactorySettingsChange({ ...factorySettings, productionParams: { ...factorySettings.productionParams, speedMultiplier: v } })} min={0.5} max={3} step={0.1} />
          <ConstraintRow label="Cost Per Unit" value={factorySettings.productionParams.costPerUnit} unit="$" onChange={v => onFactorySettingsChange({ ...factorySettings, productionParams: { ...factorySettings.productionParams, costPerUnit: v } })} min={1} max={100} step={1} />
          <ConstraintRow label="Defect Rate" value={factorySettings.productionParams.defectRate} unit="%" onChange={v => onFactorySettingsChange({ ...factorySettings, productionParams: { ...factorySettings.productionParams, defectRate: v } })} min={0} max={10} step={0.5} />
          <ConstraintRow label="Batch Size" value={factorySettings.productionParams.batchSize} unit="units" onChange={v => onFactorySettingsChange({ ...factorySettings, productionParams: { ...factorySettings.productionParams, batchSize: v } })} min={1} max={100} step={5} />
        </div>
      )}

      {/* ---- Environment ---- */}
      <SectionHeader
        icon={Thermometer}
        title="Environment Conditions"
        expanded={expandedSections.has("environment"}
        onToggle={() => toggleSection("environment")}
      />
      {expandedSections.has("environment" && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Temperature Range</span>
              <span className="text-[10px] font-mono text-foreground">{factorySettings.environment.temperatureRange[0]}°C – {factorySettings.environment.temperatureRange[1]}°C</span>
            </div>
            <div className="flex gap-2">
              <input type="number" value={factorySettings.environment.temperatureRange[0]} onChange={e => onFactorySettingsChange({ ...factorySettings, environment: { ...factorySettings.environment, temperatureRange: [Number(e.target.value), factorySettings.environment.temperatureRange[1]] } })} className="bg-background border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground w-16" />
              <span className="text-muted-foreground text-xs self-center">to</span>
              <input type="number" value={factorySettings.environment.temperatureRange[1]} onChange={e => onFactorySettingsChange({ ...factorySettings, environment: { ...factorySettings.environment, temperatureRange: [factorySettings.environment.temperatureRange[0], Number(e.target.value)] } })} className="bg-background border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground w-16" />
            </div>
          </div>
          <ConstraintRow label="Pressure Limit" value={factorySettings.environment.pressureLimit} unit="bar" onChange={v => onFactorySettingsChange({ ...factorySettings, environment: { ...factorySettings.environment, pressureLimit: v } })} min={1} max={50} step={1} />
          <ConstraintRow label="Energy Cost" value={factorySettings.environment.energyCostPerKwh} unit="$/kWh" onChange={v => onFactorySettingsChange({ ...factorySettings, environment: { ...factorySettings.environment, energyCostPerKwh: v } })} min={0.01} max={1} step={0.01} />
          <ConstraintRow label="Shifts Per Day" value={factorySettings.environment.shiftsPerDay} unit="shifts" onChange={v => onFactorySettingsChange({ ...factorySettings, environment: { ...factorySettings.environment, shiftsPerDay: v } })} min={1} max={3} step={1} />
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function SectionHeader({ icon: Icon, title, badge, expanded, onToggle }: {
  icon: React.ElementType; title: string; badge?: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground flex-1 text-left">{title}</span>
      {badge && <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">{badge}</Badge>}
      {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

function WeightSlider({ label, icon: Icon, value, onChange, color }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${color}`} />
          <span className="text-[10px] font-mono text-foreground">{label}</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-foreground">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={100} step={5} className="w-full" />
    </div>
  );
}

function ConstraintRow({ label, value, unit, onChange, min, max, step }: {
  label: string; value: number; unit: string; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono font-bold text-foreground">{value} {unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}
