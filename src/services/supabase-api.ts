/**
 * supabase-api.ts
 * Camada de acesso a dados (CRUD) com Supabase.
 * Converte propriedades camelCase do TypeScript para snake_case do PostgreSQL e vice-versa.
 * Faz auto-seed inicial inteligente quando o banco de dados é acessado pela primeira vez.
 */
import { supabase } from './supabase';
import { DEFAULT_TAF_WORKOUT } from '../data/default-workout';
import { DEFAULT_EXERCISE_CATALOG } from '../data/default-catalog';
import { DEFAULT_RUNNING_WORKOUTS } from '../store/running-defaults';
import type {
  Workout,
  WorkoutSessionLog,
  ExerciseCatalogItem,
  RunningWorkout,
  RunningLog,
} from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function throwOnError<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) {
    console.error(`[Supabase API Error] ${context}:`, error.message);
    throw new Error(`[${context}] ${error.message}`);
  }
  return data as T;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

// 1. Workouts
export interface DbWorkout {
  id: string;
  title: string;
  description: string | null;
  exercises: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function toDbWorkout(w: Workout): DbWorkout {
  return {
    id: w.id,
    title: w.title,
    description: w.description || null,
    exercises: w.exercises || [],
    is_default: w.isDefault ?? false,
    created_at: w.createdAt || new Date().toISOString(),
    updated_at: w.updatedAt || new Date().toISOString(),
  };
}

function fromDbWorkout(row: any): Workout {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    exercises: row.exercises || [],
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 2. Workout History
export interface DbWorkoutHistory {
  id: string;
  workout_id: string;
  workout_title: string;
  date: string;
  duration_seconds: number;
  real_duration_seconds: number | null;
  exercises_completed_count: number;
  exercises_skipped_count: number;
  total_exercises_count: number;
  status: string;
  exercise_statuses: any;
  exercise_logs: any;
}

function toDbHistory(h: WorkoutSessionLog): DbWorkoutHistory {
  return {
    id: h.id,
    workout_id: h.workoutId,
    workout_title: h.workoutTitle,
    date: h.date,
    duration_seconds: h.durationSeconds,
    real_duration_seconds: h.realDurationSeconds ?? null,
    exercises_completed_count: h.exercisesCompletedCount,
    exercises_skipped_count: h.exercisesSkippedCount,
    total_exercises_count: h.totalExercisesCount,
    status: h.status,
    exercise_statuses: h.exerciseStatuses || {},
    exercise_logs: h.exerciseLogs || [],
  };
}

function fromDbHistory(row: any): WorkoutSessionLog {
  return {
    id: row.id,
    workoutId: row.workout_id,
    workoutTitle: row.workout_title,
    date: row.date,
    durationSeconds: row.duration_seconds,
    realDurationSeconds: row.real_duration_seconds ?? row.duration_seconds,
    exercisesCompletedCount: row.exercises_completed_count,
    exercisesSkippedCount: row.exercises_skipped_count,
    totalExercisesCount: row.total_exercises_count,
    status: row.status,
    exerciseStatuses: row.exercise_statuses || {},
    exerciseLogs: row.exercise_logs || [],
  };
}

// 3. Exercise Catalog
export interface DbCatalog {
  id: string;
  name: string;
  execution_type: string;
  default_work_duration_seconds: number;
  default_rest_duration_seconds: number;
  default_target_reps: number | null;
  focus_notes: string | null;
}

function toDbCatalog(c: ExerciseCatalogItem): DbCatalog {
  return {
    id: c.id,
    name: c.name,
    execution_type: c.executionType,
    default_work_duration_seconds: c.defaultWorkDurationSeconds,
    default_rest_duration_seconds: c.defaultRestDurationSeconds,
    default_target_reps: c.defaultTargetReps ?? null,
    focus_notes: c.focusNotes || null,
  };
}

function fromDbCatalog(row: any): ExerciseCatalogItem {
  return {
    id: row.id,
    name: row.name,
    executionType: row.execution_type,
    defaultWorkDurationSeconds: row.default_work_duration_seconds || 60,
    defaultRestDurationSeconds: row.default_rest_duration_seconds || 60,
    defaultTargetReps: row.default_target_reps ?? undefined,
    focusNotes: row.focus_notes || '',
  };
}

// 4. Running Workouts
export interface DbRunningWorkout {
  id: string;
  title: string;
  target_mode: string;
  target_distance_km: number | null;
  target_duration_seconds: number | null;
  target_pace_sec_per_km: number | null;
  laps_count: number | null;
  lap_distance_meters: number | null;
  lap_target_seconds: number | null;
  rest_between_laps_seconds: number | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

function toDbRunningWorkout(r: RunningWorkout): DbRunningWorkout {
  return {
    id: r.id,
    title: r.title,
    target_mode: r.targetMode,
    target_distance_km: r.targetDistanceKm ?? null,
    target_duration_seconds: r.targetDurationSeconds ?? null,
    target_pace_sec_per_km: r.targetPaceSecPerKm ?? null,
    laps_count: r.lapsCount ?? null,
    lap_distance_meters: r.lapDistanceMeters ?? null,
    lap_target_seconds: r.lapTargetSeconds ?? null,
    rest_between_laps_seconds: r.restBetweenLapsSeconds ?? null,
    notes: r.notes || null,
    is_default: r.isDefault ?? false,
    created_at: r.createdAt || new Date().toISOString(),
  };
}

function fromDbRunningWorkout(row: any): RunningWorkout {
  return {
    id: row.id,
    title: row.title,
    targetMode: row.target_mode,
    targetDistanceKm: row.target_distance_km != null ? Number(row.target_distance_km) : undefined,
    targetDurationSeconds: row.target_duration_seconds ?? undefined,
    targetPaceSecPerKm: row.target_pace_sec_per_km ?? undefined,
    lapsCount: row.laps_count ?? undefined,
    lapDistanceMeters: row.lap_distance_meters ?? undefined,
    lapTargetSeconds: row.lap_target_seconds ?? undefined,
    restBetweenLapsSeconds: row.rest_between_laps_seconds ?? undefined,
    notes: row.notes || '',
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
  };
}

// 5. Running History
export interface DbRunningHistory {
  id: string;
  workout_id: string | null;
  workout_title: string;
  date: string;
  distance_km: number;
  duration_seconds: number;
  pace_sec_per_km: number;
  speed_km_h: number;
  laps: any;
  notes: string | null;
}

function toDbRunningHistory(l: RunningLog): DbRunningHistory {
  return {
    id: l.id,
    workout_id: l.workoutId || null,
    workout_title: l.workoutTitle,
    date: l.date,
    distance_km: l.distanceKm,
    duration_seconds: l.durationSeconds,
    pace_sec_per_km: l.paceSecPerKm,
    speed_km_h: l.speedKmH,
    laps: l.laps || null,
    notes: l.notes || null,
  };
}

function fromDbRunningHistory(row: any): RunningLog {
  return {
    id: row.id,
    workoutId: row.workout_id ?? undefined,
    workoutTitle: row.workout_title,
    date: row.date,
    distanceKm: Number(row.distance_km),
    durationSeconds: Number(row.duration_seconds),
    paceSecPerKm: Number(row.pace_sec_per_km),
    speedKmH: Number(row.speed_km_h),
    laps: row.laps ?? undefined,
    notes: row.notes || '',
  };
}

// ─── API Endpoints ──────────────────────────────────────────────────────────

// ── Workouts
export const workoutsApi = {
  getAll: async (): Promise<Workout[]> => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: true });
    throwOnError(data, error, 'workouts.getAll');
    const workouts = (data || []).map(fromDbWorkout);

    // Se o banco estiver vazio e nunca foi inicializado, insere o treino padrão inicial no Supabase
    if (workouts.length === 0 && !localStorage.getItem('taf_workouts_initialized')) {
      try {
        const seeded = await workoutsApi.upsert(DEFAULT_TAF_WORKOUT);
        localStorage.setItem('taf_workouts_initialized', 'true');
        return [seeded];
      } catch (e) {
        console.warn('[Supabase Auto-seed] Workouts seed failed:', e);
        return [DEFAULT_TAF_WORKOUT];
      }
    }

    return workouts;
  },

  upsert: async (workout: Workout): Promise<Workout> => {
    const dbPayload = toDbWorkout(workout);
    const { data, error } = await supabase
      .from('workouts')
      .upsert(dbPayload, { onConflict: 'id' })
      .select()
      .single();
    throwOnError(data, error, 'workouts.upsert');
    localStorage.setItem('taf_workouts_initialized', 'true');
    return fromDbWorkout(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    throwOnError(null, error, 'workouts.delete');
    localStorage.setItem('taf_workouts_initialized', 'true');
  },
};

// ── Workout History
export const historyApi = {
  getAll: async (): Promise<WorkoutSessionLog[]> => {
    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .order('date', { ascending: false });
    throwOnError(data, error, 'history.getAll');
    return (data || []).map(fromDbHistory);
  },

  insert: async (log: WorkoutSessionLog): Promise<WorkoutSessionLog> => {
    const dbPayload = toDbHistory(log);
    const { data, error } = await supabase
      .from('workout_history')
      .insert(dbPayload)
      .select()
      .single();
    throwOnError(data, error, 'history.insert');
    return fromDbHistory(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('workout_history').delete().eq('id', id);
    throwOnError(null, error, 'history.delete');
  },

  deleteAll: async (): Promise<void> => {
    const { error } = await supabase.from('workout_history').delete().neq('id', '');
    throwOnError(null, error, 'history.deleteAll');
  },
};

// ── Exercise Catalog
export const catalogApi = {
  getAll: async (): Promise<ExerciseCatalogItem[]> => {
    const { data, error } = await supabase
      .from('exercise_catalog')
      .select('*')
      .order('name', { ascending: true });
    throwOnError(data, error, 'catalog.getAll');
    const items = (data || []).map(fromDbCatalog);

    // Se o catálogo estiver vazio e nunca foi inicializado, faz o seed das linhas no Supabase
    if (items.length === 0 && !localStorage.getItem('taf_catalog_initialized')) {
      try {
        const dbPayloads = DEFAULT_EXERCISE_CATALOG.map(toDbCatalog);
        const { data: inserted, error: insertErr } = await supabase
          .from('exercise_catalog')
          .insert(dbPayloads)
          .select();
        if (!insertErr && inserted && inserted.length > 0) {
          localStorage.setItem('taf_catalog_initialized', 'true');
          return inserted.map(fromDbCatalog);
        }
      } catch (e) {
        console.warn('[Supabase Auto-seed] Catalog seed failed:', e);
      }
      return DEFAULT_EXERCISE_CATALOG;
    }

    return items;
  },

  insert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    const dbPayload = toDbCatalog(item);
    const { data, error } = await supabase
      .from('exercise_catalog')
      .insert(dbPayload)
      .select()
      .single();
    throwOnError(data, error, 'catalog.insert');
    localStorage.setItem('taf_catalog_initialized', 'true');
    return fromDbCatalog(data);
  },

  upsert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    const dbPayload = toDbCatalog(item);
    const { data, error } = await supabase
      .from('exercise_catalog')
      .upsert(dbPayload, { onConflict: 'id' })
      .select()
      .single();
    throwOnError(data, error, 'catalog.upsert');
    localStorage.setItem('taf_catalog_initialized', 'true');
    return fromDbCatalog(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('exercise_catalog').delete().eq('id', id);
    throwOnError(null, error, 'catalog.delete');
    localStorage.setItem('taf_catalog_initialized', 'true');
  },
};

// ── Running Workouts
export const runningApi = {
  getAllWorkouts: async (): Promise<RunningWorkout[]> => {
    const { data, error } = await supabase
      .from('running_workouts')
      .select('*')
      .order('created_at', { ascending: true });
    throwOnError(data, error, 'runningWorkouts.getAll');
    const items = (data || []).map(fromDbRunningWorkout);

    // Se as metas de corrida estiverem vazias e nunca foram inicializadas, faz o seed inicial no Supabase
    if (items.length === 0 && !localStorage.getItem('taf_running_initialized')) {
      try {
        const dbPayloads = DEFAULT_RUNNING_WORKOUTS.map(toDbRunningWorkout);
        const { data: inserted, error: insertErr } = await supabase
          .from('running_workouts')
          .insert(dbPayloads)
          .select();
        if (!insertErr && inserted && inserted.length > 0) {
          localStorage.setItem('taf_running_initialized', 'true');
          return inserted.map(fromDbRunningWorkout);
        }
      } catch (e) {
        console.warn('[Supabase Auto-seed] Running workouts seed failed:', e);
      }
      return DEFAULT_RUNNING_WORKOUTS;
    }

    return items;
  },

  upsertWorkout: async (workout: RunningWorkout): Promise<RunningWorkout> => {
    const dbPayload = toDbRunningWorkout(workout);
    const { data, error } = await supabase
      .from('running_workouts')
      .upsert(dbPayload, { onConflict: 'id' })
      .select()
      .single();
    throwOnError(data, error, 'runningWorkouts.upsert');
    localStorage.setItem('taf_running_initialized', 'true');
    return fromDbRunningWorkout(data);
  },

  deleteWorkout: async (id: string): Promise<void> => {
    const { error } = await supabase.from('running_workouts').delete().eq('id', id);
    throwOnError(null, error, 'runningWorkouts.delete');
    localStorage.setItem('taf_running_initialized', 'true');
  },

  getAllHistory: async (): Promise<RunningLog[]> => {
    const { data, error } = await supabase
      .from('running_history')
      .select('*')
      .order('date', { ascending: false });
    throwOnError(data, error, 'runningHistory.getAll');
    return (data || []).map(fromDbRunningHistory);
  },

  insertLog: async (log: RunningLog): Promise<RunningLog> => {
    const dbPayload = toDbRunningHistory(log);
    const { data, error } = await supabase
      .from('running_history')
      .insert(dbPayload)
      .select()
      .single();
    throwOnError(data, error, 'runningHistory.insert');
    return fromDbRunningHistory(data);
  },

  deleteLog: async (id: string): Promise<void> => {
    const { error } = await supabase.from('running_history').delete().eq('id', id);
    throwOnError(null, error, 'runningHistory.delete');
  },

  deleteAllHistory: async (): Promise<void> => {
    const { error } = await supabase.from('running_history').delete().neq('id', '');
    throwOnError(null, error, 'runningHistory.deleteAll');
  },
};
