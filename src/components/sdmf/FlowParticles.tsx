import { useEffect, useState, useRef } from "react";
import { type FactoryStation } from "@/lib/sdmf";

interface Particle {
  id: number;
  fromIdx: number;
  toIdx: number;
  progress: number; // 0-1
  speed: number;
  color: string;
}

// Defines the material flow routes between stations (index-based)
// CNC(0) → Weld(3), 3DP(1) → Weld(3), Laser(2) → Weld(3)
// Weld(3) → Paint(4), Paint(4) → Assembly(5)
// Assembly(5) → QC(6), QC(6) → Packaging(7)
const FLOW_ROUTES = [
  [0, 3], [1, 3], [2, 3], // raw → welding
  [3, 4], // welding → painting
  [4, 5], // painting → assembly
  [5, 6], // assembly → QC
  [6, 7], // QC → packaging
];

const PARTICLE_COLORS = [
  "hsl(185, 80%, 50%)", // cyan
  "hsl(142, 71%, 45%)", // green
  "hsl(35, 90%, 55%)",  // amber
  "hsl(270, 60%, 60%)", // purple
];

interface FlowParticlesProps {
  stations: FactoryStation[];
}

export function FlowParticles({ stations }: FlowParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spawn particles based on station throughput
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        // Remove completed particles
        const alive = prev.filter(p => p.progress < 1);

        // Spawn new ones on active routes
        const newParticles: Particle[] = [];
        FLOW_ROUTES.forEach(([from, to]) => {
          const fromStation = stations[from];
          const toStation = stations[to];
          if (!fromStation || !toStation) return;

          // Spawn rate based on utilization
          const spawnChance = ((fromStation.utilization + toStation.utilization) / 200) * 0.6;
          if (Math.random() < spawnChance) {
            newParticles.push({
              id: nextId.current++,
              fromIdx: from,
              toIdx: to,
              progress: 0,
              speed: 0.02 + Math.random() * 0.03,
              color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            });
          }
        });

        // Cap total particles
        return [...alive, ...newParticles].slice(-40);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [stations]);

  // Advance particles
  useEffect(() => {
    const frame = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({ ...p, progress: p.progress + p.speed }))
      );
    }, 50);
    return () => clearInterval(frame);
  }, []);

  // Grid positions (2 cols, matching the station grid layout)
  // Each station card is roughly at these relative positions
  const getStationPos = (idx: number): { x: number; y: number } => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    return {
      x: col === 0 ? 25 : 75, // percentage
      y: 12 + row * 25,       // percentage
    };
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flow lines (faint) */}
        {FLOW_ROUTES.map(([from, to], i) => {
          const fromPos = getStationPos(from);
          const toPos = getStationPos(to);
          return (
            <line
              key={`route-${i}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="hsl(185, 80%, 50%)"
              strokeOpacity={0.08}
              strokeWidth={0.3}
              strokeDasharray="1 1"
            />
          );
        })}

        {/* Particles */}
        {particles.map(p => {
          const fromPos = getStationPos(p.fromIdx);
          const toPos = getStationPos(p.toIdx);
          const x = fromPos.x + (toPos.x - fromPos.x) * p.progress;
          const y = fromPos.y + (toPos.y - fromPos.y) * p.progress;
          const opacity = p.progress < 0.1 ? p.progress * 10 : p.progress > 0.9 ? (1 - p.progress) * 10 : 1;

          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r={0.6}
              fill={p.color}
              opacity={opacity * 0.8}
              filter="url(#glow)"
            />
          );
        })}
      </svg>
    </div>
  );
}
