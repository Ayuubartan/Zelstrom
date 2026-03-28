import { useState, useEffect, useCallback } from "react";
import {
  getRegisteredAgents,
  registerExternalAgent,
  unregisterAgent,
  toggleAgent,
  type ExternalAgentRegistration,
} from "@/lib/external-agent-bridge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plug,
  Plus,
  Trash2,
  Terminal,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function ExternalAgentPanel() {
  const [agents, setAgents] = useState<ExternalAgentRegistration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("Custom");

  const refresh = useCallback(() => setAgents(getRegisteredAgents()), []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("zelstrom-registry-change", handler);
    return () => window.removeEventListener("zelstrom-registry-change", handler);
  }, [refresh]);

  const handleRegister = () => {
    if (!name.trim()) return;
    registerExternalAgent(name.trim(), description.trim(), framework.trim() || "Custom");
    toast.success(`Agent "${name}" registered`);
    setName("");
    setDescription("");
    setFramework("Custom");
    setShowForm(false);
    refresh();
  };

  const handleRemove = (id: string, agentName: string) => {
    unregisterAgent(id);
    toast.info(`Agent "${agentName}" removed`);
    refresh();
  };

  const handleToggle = (id: string, enabled: boolean) => {
    toggleAgent(id, enabled);
    refresh();
  };

  const codeSnippet = `// Register your agent
window.Zelstrom.registerAgent({
  name: "My LangChain Agent",
  description: "Optimizes throughput",
  framework: "LangChain"
});

// Submit a proposal
window.Zelstrom.submitProposal({
  agentName: "My LangChain Agent",
  projectedMetrics: {
    throughput: 450,
    cost: 120,
    defectRate: 0.02,
    uptime: 97.5
  },
  reasoning: "Balanced high-speed config"
});

// Listen for results
window.Zelstrom.onGenerationComplete((result) => {
  console.log("Winner:", result.winnerName);
});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const FRAMEWORK_COLORS: Record<string, string> = {
    LangChain: "text-emerald-400",
    CrewAI: "text-sky-400",
    AutoGen: "text-amber-400",
    Custom: "text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {/* Agent list */}
      {agents.length === 0 && !showForm && (
        <div className="text-center py-4">
          <Plug className="w-5 h-5 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-[10px] font-mono text-muted-foreground">No external agents connected</p>
        </div>
      )}

      {agents.map((agent) => (
        <Card key={agent.id} className="bg-secondary/30 border-border/50">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${agent.enabled ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/40"}`} />
                <span className="text-xs font-mono font-semibold text-foreground truncate">{agent.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  checked={agent.enabled}
                  onCheckedChange={(v) => handleToggle(agent.id, v)}
                  className="scale-75"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(agent.id, agent.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
              <Badge variant="outline" className={`text-[8px] h-4 px-1 border-border/50 ${FRAMEWORK_COLORS[agent.framework] || "text-muted-foreground"}`}>
                {agent.framework}
              </Badge>
              <span>{agent.proposalCount} proposals</span>
              {agent.lastProposalAt && (
                <span>last {Math.round((Date.now() - agent.lastProposalAt) / 1000)}s ago</span>
              )}
            </div>
            {agent.description && (
              <p className="text-[9px] font-mono text-muted-foreground/70 truncate">{agent.description}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Register form */}
      {showForm && (
        <Card className="bg-secondary/30 border-primary/20">
          <CardContent className="p-3 space-y-2">
            <Input
              placeholder="Agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-xs font-mono bg-background/50"
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-7 text-xs font-mono bg-background/50"
            />
            <Input
              placeholder="Framework (LangChain, CrewAI...)"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="h-7 text-xs font-mono bg-background/50"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRegister} className="h-7 text-[10px] font-mono flex-1">
                Register
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-[10px] font-mono">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-7 text-[10px] font-mono gap-1.5 flex-1 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Plus className="w-3 h-3" />
            Register Agent
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSnippet(!showSnippet)}
          className="h-7 text-[10px] font-mono gap-1.5 border-border/50"
        >
          <Terminal className="w-3 h-3" />
          API
        </Button>
      </div>

      {/* Code snippet */}
      {showSnippet && (
        <Card className="bg-background border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" />
                window.Zelstrom API
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
            <pre className="text-[8px] font-mono text-muted-foreground leading-relaxed overflow-x-auto whitespace-pre bg-secondary/30 rounded p-2 max-h-48 overflow-y-auto">
              {codeSnippet}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
