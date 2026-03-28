import { LogicOverlay } from "@/lib/sdmf";
import { Layers, Cpu, Heart, Car, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";

const OVERLAY_ICONS: Record<string, React.ElementType> = {
  Electronics: Cpu,
  Medical: Heart,
  Automotive: Car,
  Aerospace: Plane,
};

interface LogicOverlayPanelProps {
  overlays: LogicOverlay[];
  activeId: string | null;
  onActivate: (overlay: LogicOverlay) => void;
}

export function LogicOverlayPanel({ overlays, activeId, onActivate }: LogicOverlayPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Logic Overlays</span>
      </div>

      {overlays.map(overlay => {
        const Icon = OVERLAY_ICONS[overlay.productType] || Layers;
        const isActive = overlay.id === activeId;

        return (
          <div
            key={overlay.id}
            className={`border rounded-lg p-3 transition-all cursor-pointer ${
              isActive
                ? 'border-primary/50 bg-primary/10 glow-cyan'
                : 'border-border bg-card hover:border-primary/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-[11px] font-semibold text-foreground">{overlay.name}</span>
            </div>
            <p className="text-[9px] text-muted-foreground mb-2">{overlay.description}</p>
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              className="w-full text-[9px] font-mono h-6"
              onClick={() => onActivate(overlay)}
            >
              {isActive ? 'Active' : 'Deploy Overlay'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
