import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge } from "lucide-react";
import type { StageStatus, StageConfig, StageMetrics } from "@/lib/workflow";

export type FactoryNodeData = {
  label: string;
  stageType: string;
  icon: string;
  description: string;
  status: StageStatus;
  config: StageConfig;
  metrics: StageMetrics;
};

export type FactoryNode = Node<FactoryNodeData, "factory">;

const ICONS: Record<string, React.ElementType> = {
  Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge,
};

const STATUS_RING: Record<StageStatus, string> = {
  idle: "ring-border",
  queued: "ring-accent/50",
  running: "ring-primary/70 animate-pulse-glow",
  completed: "ring-success/60",
  error: "ring-destructive/60",
  paused: "ring-warning/50",
};

const STATUS_DOT: Record<StageStatus, string> = {
  idle: "bg-muted-foreground",
  queued: "bg-accent",
  running: "bg-primary",
  completed: "bg-success",
  error: "bg-destructive",
  paused: "bg-warning",
};

function FactoryNodeComponent({ data, selected }: NodeProps<FactoryNode>) {
  const Icon = ICONS[data.icon] || Cog;
  const hasMetrics = data.metrics.unitsProcessed > 0;

  return (
    <div
      className={`
        relative bg-card border border-border rounded-xl w-[200px]
        shadow-lg shadow-black/20 transition-all duration-200
        ring-2 ${STATUS_RING[data.status]}
        ${selected ? "ring-primary/80 glow-cyan" : ""}
        hover:ring-primary/40
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-secondary !border-2 !border-primary/50 !-left-1.5"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3.5 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-foreground truncate">{data.label}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[data.status]}`} />
            <span className="text-[9px] font-mono uppercase text-muted-foreground">{data.status}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground leading-relaxed px-3.5 pb-2 line-clamp-2">
        {data.description}
      </p>

      {/* Stats */}
      <div className="border-t border-border mx-2 my-0" />
      <div className="grid grid-cols-2 gap-1 px-2.5 pb-2.5 pt-2">
        {hasMetrics ? (
          <>
            <MiniStat label="Processed" value={data.metrics.unitsProcessed} />
            <MiniStat label="Cost" value={`$${data.metrics.totalCost}`} />
            <MiniStat label="Defects" value={data.metrics.defectsFound} warn={data.metrics.defectsFound > 0} />
            <MiniStat label="Util" value={`${data.metrics.utilization}%`} />
          </>
        ) : (
          <>
            <MiniStat label="Machines" value={data.config.machineCount} />
            <MiniStat label="$/unit" value={`$${data.config.costPerUnit}`} />
            <MiniStat label="Speed" value={`${data.config.speedMultiplier}x`} />
            <MiniStat label="Capacity" value={data.config.maxCapacity} />
          </>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-secondary !border-2 !border-primary/50 !-right-1.5"
      />
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded px-1.5 py-1">
      <p className="text-[7px] text-muted-foreground uppercase font-mono leading-tight">{label}</p>
      <p className={`text-[10px] font-mono font-semibold leading-tight ${warn ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

export default memo(FactoryNodeComponent);
