import { WorkflowStage, StageConfig } from "@/lib/workflow";
import { Cog, Flame, Paintbrush, Wrench, Search, Package, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const STAGE_ICONS: Record<string, React.ElementType> = {
  Cog, Flame, Paintbrush, Wrench, Search, Package,
};

interface StageConfigPanelProps {
  stage: WorkflowStage;
  onUpdate: (stageId: string, config: Partial<StageConfig>) => void;
  onClose: () => void;
}

export function StageConfigPanel({ stage, onUpdate, onClose }: StageConfigPanelProps) {
  const Icon = STAGE_ICONS[stage.icon] || Cog;

  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{stage.name} Configuration</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-5">{stage.description}</p>

      <div className="space-y-5">
        <ConfigSlider
          label="Machines"
          value={stage.config.machineCount}
          min={1} max={10} step={1}
          unit=""
          onChange={(v) => onUpdate(stage.id, { machineCount: v })}
        />
        <ConfigSlider
          label="Speed Multiplier"
          value={stage.config.speedMultiplier}
          min={0.2} max={3.0} step={0.1}
          unit="x"
          onChange={(v) => onUpdate(stage.id, { speedMultiplier: Math.round(v * 10) / 10 })}
        />
        <ConfigSlider
          label="Cost per Unit"
          value={stage.config.costPerUnit}
          min={1} max={50} step={1}
          unit="$"
          prefix
          onChange={(v) => onUpdate(stage.id, { costPerUnit: v })}
        />
        <ConfigSlider
          label="Defect Rate"
          value={stage.config.defectRate * 100}
          min={0} max={20} step={0.5}
          unit="%"
          onChange={(v) => onUpdate(stage.id, { defectRate: v / 100 })}
        />
        <ConfigSlider
          label="Batch Size"
          value={stage.config.batchSize}
          min={5} max={200} step={5}
          unit=""
          onChange={(v) => onUpdate(stage.id, { batchSize: v })}
        />
        <ConfigSlider
          label="Max Capacity"
          value={stage.config.maxCapacity}
          min={50} max={1000} step={10}
          unit=""
          onChange={(v) => onUpdate(stage.id, { maxCapacity: v })}
        />
      </div>
    </div>
  );
}

interface ConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  prefix?: boolean;
  onChange: (value: number) => void;
}

function ConfigSlider({ label, value, min, max, step, unit, prefix, onChange }: ConfigSliderProps) {
  const display = prefix ? `${unit}${value}` : `${value}${unit}`;

  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-semibold text-primary">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}
