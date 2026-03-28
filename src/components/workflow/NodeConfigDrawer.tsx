import { WorkflowStage, StageConfig } from "@/lib/workflow";
import { Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge, X, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, React.ElementType> = {
  Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge,
};

interface NodeConfigDrawerProps {
  nodeId: string;
  label: string;
  icon: string;
  description: string;
  config: StageConfig;
  onUpdate: (field: keyof StageConfig, value: number) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeConfigDrawer({ nodeId, label, icon, description, config, onUpdate, onDelete, onClose }: NodeConfigDrawerProps) {
  const Icon = ICONS[icon] || Cog;

  return (
    <div className="bg-card border-l border-border w-72 flex flex-col h-full animate-slide-in">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">{description}</p>
        <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">ID: {nodeId}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <CSlider label="Machines" value={config.machineCount} min={1} max={10} step={1} onChange={v => onUpdate("machineCount", v)} />
        <CSlider label="Speed" value={config.speedMultiplier} min={0.2} max={3.0} step={0.1} unit="x" onChange={v => onUpdate("speedMultiplier", Math.round(v * 10) / 10)} />
        <CSlider label="Cost/Unit" value={config.costPerUnit} min={1} max={50} step={1} unit="$" prefix onChange={v => onUpdate("costPerUnit", v)} />
        <CSlider label="Defect Rate" value={config.defectRate * 100} min={0} max={20} step={0.5} unit="%" onChange={v => onUpdate("defectRate", v / 100)} />
        <CSlider label="Batch Size" value={config.batchSize} min={5} max={200} step={5} onChange={v => onUpdate("batchSize", v)} />
        <CSlider label="Max Capacity" value={config.maxCapacity} min={50} max={1000} step={10} onChange={v => onUpdate("maxCapacity", v)} />
      </div>

      <div className="p-4 border-t border-border">
        <Button variant="destructive" size="sm" className="w-full gap-1.5 font-mono text-xs" onClick={onDelete}>
          <Trash2 className="w-3 h-3" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}

function CSlider({ label, value, min, max, step, unit, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; prefix?: boolean; onChange: (v: number) => void;
}) {
  const display = prefix ? `${unit}${value}` : `${value}${unit ?? ""}`;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-semibold text-primary">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
