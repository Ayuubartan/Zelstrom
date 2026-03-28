import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface StepExplainerProps {
  title: string;
  description: string;
  detail?: string;
}

export function StepExplainer({ title, description, detail }: StepExplainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center py-3"
    >
      <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 mb-2">
        <Info className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-mono text-primary uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto">{description}</p>
      {detail && (
        <p className="text-[10px] font-mono text-muted-foreground/50 max-w-md mx-auto mt-1">{detail}</p>
      )}
    </motion.div>
  );
}
