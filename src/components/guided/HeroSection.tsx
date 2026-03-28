import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Factory, Shield, Workflow, Brain, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import zelstromLogo from "@/assets/zelstrom-logo.png";
import heroBg from "@/assets/zelstrom-hero-bg.jpg";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 scanline" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 h-full flex flex-col items-center justify-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
          <img src={zelstromLogo} alt="Zelstrom" className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_30px_hsl(185,80%,50%,0.3)]" width={512} height={512} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-2"
        >
          Zel<span className="text-primary text-glow-cyan">·</span>strom
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl font-semibold text-foreground/90 mb-2"
        >
          One Human. One Factory. Fully Autonomous.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm md:text-base text-muted-foreground/70 max-w-lg text-center mb-12 leading-relaxed"
        >
          An autonomous intelligence system that designs, optimizes, and runs factories — continuously.
          AI agents compete, evolve, and deploy production strategies in real-time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-16"
        >
          <Button size="lg" onClick={onStart} className="gap-2 font-mono text-sm h-12 px-8 glow-cyan">
            <Factory className="w-4 h-4" />
            Start Factory Simulation
          </Button>
          <Link to="/command-center">
            <Button size="lg" variant="outline" className="gap-2 font-mono text-sm h-12 px-8 border-border/50">
              <Shield className="w-4 h-4" />
              Command Center
            </Button>
          </Link>
        </motion.div>

        {/* Nav links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-6 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest"
        >
          <Link to="/command-center" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Command
          </Link>
          <span className="text-border">|</span>
          <Link to="/workflow" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Workflow className="w-3 h-3" /> Workflow
          </Link>
          <span className="text-border">|</span>
          <button onClick={onStart} className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Brain className="w-3 h-3" /> Strategies
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={onStart}
          className="absolute bottom-8 animate-bounce text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <div className="absolute bottom-4 right-4 text-[8px] font-mono text-muted-foreground/30 z-10">
        ZELSTROM v2.0 · SDMF ENGINE
      </div>
    </div>
  );
}
