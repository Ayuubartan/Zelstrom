import { useState } from "react";
import { type DeployedConfig } from "@/lib/deploy-bridge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  History,
  RotateCcw,
  Crown,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

interface DeployHistoryPanelProps {
  history: DeployedConfig[];
  activeDeployId: number | null;
  onRollback: (config: DeployedConfig) => void;
  onClose: () => void;
}

export function DeployHistoryPanel({
  history,
  activeDeployId,
  onRollback,
  onClose,
}: DeployHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const sorted = [...history].reverse();

  return (
    <div className="h-full flex flex-col border-l border-border bg-card/95 backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-[11px] font-mono font-bold text-foreground uppercase tracking-wider">
            Deploy History
          </h2>
          <Badge variant="secondary" className="text-[9px] font-mono h-4 px-1.5">
            {history.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-[10px] font-mono">
              No deployments yet.
              <br />
              Deploy from the SDMF Command Center.
            </div>
          ) : (
            sorted.map((deploy) => {
              const isActive = deploy.generationId === activeDeployId && deploy.timestamp === sorted.find(d => d.generationId === activeDeployId)?.timestamp;
              const isExpanded = expandedId === deploy.timestamp;
              const stageTypes = Object.keys(deploy.stageConfigs);

              return (
                <div
                  key={deploy.timestamp}
                  className={`rounded-lg border p-3 space-y-2 transition-colors ${
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  {/* Entry header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-3 h-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <span className="text-[10px] font-mono font-bold text-foreground">
                          Gen {deploy.generationId}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5">
                          · {deploy.agentName}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <Badge className="text-[8px] h-4 px-1.5 bg-primary/20 text-primary border-0">
                        ACTIVE
                      </Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(deploy.timestamp).toLocaleString()}
                    </span>
                    <span>Score: <span className="text-foreground font-bold">{deploy.score}</span></span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : deploy.timestamp)}
                    className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {stageTypes.length} stage configs
                  </button>

                  {/* Expanded stage details */}
                  {isExpanded && (
                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                      {stageTypes.map((type) => {
                        const cfg = deploy.stageConfigs[type];
                        return (
                          <div key={type} className="bg-background/50 rounded px-2 py-1.5">
                            <div className="text-[9px] font-mono font-bold text-foreground uppercase mb-1">
                              {type}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px] font-mono text-muted-foreground">
                              <span>Machines: <span className="text-foreground">{cfg.machineCount}</span></span>
                              <span>Speed: <span className="text-foreground">{cfg.speedMultiplier}x</span></span>
                              <span>Cost/u: <span className="text-foreground">${cfg.costPerUnit}</span></span>
                              <span>Defect: <span className="text-foreground">{(cfg.defectRate * 100).toFixed(1)}%</span></span>
                              <span>Batch: <span className="text-foreground">{cfg.batchSize}</span></span>
                              <span>Cap: <span className="text-foreground">{cfg.maxCapacity}</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rollback button */}
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRollback(deploy)}
                      className="w-full gap-1.5 font-mono text-[9px] h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Rollback to this config
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
