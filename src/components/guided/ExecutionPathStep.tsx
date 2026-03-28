import { motion } from "framer-motion";
import { StepExplainer } from "./StepExplainer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, Shield, Rocket, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { OrchestrationPlan } from "@/store/zelstromStore";

interface ExecutionPathStepProps {
  activePlan: OrchestrationPlan | null;
  winnerName?: string;
  winnerScore?: number;
}

export function ExecutionPathStep({ activePlan, winnerName, winnerScore }: ExecutionPathStepProps) {
  const navigate = useNavigate();
  const name = activePlan?.deployedAgent?.agentName ?? winnerName ?? "—";
  const score = activePlan?.score ?? winnerScore ?? 0;

  const steps = [
    {
      label: "Strategy Selected",
      desc: `"${name}" with score ${score}/100`,
      done: true,
    },
    {
      label: "Deploy to Workflow",
      desc: "Pre-populate pipeline with winner's configuration",
      action: () => navigate("/workflow"),
    },
    {
      label: "Run Production",
      desc: "Execute the pipeline and monitor live metrics",
      action: () => navigate("/workflow"),
    },
    {
      label: "Track & Evolve",
      desc: "Results feed back into the evolution engine",
      action: () => navigate("/command-center"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <StepExplainer
        title="Step 3 — Execution Path"
        description="The selected strategy is ready to be deployed. Follow this path to execute and close the learning loop."
        detail="Deploy → Run → Track → Evolve — the system improves with every cycle"
      />

      {/* Path cards */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {step.action ? (
                <button
                  onClick={step.action}
                  className="w-full bg-card border border-border hover:border-primary/30 rounded-lg p-4 text-left transition-all group h-full"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-mono text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      {i + 1}
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                  <p className="text-xs font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                    {step.label}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-1">{step.desc}</p>
                </button>
              ) : (
                <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-4 h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-mono font-semibold text-primary">{step.label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-1">{step.desc}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3"
      >
        <Link to="/workflow">
          <Button className="gap-2 font-mono text-xs glow-cyan">
            <Workflow className="w-3.5 h-3.5" />
            Open Workflow Builder
          </Button>
        </Link>
        <Link to="/command-center">
          <Button variant="outline" className="gap-2 font-mono text-xs">
            <Shield className="w-3.5 h-3.5" />
            Track in Command Center
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
