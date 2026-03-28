import { Factory, Brain, Target, Workflow, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export type FlowStep = "hero" | "scenario" | "strategy" | "execution-path" | "results";

const STEPS = [
  { id: "scenario" as const, label: "Define World", icon: Factory },
  { id: "strategy" as const, label: "Generate Strategies", icon: Brain },
  { id: "execution-path" as const, label: "Execution Path", icon: Target },
  { id: "results" as const, label: "Results & Feedback", icon: Zap },
];

interface FlowStepsProps {
  currentStep: FlowStep;
  completedSteps: FlowStep[];
}

export function FlowSteps({ currentStep, completedSteps }: FlowStepsProps) {
  if (currentStep === "hero") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-1 py-3"
    >
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);

        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-mono transition-all duration-300 ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 glow-cyan"
                  : isCompleted
                  ? "bg-success/10 text-success border border-success/30"
                  : "bg-secondary/50 text-muted-foreground border border-border"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <step.icon className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className={`w-3 h-3 transition-colors ${
                  isCompleted ? "text-success/50" : "text-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
