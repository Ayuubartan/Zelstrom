import { useState, useCallback, useRef, useMemo, useEffect, DragEvent } from "react";
import { Link } from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import FactoryNodeComponent, { type FactoryNodeData } from "@/components/workflow/FactoryNode";
import { NodePalette, type PaletteItem } from "@/components/workflow/NodePalette";
import { NodeConfigDrawer } from "@/components/workflow/NodeConfigDrawer";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { Button } from "@/components/ui/button";
import {
  optimizeWorkflow,
  simulateWorkflow,
  type Workflow,
  type StageConfig,
  type WorkflowOptimization,
} from "@/lib/workflow";
import { ArrowLeft, Play, Sparkles, RotateCcw, Factory } from "lucide-react";
import { toast } from "sonner";

const nodeTypes = { factory: FactoryNodeComponent };

let idCounter = 0;
const getId = () => `node_${++idCounter}`;

// Default starting nodes
const DEFAULT_NODES: Node<FactoryNodeData>[] = [
  {
    id: "node_start_1",
    type: "factory",
    position: { x: 50, y: 200 },
    data: {
      label: "CNC Machining", stageType: "cnc", icon: "Cog",
      description: "Precision cutting, milling, and shaping of raw materials",
      status: "idle",
      config: { machineCount: 3, speedMultiplier: 1.0, costPerUnit: 12, defectRate: 0.02, batchSize: 50, maxCapacity: 200 },
      metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
    },
  },
  {
    id: "node_start_2",
    type: "factory",
    position: { x: 350, y: 100 },
    data: {
      label: "Welding", stageType: "welding", icon: "Flame",
      description: "Arc, MIG, or TIG welding of metal components",
      status: "idle",
      config: { machineCount: 2, speedMultiplier: 0.8, costPerUnit: 18, defectRate: 0.05, batchSize: 30, maxCapacity: 120 },
      metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
    },
  },
  {
    id: "node_start_3",
    type: "factory",
    position: { x: 350, y: 350 },
    data: {
      label: "Painting", stageType: "painting", icon: "Paintbrush",
      description: "Surface coating with primer and protective finish",
      status: "idle",
      config: { machineCount: 2, speedMultiplier: 1.2, costPerUnit: 8, defectRate: 0.03, batchSize: 40, maxCapacity: 160 },
      metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
    },
  },
  {
    id: "node_start_4",
    type: "factory",
    position: { x: 650, y: 200 },
    data: {
      label: "Assembly", stageType: "assembly", icon: "Wrench",
      description: "Combining sub-components into final assemblies",
      status: "idle",
      config: { machineCount: 4, speedMultiplier: 0.9, costPerUnit: 15, defectRate: 0.04, batchSize: 25, maxCapacity: 150 },
      metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
    },
  },
  {
    id: "node_start_5",
    type: "factory",
    position: { x: 950, y: 200 },
    data: {
      label: "Quality Control", stageType: "qc", icon: "Search",
      description: "Inspection for dimensional accuracy and defects",
      status: "idle",
      config: { machineCount: 2, speedMultiplier: 1.5, costPerUnit: 6, defectRate: 0.01, batchSize: 60, maxCapacity: 300 },
      metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
    },
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "node_start_1", target: "node_start_2", animated: true },
  { id: "e1-3", source: "node_start_1", target: "node_start_3", animated: true },
  { id: "e2-4", source: "node_start_2", target: "node_start_4", animated: true },
  { id: "e3-4", source: "node_start_3", target: "node_start_4", animated: true },
  { id: "e4-5", source: "node_start_4", target: "node_start_5", animated: true },
];

function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [optimizations, setOptimizations] = useState<WorkflowOptimization[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;

      const item: PaletteItem = JSON.parse(raw);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newId = getId();

      const newNode: Node<FactoryNodeData> = {
        id: newId,
        type: "factory",
        position,
        data: {
          label: item.label,
          stageType: item.type,
          icon: item.icon,
          description: item.description,
          status: "idle",
          config: { ...item.defaultConfig },
          metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const handleConfigUpdate = useCallback(
    (field: keyof StageConfig, value: number) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, config: { ...n.data.config, [field]: value } } }
            : n
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  // Build a workflow from the canvas graph for simulation
  const buildWorkflow = useCallback((): Workflow => {
    return {
      id: `wf-${Date.now()}`,
      name: "Canvas Workflow",
      stages: nodes.map((n, i) => ({
        id: n.id,
        name: (n.data as FactoryNodeData).label,
        type: (n.data as FactoryNodeData).stageType as any,
        description: (n.data as FactoryNodeData).description,
        icon: (n.data as FactoryNodeData).icon,
        status: "idle" as const,
        config: { ...(n.data as FactoryNodeData).config },
        metrics: { ...(n.data as FactoryNodeData).metrics },
        position: i,
      })),
      totalUnits: 100,
      completedUnits: 0,
      status: "draft",
      createdAt: Date.now(),
    };
  }, [nodes]);

  // Topological order based on edges
  const getExecutionOrder = useCallback((): string[] => {
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach((n) => { adj[n.id] = []; inDegree[n.id] = 0; });
    edges.forEach((e) => { adj[e.source]?.push(e.target); inDegree[e.target] = (inDegree[e.target] || 0) + 1; });
    const queue = Object.keys(inDegree).filter((k) => inDegree[k] === 0);
    const order: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      order.push(id);
      for (const next of adj[id] || []) {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      }
    }
    return order;
  }, [nodes, edges]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setOptimizations([]);
    const order = getExecutionOrder();

    // Animate nodes in topological order
    order.forEach((nodeId, i) => {
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              status: n.id === nodeId ? "running" : (order.indexOf(n.id) < i ? "completed" : n.data.status),
            },
          }))
        );
      }, i * 600);
    });

    // Complete all
    setTimeout(() => {
      const wf = buildWorkflow();
      const simulated = simulateWorkflow(wf);
      setNodes((nds) =>
        nds.map((n) => {
          const stage = simulated.stages.find((s) => s.id === n.id);
          return {
            ...n,
            data: {
              ...n.data,
              status: "completed" as const,
              metrics: stage?.metrics ?? n.data.metrics,
            },
          };
        })
      );
      setIsRunning(false);
      toast.success("Pipeline execution complete");
    }, order.length * 600 + 400);
  }, [getExecutionOrder, buildWorkflow, setNodes]);

  const handleOptimize = useCallback(() => {
    const wf = buildWorkflow();
    const opts = optimizeWorkflow(wf);
    setOptimizations(opts);
    toast.success(`${opts.length} agents analyzed your pipeline`);
  }, [buildWorkflow]);

  const handleApplyOpt = useCallback((opt: WorkflowOptimization) => {
    opt.suggestions.forEach((s) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === s.stageId
            ? { ...n, data: { ...n.data, config: { ...n.data.config, [s.field]: s.suggestedValue } } }
            : n
        )
      );
    });
    toast.success(`Applied ${opt.suggestions.length} changes from ${opt.agentName}`);
  }, [setNodes]);

  const handleReset = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: "idle" as const,
          metrics: { unitsProcessed: 0, unitsQueued: 0, defectsFound: 0, totalCost: 0, avgTimePerUnit: 0, utilization: 0 },
        },
      }))
    );
    setOptimizations([]);
  }, [setNodes]);

  const hasCompleted = nodes.some((n) => (n.data as FactoryNodeData).status === "completed");

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm z-20 shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Factory className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Workflow<span className="text-primary">·</span>Builder
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                {nodes.length} nodes · {edges.length} connections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 font-mono text-[11px] h-8">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
            {hasCompleted && (
              <Button variant="outline" size="sm" onClick={handleOptimize} className="gap-1.5 font-mono text-[11px] h-8">
                <Sparkles className="w-3 h-3" />
                AI Optimize
              </Button>
            )}
            <Button size="sm" onClick={handleRun} disabled={isRunning || nodes.length === 0} className="gap-1.5 font-mono text-[11px] h-8">
              <Play className="w-3 h-3" />
              {isRunning ? "Running..." : "Run Pipeline"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar palette */}
        <NodePalette className="w-56 shrink-0" />

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true }}
            className="!bg-background"
          >
            <Controls />
            <MiniMap
              nodeColor={() => "hsl(185, 80%, 50%)"}
              maskColor="hsl(220, 20%, 7%, 0.7)"
              style={{ height: 100, width: 140 }}
            />
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(220, 15%, 20%)" />
          </ReactFlow>

          {/* Optimization overlay */}
          {optimizations.length > 0 && (
            <div className="absolute bottom-4 left-4 w-72 max-h-[60%] overflow-y-auto bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4">
              <OptimizationPanel optimizations={optimizations} onApply={handleApplyOpt} />
            </div>
          )}
        </div>

        {/* Config drawer */}
        {selectedNode && (
          <NodeConfigDrawer
            nodeId={selectedNode.id}
            label={(selectedNode.data as FactoryNodeData).label}
            icon={(selectedNode.data as FactoryNodeData).icon}
            description={(selectedNode.data as FactoryNodeData).description}
            config={(selectedNode.data as FactoryNodeData).config}
            onUpdate={handleConfigUpdate}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}

const WorkflowPage = () => (
  <ReactFlowProvider>
    <WorkflowCanvas />
  </ReactFlowProvider>
);

export default WorkflowPage;
