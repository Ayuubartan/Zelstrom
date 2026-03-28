# Zel·strom — The Autonomous Factory Operating System

> One human. One factory. Fully autonomous.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-5-orange)
![React Flow](https://img.shields.io/badge/ReactFlow-12-ff0072)
![Recharts](https://img.shields.io/badge/Recharts-2.15-8884d8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌍 Vision

Modern factories are not truly systems — they are fragmented operations: disconnected tools, manual workflows, human-dependent decisions, and static pipelines requiring constant oversight.

**Zelstrom introduces a new model: factories as autonomous, workflow-driven systems.**

Where intelligence replaces manual coordination, workflows replace fragmented operations, and systems continuously optimize themselves — allowing **a single operator** to control an entire factory.

---

## 🧠 What is Zelstrom?

Zelstrom is both an **Autonomous Intelligence Layer** and a **Workflow Operating System** for factories.

### 🧠 Intelligence Layer
- AI agents that **compete, evolve, and make decisions** through adversarial natural selection
- **Strategy-driven optimization** (cost, speed, quality, adaptive)
- **Continuous learning** through real-world pipeline feedback (Bayesian fitness scoring)

### ⚙️ Workflow Operating System
- **Visual pipeline builder** for production flows (drag-and-drop with React Flow)
- **Programmable factory stages** with configurable routing logic
- **Automated execution** from planning → production → feedback
- **Fully software-defined operations**

---

## 🔁 The Core Loop

Zelstrom transforms factory operations into a continuous, self-improving system:

```
Workflow → Execution → Feedback → Evolution → Deployment → Repeat
```

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

1. **World State** (`/`) — Initialize a factory scenario (jobs, machines, budget, time)
2. **Sandbox Competition** — 4 AI agents compete on the scenario
3. **Orchestration** — Strategy-biased adversarial generation connects scenario → evolution engine
4. **Command Center** (`/command-center`) — Digital twin, evolution timeline, A/B testing, self-healing, leaderboard
5. **Workflow Builder** (`/workflow`) — Visual pipeline builder with drag-and-drop factory nodes
6. **Feedback Loop** — Pipeline results feed back into evolution via Bayesian fitness scoring

This loop runs continuously — without manual intervention.

---

## 🚀 Features

### Core Systems

| Feature | Description |
|---------|-------------|
| **Adversarial Evolution** | Agents propose configs, face stress-tests (thermal overload, supply shortage, quality drift), and only the fittest survive |
| **Bayesian Fitness** | Real-world deployment data multiplies agent scores (1.5× "Battle-Tested" bonus) |
| **Genetic Dominance** | Top 2 agents receive "Alpha" status and genetic inheritance bonuses across generations |
| **Strategy Bias** | Min Cost (+12 to Cost Minimizer), Max Speed (+12 to Throughput Maximizer), Balanced (+5), Adaptive (+8) |
| **Digital Twin** | 8 factory stations with live sensor readings, animated particle flows, and anomaly detection |
| **Self-Healing** | Automatic anomaly detection and remediation with severity-based alerting |
| **A/B Field Tests** | Side-by-side comparison of consecutive generations |
| **Decision Memory** | Historical strategy performance tracking with per-scenario insights |
| **System Diagram** | Live animated data flow visualization (World → Brain → Execution) |
| **External Agent API** | `window.Zelstrom.registerAgent()` for custom agent integration |

### Pages

| Route | Purpose |
|-------|---------|
| **`/`** | Landing + Agent Sandbox — factory initialization, agent competition, orchestration |
| **`/command-center`** | Brain dashboard — digital twin, evolution timeline, leaderboard, A/B tests, decision memory |
| **`/workflow`** | Execution layer — visual pipeline builder with React Flow, deploy history, pipeline runner |

---

## 👤 The Outcome

With Zelstrom, a single operator can:

- **Design** production workflows visually
- **Define** constraints and optimization strategy
- **Launch** autonomous agent competition
- **Let the system continuously improve itself**

The system autonomously handles: scheduling, resource allocation, optimization, adaptation, and deployment.

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript 5.8, Vite 5 |
| **State** | Zustand 5 (persisted global store) |
| **UI** | Tailwind CSS 3.4, shadcn/ui (50+ Radix components), Lucide React |
| **Visualization** | Recharts (fitness charts, score bars), @xyflow/react (workflow builder) |
| **Routing** | React Router 6 |
| **Data** | TanStack React Query, Zod schema validation |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 📦 Installation

### Prerequisites
- **Node.js** ≥ 18 or **Bun** ≥ 1.0

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/zelstrom.git
cd zelstrom

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Usage Guide

### Quick Start — The Full Loop

1. **Visit `/`** → Click "Agent Sandbox" → Click "Initialize Factory"
2. **Click "Start Competition"** → Watch 4 agents compete on your scenario
3. **Click "Orchestrate"** → Links scenario → evolution engine → execution plan
4. **Navigate to `/command-center`** → See generations in Evolution Timeline, strategy rankings in Decision Memory
5. **Click "Evolve"** several times → Agents compete, survive attacks, earn fitness scores
6. **Click "Deploy"** → Deploys the winning agent config to the pipeline
7. **Navigate to `/workflow`** → Click "Run Pipeline" 2-3 times to generate real-world data
8. **Return to `/command-center`** → Click "Evolve" → Agents now show **"battle-tested"** and **"genetic survivor"** tags

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

## 🔑 Key Algorithms

### Bayesian Fitness Scoring
```
finalScore = (simulatedScore + battleTestedBonus + strategyBias) × dominanceModifier
```
- **battleTestedBonus**: `realWorldScore × 1.5 × 0.15` (from deployment history)
- **strategyBias**: +5 to +12 depending on selected strategy alignment
- **dominanceModifier**: 0.7× to 1.5× based on historical efficiency

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

## 📁 Project Structure

```
src/
├── pages/
│   ├── Index.tsx              # Landing page + Agent Sandbox
│   ├── CommandCenter.tsx      # Brain — SDMF Command Center
│   ├── WorkflowPage.tsx       # Execution — Visual pipeline builder
│   └── NotFound.tsx
├── components/
│   ├── sdmf/                  # Intelligence layer components
│   │   ├── AgentLeaderboard.tsx
│   │   ├── ABTestPanel.tsx
│   │   ├── DecisionMemoryPanel.tsx
│   │   ├── DigitalTwinPanel.tsx
│   │   ├── EvolutionTimeline.tsx
│   │   ├── ExternalAgentPanel.tsx
│   │   ├── FitnessChart.tsx
│   │   ├── FlowParticles.tsx
│   │   ├── PipelineFeedbackPanel.tsx
│   │   ├── ProjectedVsActualChart.tsx
│   │   ├── SelfHealingLog.tsx
│   │   ├── SystemDiagram.tsx
│   │   └── LogicOverlayPanel.tsx
│   ├── workflow/              # Workflow OS components
│   │   ├── FactoryNode.tsx
│   │   ├── NodePalette.tsx
│   │   ├── NodeConfigDrawer.tsx
│   │   └── DeployHistoryPanel.tsx
│   └── ui/                    # shadcn/ui component library
├── store/
│   └── zelstromStore.ts       # Zustand global state (persisted)
├── lib/
│   ├── sdmf.ts                # Evolution engine (adversarial generation, A/B tests)
│   ├── evolution-engine.ts    # Bayesian fitness, genetic dominance, leaderboard
│   ├── factory.ts             # Factory simulation (scenarios, agents, competition)
│   ├── workflow.ts            # Pipeline workflow simulation
│   ├── deploy-bridge.ts       # Deploy transport (Command Center → Workflow)
│   ├── feedback-bridge.ts     # Feedback transport (Workflow → Command Center)
│   ├── external-agent-bridge.ts # External agent API (window.Zelstrom)
│   └── self-healing.ts        # Anomaly detection and self-healing
└── hooks/
    └── use-mobile.tsx
```

---

## 🎨 Design System

- **Dark industrial theme** with HSL-based semantic tokens
- **Primary**: Cyan (`185 80% 50%`) — data, connections, active states
- **Accent**: Amber (`38 90% 55%`) — warnings, highlights, brain/strategy
- **Success**: Green (`150 70% 45%`) — healthy, alpha agents, positive metrics
- **Typography**: JetBrains Mono (monospace) + Inter (body)
- **Custom effects**: Neon glow utilities, scanline overlay, grid backgrounds

---

## 🧭 Zelstrom's Role

Zelstrom is building **the autonomous control and workflow layer for industrial systems**.

Not just a tool. Not just a dashboard.

**A system where factories think, workflows execute, and intelligence evolves — continuously.**

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
  One human. One factory. Fully autonomous.<br/><br/>
  Built with React · TypeScript · Zustand · Recharts · React Flow · Tailwind CSS · shadcn/ui
</p>
