-- Zelstrom Core Database Schema
-- Replaces localStorage with real PostgreSQL persistence

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. Agent DNA / Leaderboard
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'optimizer',
  deployments INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  avg_yield DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_efficiency DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_defects DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  fitness_score DOUBLE PRECISION NOT NULL DEFAULT 50,
  dominance_rank INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'contender',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_name)
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents are publicly readable" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Agents can be inserted" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can be updated" ON public.agents FOR UPDATE USING (true);

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Evolution Generations
CREATE TABLE public.generations (
  id SERIAL PRIMARY KEY,
  generation_number INTEGER NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  proposals JSONB NOT NULL DEFAULT '[]'::jsonb,
  attacks JSONB NOT NULL DEFAULT '[]'::jsonb,
  survivor JSONB,
  retired JSONB NOT NULL DEFAULT '[]'::jsonb,
  fitness_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  improvement DOUBLE PRECISION NOT NULL DEFAULT 0,
  strategy_bias TEXT NOT NULL DEFAULT 'balanced',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Generations are publicly readable" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Generations can be inserted" ON public.generations FOR INSERT WITH CHECK (true);

CREATE INDEX idx_generations_number ON public.generations(generation_number DESC);

-- 3. Deployments (replaces deploy-bridge localStorage)
CREATE TABLE public.deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  stage_configs JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deployments are publicly readable" ON public.deployments FOR SELECT USING (true);
CREATE POLICY "Deployments can be inserted" ON public.deployments FOR INSERT WITH CHECK (true);
CREATE POLICY "Deployments can be updated" ON public.deployments FOR UPDATE USING (true);

CREATE INDEX idx_deployments_agent ON public.deployments(agent_name);
CREATE INDEX idx_deployments_created ON public.deployments(created_at DESC);

-- 4. Pipeline Runs (replaces feedback-bridge localStorage)
CREATE TABLE public.pipeline_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployed_generation_id INTEGER,
  deployed_agent_name TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pipeline runs are publicly readable" ON public.pipeline_runs FOR SELECT USING (true);
CREATE POLICY "Pipeline runs can be inserted" ON public.pipeline_runs FOR INSERT WITH CHECK (true);

CREATE INDEX idx_pipeline_runs_agent ON public.pipeline_runs(deployed_agent_name);
CREATE INDEX idx_pipeline_runs_created ON public.pipeline_runs(created_at DESC);

-- 5. Orchestration Plans
CREATE TABLE public.orchestration_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy TEXT NOT NULL DEFAULT 'balanced',
  scenario_id TEXT,
  sandbox_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  sdmf_generation JSONB,
  deployed_agent JSONB,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orchestration_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.orchestration_plans FOR SELECT USING (true);
CREATE POLICY "Plans can be inserted" ON public.orchestration_plans FOR INSERT WITH CHECK (true);

CREATE INDEX idx_plans_strategy ON public.orchestration_plans(strategy);
CREATE INDEX idx_plans_created ON public.orchestration_plans(created_at DESC);

-- 6. Self-Healing Events
CREATE TABLE public.heal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  sensor_id TEXT,
  sensor_value DOUBLE PRECISION,
  sensor_unit TEXT,
  threshold DOUBLE PRECISION NOT NULL DEFAULT 0,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.heal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Heal events are publicly readable" ON public.heal_events FOR SELECT USING (true);
CREATE POLICY "Heal events can be inserted" ON public.heal_events FOR INSERT WITH CHECK (true);

CREATE INDEX idx_heal_events_created ON public.heal_events(created_at DESC);