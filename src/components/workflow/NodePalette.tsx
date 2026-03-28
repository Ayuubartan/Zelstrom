import { DragEvent } from "react";
import { Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge, GripVertical } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Cog, Flame, Paintbrush, Wrench, Search, Package, Cpu, Zap, Truck, Gauge,
};

export interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  description: string;
  defaultConfig: {
    machineCount: number;
    speedMultiplier: number;
    costPerUnit: number;
    defectRate: number;
    batchSize: number;
    maxCapacity: number;
  };
}

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "cnc",
    label: "CNC Machining",
    icon: "Cog",
    description: "Precision cutting, milling, and shaping of raw materials",
    defaultConfig: { machineCount: 3, speedMultiplier: 1.0, costPerUnit: 12, defectRate: 0.02, batchSize: 50, maxCapacity: 200 },
  },
  {
    type: "welding",
    label: "Welding",
    icon: "Flame",
    description: "Arc, MIG, or TIG welding of metal components",
    defaultConfig: { machineCount: 2, speedMultiplier: 0.8, costPerUnit: 18, defectRate: 0.05, batchSize: 30, maxCapacity: 120 },
  },
  {
    type: "painting",
    label: "Painting",
    icon: "Paintbrush",
    description: "Surface coating with primer and protective finish",
    defaultConfig: { machineCount: 2, speedMultiplier: 1.2, costPerUnit: 8, defectRate: 0.03, batchSize: 40, maxCapacity: 160 },
  },
  {
    type: "assembly",
    label: "Assembly",
    icon: "Wrench",
    description: "Combining sub-components into final assemblies",
    defaultConfig: { machineCount: 4, speedMultiplier: 0.9, costPerUnit: 15, defectRate: 0.04, batchSize: 25, maxCapacity: 150 },
  },
  {
    type: "qc",
    label: "Quality Control",
    icon: "Search",
    description: "Inspection for dimensional accuracy and defects",
    defaultConfig: { machineCount: 2, speedMultiplier: 1.5, costPerUnit: 6, defectRate: 0.01, batchSize: 60, maxCapacity: 300 },
  },
  {
    type: "packaging",
    label: "Packaging",
    icon: "Package",
    description: "Wrapping, labeling, and shipment preparation",
    defaultConfig: { machineCount: 2, speedMultiplier: 1.4, costPerUnit: 4, defectRate: 0.01, batchSize: 80, maxCapacity: 400 },
  },
  {
    type: "laser",
    label: "Laser Cutting",
    icon: "Zap",
    description: "High-precision laser cutting and engraving",
    defaultConfig: { machineCount: 1, speedMultiplier: 1.8, costPerUnit: 22, defectRate: 0.01, batchSize: 20, maxCapacity: 100 },
  },
  {
    type: "grinding",
    label: "Precision Grinding",
    icon: "Gauge",
    description: "Surface grinding for tight tolerances",
    defaultConfig: { machineCount: 2, speedMultiplier: 0.7, costPerUnit: 16, defectRate: 0.03, batchSize: 25, maxCapacity: 100 },
  },
  {
    type: "transport",
    label: "Material Transport",
    icon: "Truck",
    description: "Automated material handling between stations",
    defaultConfig: { machineCount: 3, speedMultiplier: 2.0, costPerUnit: 2, defectRate: 0.005, batchSize: 100, maxCapacity: 500 },
  },
  {
    type: "plc",
    label: "PLC Controller",
    icon: "Cpu",
    description: "Programmable logic controller for automation",
    defaultConfig: { machineCount: 1, speedMultiplier: 3.0, costPerUnit: 1, defectRate: 0.0, batchSize: 200, maxCapacity: 1000 },
  },
];

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const onDragStart = (event: DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={`bg-card border-r border-border flex flex-col h-full ${className ?? ""}`}>
      <div className="p-4 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground mb-1">Node Palette</h2>
        <p className="text-[10px] text-muted-foreground">Drag nodes onto the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {PALETTE_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] || Cog;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border
                         cursor-grab active:cursor-grabbing hover:bg-secondary/80 hover:border-primary/30
                         transition-all duration-150 group"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
              <div className="p-1.5 bg-primary/10 rounded shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">{item.label}</p>
                <p className="text-[9px] text-muted-foreground truncate">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
