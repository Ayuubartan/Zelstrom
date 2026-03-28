import { WorkflowStage, StageStatus } from "@/lib/workflow";
import { Cog, Flame, Paintbrush, Wrench, Search, Package, ChevronRight, Settings2 } from "lucide-react";

const STAGE_ICONS: Record<string, React.ElementType> = {
  Cog, Flame, Paintbrush, Wrench, Search, Package,
};

const STATUS_STYLES: Record<StageStatus, string> = {
  idle: "border-border bg-card",
  queued: "border-accent/40 bg-card",
  running: "border-primary/50 bg-primary/5 glow-cyan",
  completed: "border-success/40 bg-success/5",
  error: "border-destructive/40 bg-destructive/5",
  paused: "border-warning/40 bg-card",
};

const STATUS_BADGES: Record<StageStatus, { label: string; className: string }> = {
  idle: { label: "IDLE", className: "text-muted-foreground bg-muted" },
  queued: { label: "QUEUED", className: "text-accent bg-accent/10" },
  running: { label: "RUNNING", className: "text-primary bg-primary/10 animate-pulse-glow" },
  completed: { label: "DONE", className: "text-success bg-success/10" },
  error: { label: "ERROR", className: "text-destructive bg-destructive/10" },
  paused: { label: "PAUSED", className: "text-warning bg-warning/10" },
};

interface StageNodeProps {
  stage: WorkflowStage;
  isLast: boolean;
  onSelect: (stage: WorkflowStage) => void;
  isSelected: boolean;
}

export function StageNode({ stage, isLast, onSelect, isSelected }: StageNodeProps) {
  const Icon = STAGE_ICONS[stage.icon] || Cog;
  const badge = STATUS_BADGES[stage.status];

  return (
    <div className="flex items-center">
      <button
        onClick={() => onSelect(stage)}
        className={`relative border rounded-lg p-4 w-44 transition-all duration-200 cursor-pointer text-left ${STATUS_STYLES[stage.status]} ${isSelected ? "ring-2 ring-primary/50" : "hover:ring-1 hover:ring-primary/30"}`}
      >
        {/* Status badge */}
        <span className={`absolute -top-2 right-2 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${badge.className}`}>
          {badge.label}
        </span>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 bg-secondary rounded">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground leading-tight">{stage.name}</span>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {stage.description}
        </p>

        {/* Metrics row */}
        {stage.metrics.unitsProcessed > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            <MiniStat label="Units" value={stage.metrics.unitsProcessed} />
            <MiniStat label="Cost" value={`$${stage.metrics.totalCost}`} />
            <MiniStat label="Defects" value={stage.metrics.defectsFound} warn={stage.metrics.defectsFound > 0} />
            <MiniStat label="Util" value={`${stage.metrics.utilization}%`} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <MiniStat label="Machines" value={stage.config.machineCount} />
            <MiniStat label="$/unit" value={`$${stage.config.costPerUnit}`} />
            <MiniStat label="Speed" value={`${stage.config.speedMultiplier}x`} />
            <MiniStat label="Batch" value={stage.config.batchSize} />
          </div>
        )}

        <div className="absolute bottom-2 right-2 text-muted-foreground/40">
          <Settings2 className="w-3 h-3" />
        </div>
      </button>

      {/* Connector arrow */}
      {!isLast && (
        <div className="flex items-center mx-1">
          <div className="w-6 h-px bg-border" />
          <ChevronRight className="w-3 h-3 text-muted-foreground/50 -ml-1" />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded px-1.5 py-1">
      <p className="text-[8px] text-muted-foreground uppercase font-mono">{label}</p>
      <p className={`text-[11px] font-mono font-semibold ${warn ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
