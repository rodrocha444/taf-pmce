-- ==============================================================================
-- TAF PMCE - Schema Turso (LibSQL / SQLite)
-- Execute este script no Turso CLI (turso db shell <nome-do-db>) ou no dashboard do Turso.
-- ==============================================================================

-- 1. Tabela de Treinos (Workouts)
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  exercises TEXT NOT NULL DEFAULT '[]',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Tabela de Histórico de Treinos (Workout History)
CREATE TABLE IF NOT EXISTS workout_history (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  workout_title TEXT NOT NULL,
  date TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  real_duration_seconds INTEGER,
  exercises_completed_count INTEGER NOT NULL DEFAULT 0,
  exercises_skipped_count INTEGER NOT NULL DEFAULT 0,
  total_exercises_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  exercise_statuses TEXT,
  exercise_logs TEXT
);

-- 3. Tabela de Biblioteca / Catálogo de Exercícios (Exercise Catalog)
CREATE TABLE IF NOT EXISTS exercise_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  execution_type TEXT NOT NULL DEFAULT 'reps',
  default_work_duration_seconds INTEGER NOT NULL DEFAULT 60,
  default_rest_duration_seconds INTEGER NOT NULL DEFAULT 60,
  default_target_reps INTEGER,
  focus_notes TEXT
);

-- 4. Tabela de Metas / Treinos de Corrida (Running Workouts)
CREATE TABLE IF NOT EXISTS running_workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_mode TEXT NOT NULL DEFAULT 'distance',
  target_distance_km REAL,
  target_duration_seconds INTEGER,
  target_pace_sec_per_km INTEGER,
  laps_count INTEGER,
  lap_distance_meters INTEGER,
  lap_target_seconds INTEGER,
  rest_between_laps_seconds INTEGER,
  notes TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 5. Tabela de Histórico de Corridas (Running History)
CREATE TABLE IF NOT EXISTS running_history (
  id TEXT PRIMARY KEY,
  workout_id TEXT,
  workout_title TEXT NOT NULL,
  date TEXT NOT NULL,
  distance_km REAL NOT NULL,
  duration_seconds INTEGER NOT NULL,
  pace_sec_per_km INTEGER NOT NULL,
  speed_km_h REAL NOT NULL,
  laps TEXT,
  notes TEXT
);
