import { FactoryStation } from "@/lib/sdmf";
import { FlowParticles } from "@/components/sdmf/FlowParticles";
import { Activity, Thermometer, Gauge, AlertTriangle, CheckCircle, Wrench, RefreshCw, Wifi } from "lucide-react";

const STATUS_CONFIG: Record<FactoryStation['status'], { icon: React.ElementType; color: string; label: string }> = {
  online: { icon: CheckCircle, color: 'text-success', label: 'Online' },
  running: { icon: Activity, color: 'text-primary', label: 'Running' },
  offline: { icon: AlertTriangle, color: 'text-destructive', label: 'Offline' },
  maintenance: { icon: Wrench, color: 'text-accent', label: 'Maint.' },
  reconfiguring: { icon: RefreshCw, color: 'text-agent-balanced', label: 'Reconfig' },
};

interface DigitalTwinPanelProps {
  stations: FactoryStation[];
}

export function DigitalTwinPanel({ stations }: DigitalTwinPanelProps) {
  const onlineCount = stations.filter(s => s.status === 'online' || s.status === 'running').length;
  const avgUtil = Math.round(stations.reduce((s, st) => s + st.utilization, 0) / stations.length);
  const warningCount = stations.reduce((s, st) => s + st.sensors.filter(se => se.status !== 'normal').length, 0);

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-[10px] font-mono">
        <span className="flex items-center gap-1 text-success">
          <Wifi className="w-3 h-3" /> {onlineCount}/{stations.length} online
        </span>
        <span className="flex items-center gap-1 text-primary">
          <Gauge className="w-3 h-3" /> {avgUtil}% util
        </span>
        {warningCount > 0 && (
          <span className="flex items-center gap-1 text-accent">
            <AlertTriangle className="w-3 h-3" /> {warningCount} alerts
          </span>
        )}
      </div>

      {/* Station grid with particle overlay */}
      <div className="relative">
        <FlowParticles stations={stations} />
        <div className="grid grid-cols-2 gap-2 relative z-0">
        {stations.map(station => {
          const cfg = STATUS_CONFIG[station.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={station.id}
              className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-foreground truncate">{station.name}</span>
                <div className="flex items-center gap-1">
                  <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                  <span className={`text-[9px] font-mono ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {/* Utilization bar */}
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-0.5">
                    <span>Utilization</span>
                    <span className="text-foreground">{Math.round(station.utilization)}%</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${station.utilization}%` }}
                    />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="flex gap-2 text-[9px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Thermometer className="w-2.5 h-2.5" />
                    {Math.round(station.temperature)}°C
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Activity className="w-2.5 h-2.5" />
                    {station.throughput}/h
                  </span>
                  <span>{station.uptime}% up</span>
                </div>

                {/* Sensor alerts */}
                {station.sensors.some(s => s.status !== 'normal') && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {station.sensors.filter(s => s.status !== 'normal').map(s => (
                      <span
                        key={s.id}
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                          s.status === 'critical'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-accent/20 text-accent'
                        }`}
                      >
                        {s.name}: {s.value.toFixed(1)}{s.unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}
