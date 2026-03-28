import { useState, useEffect, useRef } from "react";
import { type SelfHealEvent } from "@/lib/self-healing";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RotateCcw,
  ArrowRightLeft,
  Gauge,
  Thermometer,
  Activity,
  Power,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SelfHealingLogProps {
  events: SelfHealEvent[];
}

const SEVERITY_STYLES = {
  warning: { bg: 'border-accent/30 bg-accent/5', text: 'text-accent', icon: AlertTriangle },
  critical: { bg: 'border-destructive/30 bg-destructive/5', text: 'text-destructive', icon: ShieldAlert },
  emergency: { bg: 'border-destructive/50 bg-destructive/10 ring-1 ring-destructive/20', text: 'text-destructive', icon: Zap },
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  'reroute-flow': ArrowRightLeft,
  'reduce-speed': Gauge,
  'activate-backup': Power,
  'cooldown-cycle': Thermometer,
  'recalibrate': RotateCcw,
  'bypass-station': ArrowRightLeft,
  'rebalance-load': Activity,
  'emergency-shutdown': XCircle,
};

const ANOMALY_LABELS: Record<string, string> = {
  'thermal-spike': 'THERMAL',
  'vibration-critical': 'VIBRATION',
  'pressure-loss': 'PRESSURE',
  'power-surge': 'POWER',
  'throughput-drop': 'THROUGHPUT',
  'defect-cascade': 'DEFECTS',
  'station-failure': 'FAILURE',
  'utilization-imbalance': 'IMBALANCE',
};

export function SelfHealingLog({ events }: SelfHealingLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const successCount = events.filter(e => e.success).length;
  const failCount = events.length - successCount;

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-[10px] font-mono">
        <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-success opacity-50" />
        All systems nominal.
        <br />
        No anomalies detected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-3 text-[9px] font-mono">
        <span className="flex items-center gap-1 text-success">
          <CheckCircle2 className="w-3 h-3" />
          {successCount} healed
        </span>
        {failCount > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="w-3 h-3" />
            {failCount} failed
          </span>
        )}
        <span className="text-muted-foreground">
          {events.length} total events
        </span>
      </div>

      {/* Event list */}
      <div ref={scrollRef} className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {events.map((event) => {
          const style = SEVERITY_STYLES[event.severity];
          const SevIcon = style.icon;
          const ActionIcon = ACTION_ICONS[event.action] || RotateCcw;
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              className={`rounded-lg border p-2.5 transition-all animate-fade-in ${style.bg}`}
            >
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full flex items-start gap-2 text-left"
              >
                <SevIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${style.text} ${event.severity === 'emergency' ? 'animate-pulse' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[7px] h-3.5 px-1 border-0 ${style.bg} ${style.text} font-bold`}
                    >
                      {ANOMALY_LABELS[event.anomalyType] ?? event.anomalyType}
                    </Badge>
                    <span className="text-[9px] font-mono text-foreground font-semibold truncate">
                      {event.stationName}
                    </span>
                    {event.success ? (
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive shrink-0" />
                    )}
                  </div>
                  <p className="text-[8px] font-mono text-muted-foreground mt-0.5 line-clamp-1">
                    {event.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] font-mono text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-border/30 space-y-2 animate-fade-in">
                  {/* Sensor data */}
                  {event.sensorValue !== undefined && (
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                      <span className="text-muted-foreground">Reading:</span>
                      <span className={`font-bold ${style.text}`}>
                        {event.sensorValue}{event.sensorUnit}
                      </span>
                      <span className="text-muted-foreground">→ Threshold:</span>
                      <span className="text-foreground font-bold">{event.threshold}{event.sensorUnit}</span>
                    </div>
                  )}

                  {/* Heal action */}
                  <div className="flex items-start gap-2 bg-background/30 rounded p-2">
                    <ActionIcon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[8px] font-mono text-primary uppercase font-bold">
                        {event.action.replace(/-/g, ' ')}
                      </div>
                      <p className="text-[9px] font-mono text-foreground mt-0.5">
                        {event.resolution}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground">
                    <span>Heal time: <span className="text-foreground">{event.durationMs}ms</span></span>
                    <span className={event.success ? 'text-success' : 'text-destructive'}>
                      {event.success ? '● RESOLVED' : '● UNRESOLVED'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
