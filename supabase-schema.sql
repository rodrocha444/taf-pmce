-- ==============================================================================
-- TAF PMCE - Schema Supabase (PostgreSQL)
-- Execute este script no SQL Editor do seu Dashboard Supabase caso ainda não
-- tenha criado as tabelas.
-- ==============================================================================

-- 1. Tabela de Treinos (Workouts)
CREATE TABLE IF NOT EXISTS public.workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Histórico de Treinos (Workout History)
CREATE TABLE IF NOT EXISTS public.workout_history (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  workout_title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  real_duration_seconds INTEGER,
  exercises_completed_count INTEGER NOT NULL DEFAULT 0,
  exercises_skipped_count INTEGER NOT NULL DEFAULT 0,
  total_exercises_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  exercise_statuses JSONB DEFAULT '{}'::jsonb,
  exercise_logs JSONB DEFAULT '[]'::jsonb
);

-- 3. Tabela de Biblioteca / Catálogo de Exercícios (Exercise Catalog)
CREATE TABLE IF NOT EXISTS public.exercise_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  execution_type TEXT NOT NULL DEFAULT 'reps',
  default_work_duration_seconds INTEGER NOT NULL DEFAULT 60,
  default_rest_duration_seconds INTEGER NOT NULL DEFAULT 60,
  default_target_reps INTEGER,
  focus_notes TEXT
);

-- 4. Tabela de Metas / Treinos de Corrida (Running Workouts)
CREATE TABLE IF NOT EXISTS public.running_workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_mode TEXT NOT NULL DEFAULT 'distance',
  target_distance_km NUMERIC,
  target_duration_seconds INTEGER,
  target_pace_sec_per_km INTEGER,
  laps_count INTEGER,
  lap_distance_meters INTEGER,
  lap_target_seconds INTEGER,
  rest_between_laps_seconds INTEGER,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Histórico de Corridas (Running History)
CREATE TABLE IF NOT EXISTS public.running_history (
  id TEXT PRIMARY KEY,
  workout_id TEXT,
  workout_title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  distance_km NUMERIC NOT NULL,
  duration_seconds INTEGER NOT NULL,
  pace_sec_per_km INTEGER NOT NULL,
  speed_km_h NUMERIC NOT NULL,
  laps JSONB,
  notes TEXT
);

-- Desabilitar RLS para acesso direto simples (app pessoal sem autenticação)
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_history DISABLE ROW LEVEL SECURITY;
