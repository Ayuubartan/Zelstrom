import { useState, useCallback } from "react";
import {
  Workflow as WorkflowType,
  WorkflowStage,
  StageConfig,
  WorkflowOptimization,
  createDefaultWorkflow,
  simulateWorkflow,
  optimizeWorkflow,
} from "@/lib/workflow";
import { StageNode } from "@/components/StageNode";
import { StageConfigPanel } from "@/components/StageConfigPanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Factory, Play, RotateCcw, Sparkles, ArrowLeft,
  CheckCircle2, AlertTriangle, Clock, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const WorkflowPage = () => {
  const [workflow, setWorkflow] = useState<WorkflowType>(createDefaultWorkflow);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [optimizations, setOptimizations] = useState<WorkflowOptimization[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleUpdateConfig = useCallback((stageId: string, configUpdate: Partial<StageConfig>) => {
    setWorkflow(prev => ({
      ...prev,
      stages: prev.stages.map(s =>
        s.id === stageId ? { ...s, config: { ...s.config, ...configUpdate } } : s
      ),
    }));
    // Also update selectedStage so the panel reflects changes
    setSelectedStage(prev =>
      prev?.id === stageId ? { ...prev, config: { ...prev.config, ...configUpdate } } : prev
    );
  }, []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setOptimizations([]);
    setSelectedStage(null);

    // Animate stages sequentially
    const stageCount = workflow.stages.length;
    workflow.stages.forEach((_, i) => {
      setTimeout(() => {
        setWorkflow(prev => ({
          ...prev,
          status: 'running',
          stages: prev.stages.map((s, si) => ({
            ...s,
            status: si < i ? 'completed' : si === i ? 'running' : si === i + 1 ? 'queued' : s.status,
          })),
        }));
      }, i * 500);
    });

    // Complete
    setTimeout(() => {
      setWorkflow(prev => simulateWorkflow(prev));
      setIsRunning(false);
      toast.success("Workflow completed successfully");
    }, stageCount * 500 + 300);
  }, [workflow]);

  const handleOptimize = useCallback(() => {
    setOptimizations([]);
    setWorkflow(prev => ({ ...prev, status: 'optimizing' }));

    setTimeout(() => {
      const opts = optimizeWorkflow(workflow);
      setOptimizations(opts);
      toast.success(`${opts.length} agents analyzed your pipeline`);
    }, 600);
  }, [workflow]);

  const handleApplyOptimization = useCallback((opt: WorkflowOptimization) => {
    opt.suggestions.forEach(s => {
      handleUpdateConfig(s.stageId, { [s.field]: s.suggestedValue });
    });
    toast.success(`Applied ${opt.suggestions.length} changes from ${opt.agentName}`);
  }, [handleUpdateConfig]);

  const handleReset = useCallback(() => {
    setWorkflow(createDefaultWorkflow());
    setSelectedStage(null);
    setOptimizations([]);
  }, []);

  // Summary stats
  const totalCost = workflow.stages.reduce((sum, s) =>
    s.metrics.totalCost > 0 ? sum + s.metrics.totalCost : sum + s.config.costPerUnit * workflow.totalUnits, 0
  );
  const totalDefects = workflow.stages.reduce((sum, s) => sum + s.metrics.defectsFound, 0);
  const isCompleted = workflow.status === 'completed';

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Workflow<span className="text-primary">·</span>Builder
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {workflow.name} — {workflow.totalUnits} units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 font-mono text-xs">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
            {isCompleted && (
              <Button variant="outline" size="sm" onClick={handleOptimize} className="gap-1.5 font-mono text-xs">
                <Sparkles className="w-3 h-3" />
                AI Optimize
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="gap-1.5 font-mono text-xs"
            >
              <Play className="w-3 h-3" />
              {isRunning ? "Running..." : "Run Pipeline"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon={Factory}
            label="Stages"
            value={workflow.stages.length}
            sub="pipeline steps"
          />
          <SummaryCard
            icon={DollarSign}
            label="Est. Cost"
            value={`$${Math.round(totalCost)}`}
            sub="total production"
            accent
          />
          <SummaryCard
            icon={isCompleted ? CheckCircle2 : Clock}
            label="Output"
            value={isCompleted ? workflow.completedUnits : workflow.totalUnits}
            sub={isCompleted ? "units completed" : "units planned"}
            highlight={isCompleted}
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Defects"
            value={totalDefects}
            sub="units rejected"
            warn={totalDefects > 0}
          />
        </div>

        {/* Pipeline Visual */}
        <div className="bg-card/50 border border-border rounded-lg p-6">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
            Production Pipeline
          </h2>
          <div className="flex items-center overflow-x-auto pb-2 gap-0">
            {workflow.stages.map((stage, i) => (
              <StageNode
                key={stage.id}
                stage={stage}
                isLast={i === workflow.stages.length - 1}
                onSelect={setSelectedStage}
                isSelected={selectedStage?.id === stage.id}
              />
            ))}
          </div>
        </div>

        {/* Config + Optimization panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {selectedStage && (
            <StageConfigPanel
              stage={selectedStage}
              onUpdate={handleUpdateConfig}
              onClose={() => setSelectedStage(null)}
            />
          )}
          {optimizations.length > 0 && (
            <div className={selectedStage ? "" : "lg:col-span-2"}>
              <OptimizationPanel
                optimizations={optimizations}
                onApply={handleApplyOptimization}
              />
            </div>
          )}
          {!selectedStage && optimizations.length === 0 && (
            <div className="lg:col-span-2 bg-card border border-border rounded-lg p-8 flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-mono text-center">
                Click a stage to configure it · Run the pipeline to see results · Use AI Optimize after completion
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function SummaryCard({
  icon: Icon, label, value, sub, accent, highlight, warn,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${highlight ? "text-success" : accent ? "text-accent" : warn ? "text-destructive" : "text-primary/70"}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${highlight ? "text-success" : warn ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

export default WorkflowPage;
