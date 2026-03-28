# Zel·strom — Autonomous Micro-Factory AI

> Self-optimizing adversarial agents compete, evolve, and deploy — building the factory that builds itself.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-5-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🧠 What is Zelstrom?

Zelstrom is a **closed-loop autonomous factory optimization platform** where multiple AI agents compete in adversarial evolution to find the best manufacturing configurations. The system combines:

- **Adversarial Multi-Agent Evolution** — agents propose factory configurations, survive stress-tests, and evolve through natural selection
- **Bayesian Fitness with Real-World Feedback** — agents earn "battle-tested" status as pipeline deployment data feeds back into the evolution engine
- **Software-Defined Micro-Factory (SDMF)** — a digital twin of 8 factory stations with live sensor telemetry (temperature, pressure, vibration, power draw)
- **Strategy-Biased Genetic Selection** — user-selectable optimization strategies (Min Cost, Max Speed, Balanced, Adaptive) that bias which agents receive evolution bonuses
- **External Agent API** — any JavaScript-based agent framework (LangChain, CrewAI, AutoGen) can register and compete via `window.Zelstrom`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  ZELSTROM CORE                  │
├──────────┬──────────────┬───────────────────────┤
│  WORLD   │    BRAIN     │     EXECUTION         │
│ Factory  │  Evolution   │  Pipeline Runner      │
│ Scenario │  Engine      │  & Workflow Builder    │
├──────────┴──────────────┴───────────────────────┤
│           ZUSTAND GLOBAL STATE STORE            │
│        (persisted across page navigation)       │
├─────────────────────────────────────────────────┤
│              FEEDBACK LOOP                      │
│  Deploy → Pipeline → Results → Bayesian Bias    │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **World State** (`/`) — Initialize a factory scenario (jobs, machines, budget, time constraints)
2. **Sandbox Competition** — 4 built-in agents (Cost Optimizer, Speed Maximizer, Balanced Agent, LLM Strategist) compete on the scenario
3. **Orchestration** — The system runs a strategy-biased adversarial generation connecting scenario data to the evolution engine
4. **Command Center** (`/command-center`) — Digital twin, evolution timeline, A/B testing, self-healing, genetic dominance leaderboard
5. **Workflow Builder** (`/workflow`) — Visual pipeline builder with drag-and-drop factory stages using React Flow
6. **Feedback Loop** — Pipeline results feed back into the evolution engine via Bayesian fitness scoring

---

## 🚀 Features

### Core Systems

| Feature | Description |
|---------|-------------|
| **Adversarial Evolution** | Agents propose configs, face stress-tests (thermal overload, supply shortage, quality drift), and only the fittest survive |
| **Bayesian Fitness** | Real-world deployment data multiplies agent scores (1.5x "Battle-Tested" bonus) |
| **Genetic Dominance** | Top 2 agents receive "Alpha" status and genetic inheritance bonuses across generations |
| **Strategy Bias** | Min Cost (+12 to Cost Minimizer), Max Speed (+12 to Throughput Maximizer), Balanced (+5), Adaptive (+8) |
| **Digital Twin** | 8 factory stations with live sensor readings, animated particle flows, and anomaly detection |
| **Self-Healing** | Automatic anomaly detection and remediation with severity-based alerting |
| **A/B Field Tests** | Side-by-side comparison of consecutive generations |
| **Decision Memory** | Historical strategy performance tracking with per-scenario insights |
| **System Diagram** | Live animated data flow visualization (World → Brain → Execution) |
| **External Agent API** | `window.Zelstrom.registerAgent()` for custom agent integration |

### Pages

- **`/`** — Landing page with splash screen + Agent Sandbox (factory initialization, competition, orchestration)
- **`/command-center`** — Full SDMF dashboard: digital twin, evolution timeline, leaderboard, A/B tests, decision memory
- **`/workflow`** — Visual pipeline builder with React Flow, deploy history, pipeline runner

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 18** — Component-based UI
- **TypeScript 5.8** — Type-safe development
- **Vite 5** — Fast build tooling with HMR

### State Management
- **Zustand 5** — Global state store with `persist` middleware for cross-page state persistence

### UI & Styling
- **Tailwind CSS 3.4** — Utility-first styling with custom design tokens (HSL-based dark theme)
- **shadcn/ui** — Radix-based component library (50+ components)
- **Lucide React** — Icon system

### Data Visualization
- **Recharts** — Fitness charts, projected vs actual comparisons, agent score bars
- **@xyflow/react (React Flow)** — Visual workflow/pipeline builder with drag-and-drop factory nodes

### Routing & Data
- **React Router 6** — Client-side routing
- **TanStack React Query** — Async state management
- **Zod** — Schema validation

### Testing
- **Vitest** — Unit testing framework
- **Playwright** — End-to-end testing
- **Testing Library** — Component testing utilities

---

## 📦 Installation

### Prerequisites
- **Node.js** ≥ 18 or **Bun** ≥ 1.0
- **npm**, **yarn**, **pnpm**, or **bun**

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/zelstrom.git
cd zelstrom

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Usage Guide

### Quick Start Loop

1. **Visit `/`** → Click "Agent Sandbox" → Click "Initialize Factory"
2. **Click "Start Competition"** → Watch 4 agents compete
3. **Click "Orchestrate"** → The system creates an orchestration plan linking scenario → evolution → execution
4. **Navigate to `/command-center`** → See the generation in the Evolution Timeline, strategy ranking in Decision Memory
5. **Click "Evolve"** several times → Watch agents compete, survive attacks, earn fitness scores
6. **Click "Deploy"** → Deploys the winning agent config to the pipeline
7. **Navigate to `/workflow`** → Click "Run Pipeline" 2-3 times
8. **Return to `/command-center`** → Click "Evolve" → Agents now show "battle-tested" and "genetic survivor" tags

### External Agent Integration

```javascript
// Register a custom agent from browser console
window.Zelstrom.registerAgent({
  agentName: "My Custom Agent",
  configs: [
    { stationId: "station-1", speed: 2.0, pressure: 60, temperature: 180, batchSize: 50, qualityThreshold: 0.95, routingPriority: 8 }
  ],
  projectedMetrics: { throughput: 900, cost: 250, defectRate: 0.02, uptime: 98 },
  reasoning: "Optimized via reinforcement learning"
});

// Listen for generation results
window.Zelstrom.onGenerationComplete((data) => {
  console.log(`Gen ${data.generationId} winner: ${data.winnerName} (${data.score}pts)`);
});
```

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── Index.tsx              # Landing page + Agent Sandbox
│   ├── CommandCenter.tsx      # SDMF Command Center dashboard
│   ├── WorkflowPage.tsx       # Visual pipeline builder
│   └── NotFound.tsx
├── components/
│   ├── sdmf/                  # SDMF-specific components
│   │   ├── AgentLeaderboard.tsx
│   │   ├── ABTestPanel.tsx
│   │   ├── DecisionMemoryPanel.tsx
│   │   ├── DigitalTwinPanel.tsx
│   │   ├── EvolutionTimeline.tsx
│   │   ├── ExternalAgentPanel.tsx
│   │   ├── FitnessChart.tsx
│   │   ├── PipelineFeedbackPanel.tsx
│   │   ├── ProjectedVsActualChart.tsx
│   │   ├── SelfHealingLog.tsx
│   │   ├── SystemDiagram.tsx
│   │   └── LogicOverlayPanel.tsx
│   ├── workflow/              # Workflow builder components
│   │   ├── FactoryNode.tsx
│   │   ├── NodePalette.tsx
│   │   ├── NodeConfigDrawer.tsx
│   │   └── DeployHistoryPanel.tsx
│   └── ui/                    # shadcn/ui component library
├── store/
│   └── zelstromStore.ts       # Zustand global state (persisted)
├── lib/
│   ├── sdmf.ts                # SDMF evolution engine (adversarial generation, A/B tests)
│   ├── evolution-engine.ts    # Bayesian fitness, genetic dominance, leaderboard
│   ├── factory.ts             # Factory simulation (scenarios, agents, competition)
│   ├── workflow.ts            # Pipeline workflow simulation
│   ├── deploy-bridge.ts       # Deploy config transport (Command Center → Workflow)
│   ├── feedback-bridge.ts     # Pipeline feedback transport (Workflow → Command Center)
│   ├── external-agent-bridge.ts # External agent API (window.Zelstrom)
│   └── self-healing.ts        # Anomaly detection and self-healing logic
└── hooks/
    └── use-mobile.tsx
```

---

## 🔑 Key Algorithms

### Bayesian Fitness Scoring
```
finalScore = (simulatedScore + battleTestedBonus + strategyBias) × dominanceModifier
```
- **battleTestedBonus**: `realWorldScore × 1.5 × 0.15` (from deployment history)
- **strategyBias**: +5 to +12 depending on selected strategy alignment
- **dominanceModifier**: 0.7x to 1.5x based on historical efficiency

### Adversarial Stress Testing
Each generation faces 4-8 random attacks:
- `thermal-overload`, `supply-shortage`, `quality-drift`, `bottleneck`, `demand-spike`, `power-fluctuation`, `cyber-intrusion`, `calibration-drift`
- Severity 1-10, each reducing agent score proportionally
- Agents must score >30 post-attack to survive

### Genetic Selection
- **Alpha** (score ≥ 70): Receives genetic inheritance bonus
- **Contender** (25-70): Competes normally
- **Retired** (< 25): Deprioritized in future generations
- Top 2 agents are "Genetic Survivors" receiving the dominance multiplier

---

## 🎨 Design System

- **Dark industrial theme** with HSL-based semantic tokens
- **Primary**: Cyan (`185 80% 50%`) — data, connections, active states
- **Accent**: Amber (`38 90% 55%`) — warnings, highlights, brain/strategy
- **Success**: Green (`150 70% 45%`) — healthy, alpha agents, positive metrics
- **Typography**: JetBrains Mono (monospace) + Inter (body)
- **Custom effects**: Neon glow utilities, scanline overlay, grid backgrounds

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Zel·strom</strong> — The factory that builds itself.<br/>
  Built with React, TypeScript, Zustand, Recharts, React Flow, Tailwind CSS, and shadcn/ui.
</p>
