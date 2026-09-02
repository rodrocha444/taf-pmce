/**
 * turso-api.ts
 * Camada de acesso a dados (CRUD) com Turso LibSQL e Drizzle ORM.
 * Fornece tipagem estrita e auto-seed inteligente dos dados padrão.
 */
import { eq, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import {
  workouts,
  workoutHistory,
  exerciseCatalog,
  runningWorkouts,
  runningHistory,
  type WorkoutRow,
  type WorkoutHistoryRow,
  type ExerciseCatalogRow,
  type RunningWorkoutRow,
  type RunningHistoryRow,
} from '../db/schema';
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

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    exercises: row.exercises || [],
    isDefault: row.isDefault ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapHistory(row: WorkoutHistoryRow): WorkoutSessionLog {
  return {
    id: row.id,
    workoutId: row.workoutId,
    workoutTitle: row.workoutTitle,
    date: row.date,
    durationSeconds: row.durationSeconds,
    realDurationSeconds: row.realDurationSeconds ?? row.durationSeconds,
    exercisesCompletedCount: row.exercisesCompletedCount,
    exercisesSkippedCount: row.exercisesSkippedCount,
    totalExercisesCount: row.totalExercisesCount,
    status: (row.status as 'completed' | 'cancelled') || 'completed',
    exerciseStatuses: row.exerciseStatuses || {},
    exerciseLogs: row.exerciseLogs || [],
  };
}

function mapCatalog(row: ExerciseCatalogRow): ExerciseCatalogItem {
  return {
    id: row.id,
    name: row.name,
    executionType: row.executionType,
    defaultWorkDurationSeconds: row.defaultWorkDurationSeconds || 60,
    defaultRestDurationSeconds: row.defaultRestDurationSeconds || 60,
    defaultTargetReps: row.defaultTargetReps ?? undefined,
    focusNotes: row.focusNotes || '',
  };
}

function mapRunningWorkout(row: RunningWorkoutRow): RunningWorkout {
  return {
    id: row.id,
    title: row.title,
    targetMode: row.targetMode,
    targetDistanceKm: row.targetDistanceKm != null ? Number(row.targetDistanceKm) : undefined,
    targetDurationSeconds: row.targetDurationSeconds ?? undefined,
    targetPaceSecPerKm: row.targetPaceSecPerKm ?? undefined,
    lapsCount: row.lapsCount ?? undefined,
    lapDistanceMeters: row.lapDistanceMeters ?? undefined,
    lapTargetSeconds: row.lapTargetSeconds ?? undefined,
    restBetweenLapsSeconds: row.restBetweenLapsSeconds ?? undefined,
    notes: row.notes || '',
    isDefault: row.isDefault ?? false,
    createdAt: row.createdAt,
  };
}

function mapRunningHistory(row: RunningHistoryRow): RunningLog {
  return {
    id: row.id,
    workoutId: row.workoutId ?? undefined,
    workoutTitle: row.workoutTitle,
    date: row.date,
    distanceKm: Number(row.distanceKm),
    durationSeconds: Number(row.durationSeconds),
    paceSecPerKm: Number(row.paceSecPerKm),
    speedKmH: Number(row.speedKmH),
    laps: row.laps ?? undefined,
    notes: row.notes || '',
  };
}

// ─── API Endpoints ──────────────────────────────────────────────────────────

// ── Workouts
export const workoutsApi = {
  getAll: async (): Promise<Workout[]> => {
    try {
      const rows = await db.select().from(workouts).orderBy(asc(workouts.createdAt));
      const items = rows.map(mapWorkout);

      // Se o banco estiver vazio e nunca foi inicializado, insere o treino padrão inicial no Turso
      if (items.length === 0 && !localStorage.getItem('taf_workouts_initialized')) {
        try {
          const seeded = await workoutsApi.upsert(DEFAULT_TAF_WORKOUT);
          localStorage.setItem('taf_workouts_initialized', 'true');
          return [seeded];
        } catch (e) {
          console.warn('[Turso Auto-seed] Workouts seed failed:', e);
          return [DEFAULT_TAF_WORKOUT];
        }
      }

      return items;
    } catch (err: any) {
      console.error('[Turso API Error] workouts.getAll:', err);
      throw err;
    }
  },

  upsert: async (workout: Workout): Promise<Workout> => {
    try {
      const payload = {
        id: workout.id,
        title: workout.title,
        description: workout.description || null,
        exercises: workout.exercises || [],
        isDefault: workout.isDefault ?? false,
        createdAt: workout.createdAt || new Date().toISOString(),
        updatedAt: workout.updatedAt || new Date().toISOString(),
      };

      const [result] = await db
        .insert(workouts)
        .values(payload)
        .onConflictDoUpdate({
          target: workouts.id,
          set: {
            title: payload.title,
            description: payload.description,
            exercises: payload.exercises,
            isDefault: payload.isDefault,
            updatedAt: payload.updatedAt,
          },
        })
        .returning();

      localStorage.setItem('taf_workouts_initialized', 'true');
      return mapWorkout(result);
    } catch (err: any) {
      console.error('[Turso API Error] workouts.upsert:', err);
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await db.delete(workouts).where(eq(workouts.id, id));
      localStorage.setItem('taf_workouts_initialized', 'true');
    } catch (err: any) {
      console.error('[Turso API Error] workouts.delete:', err);
      throw err;
    }
  },
};

// ── Workout History
export const historyApi = {
  getAll: async (): Promise<WorkoutSessionLog[]> => {
    try {
      const rows = await db.select().from(workoutHistory).orderBy(desc(workoutHistory.date));
      return rows.map(mapHistory);
    } catch (err: any) {
      console.error('[Turso API Error] history.getAll:', err);
      throw err;
    }
  },

  insert: async (log: WorkoutSessionLog): Promise<WorkoutSessionLog> => {
    try {
      const [result] = await db
        .insert(workoutHistory)
        .values({
          id: log.id,
          workoutId: log.workoutId,
          workoutTitle: log.workoutTitle,
          date: log.date,
          durationSeconds: log.durationSeconds,
          realDurationSeconds: log.realDurationSeconds ?? null,
          exercisesCompletedCount: log.exercisesCompletedCount,
          exercisesSkippedCount: log.exercisesSkippedCount,
          totalExercisesCount: log.totalExercisesCount,
          status: log.status,
          exerciseStatuses: log.exerciseStatuses || {},
          exerciseLogs: log.exerciseLogs || [],
        })
        .returning();

      return mapHistory(result);
    } catch (err: any) {
      console.error('[Turso API Error] history.insert:', err);
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await db.delete(workoutHistory).where(eq(workoutHistory.id, id));
    } catch (err: any) {
      console.error('[Turso API Error] history.delete:', err);
      throw err;
    }
  },

  deleteAll: async (): Promise<void> => {
    try {
      await db.delete(workoutHistory);
    } catch (err: any) {
      console.error('[Turso API Error] history.deleteAll:', err);
      throw err;
    }
  },
};

// ── Exercise Catalog
export const catalogApi = {
  getAll: async (): Promise<ExerciseCatalogItem[]> => {
    try {
      const rows = await db.select().from(exerciseCatalog).orderBy(asc(exerciseCatalog.name));
      const items = rows.map(mapCatalog);

      // Se o catálogo estiver vazio e nunca foi inicializado, faz o seed das linhas no Turso
      if (items.length === 0 && !localStorage.getItem('taf_catalog_initialized')) {
        try {
          const insertPayloads = DEFAULT_EXERCISE_CATALOG.map((item) => ({
            id: item.id,
            name: item.name,
            executionType: item.executionType,
            defaultWorkDurationSeconds: item.defaultWorkDurationSeconds,
            defaultRestDurationSeconds: item.defaultRestDurationSeconds,
            defaultTargetReps: item.defaultTargetReps ?? null,
            focusNotes: item.focusNotes || null,
          }));

          const inserted = await db.insert(exerciseCatalog).values(insertPayloads).returning();
          if (inserted && inserted.length > 0) {
            localStorage.setItem('taf_catalog_initialized', 'true');
            return inserted.map(mapCatalog);
          }
        } catch (e) {
          console.warn('[Turso Auto-seed] Catalog seed failed:', e);
        }
        return DEFAULT_EXERCISE_CATALOG;
      }

      return items;
    } catch (err: any) {
      console.error('[Turso API Error] catalog.getAll:', err);
      throw err;
    }
  },

  insert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    try {
      const [result] = await db
        .insert(exerciseCatalog)
        .values({
          id: item.id,
          name: item.name,
          executionType: item.executionType,
          defaultWorkDurationSeconds: item.defaultWorkDurationSeconds,
          defaultRestDurationSeconds: item.defaultRestDurationSeconds,
          defaultTargetReps: item.defaultTargetReps ?? null,
          focusNotes: item.focusNotes || null,
        })
        .returning();

      localStorage.setItem('taf_catalog_initialized', 'true');
      return mapCatalog(result);
    } catch (err: any) {
      console.error('[Turso API Error] catalog.insert:', err);
      throw err;
    }
  },

  upsert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    try {
      const payload = {
        id: item.id,
        name: item.name,
        executionType: item.executionType,
        defaultWorkDurationSeconds: item.defaultWorkDurationSeconds,
        defaultRestDurationSeconds: item.defaultRestDurationSeconds,
        defaultTargetReps: item.defaultTargetReps ?? null,
        focusNotes: item.focusNotes || null,
      };

      const [result] = await db
        .insert(exerciseCatalog)
        .values(payload)
        .onConflictDoUpdate({
          target: exerciseCatalog.id,
          set: {
            name: payload.name,
            executionType: payload.executionType,
            defaultWorkDurationSeconds: payload.defaultWorkDurationSeconds,
            defaultRestDurationSeconds: payload.defaultRestDurationSeconds,
            defaultTargetReps: payload.defaultTargetReps,
            focusNotes: payload.focusNotes,
          },
        })
        .returning();

      localStorage.setItem('taf_catalog_initialized', 'true');
      return mapCatalog(result);
    } catch (err: any) {
      console.error('[Turso API Error] catalog.upsert:', err);
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await db.delete(exerciseCatalog).where(eq(exerciseCatalog.id, id));
      localStorage.setItem('taf_catalog_initialized', 'true');
    } catch (err: any) {
      console.error('[Turso API Error] catalog.delete:', err);
      throw err;
    }
  },
};

// ── Running Workouts
export const runningApi = {
  getAllWorkouts: async (): Promise<RunningWorkout[]> => {
    try {
      const rows = await db.select().from(runningWorkouts).orderBy(asc(runningWorkouts.createdAt));
      const items = rows.map(mapRunningWorkout);

      // Se as metas de corrida estiverem vazias e nunca foram inicializadas, faz o seed inicial no Turso
      if (items.length === 0 && !localStorage.getItem('taf_running_initialized')) {
        try {
          const insertPayloads = DEFAULT_RUNNING_WORKOUTS.map((r) => ({
            id: r.id,
            title: r.title,
            targetMode: r.targetMode,
            targetDistanceKm: r.targetDistanceKm ?? null,
            targetDurationSeconds: r.targetDurationSeconds ?? null,
            targetPaceSecPerKm: r.targetPaceSecPerKm ?? null,
            lapsCount: r.lapsCount ?? null,
            lapDistanceMeters: r.lapDistanceMeters ?? null,
            lapTargetSeconds: r.lapTargetSeconds ?? null,
            restBetweenLapsSeconds: r.restBetweenLapsSeconds ?? null,
            notes: r.notes || null,
            isDefault: r.isDefault ?? false,
            createdAt: r.createdAt || new Date().toISOString(),
          }));

          const inserted = await db.insert(runningWorkouts).values(insertPayloads).returning();
          if (inserted && inserted.length > 0) {
            localStorage.setItem('taf_running_initialized', 'true');
            return inserted.map(mapRunningWorkout);
          }
        } catch (e) {
          console.warn('[Turso Auto-seed] Running workouts seed failed:', e);
        }
        return DEFAULT_RUNNING_WORKOUTS;
      }

      return items;
    } catch (err: any) {
      console.error('[Turso API Error] runningWorkouts.getAll:', err);
      throw err;
    }
  },

  upsertWorkout: async (workout: RunningWorkout): Promise<RunningWorkout> => {
    try {
      const payload = {
        id: workout.id,
        title: workout.title,
        targetMode: workout.targetMode,
        targetDistanceKm: workout.targetDistanceKm ?? null,
        targetDurationSeconds: workout.targetDurationSeconds ?? null,
        targetPaceSecPerKm: workout.targetPaceSecPerKm ?? null,
        lapsCount: workout.lapsCount ?? null,
        lapDistanceMeters: workout.lapDistanceMeters ?? null,
        lapTargetSeconds: workout.lapTargetSeconds ?? null,
        restBetweenLapsSeconds: workout.restBetweenLapsSeconds ?? null,
        notes: workout.notes || null,
        isDefault: workout.isDefault ?? false,
        createdAt: workout.createdAt || new Date().toISOString(),
      };

      const [result] = await db
        .insert(runningWorkouts)
        .values(payload)
        .onConflictDoUpdate({
          target: runningWorkouts.id,
          set: {
            title: payload.title,
            targetMode: payload.targetMode,
            targetDistanceKm: payload.targetDistanceKm,
            targetDurationSeconds: payload.targetDurationSeconds,
            targetPaceSecPerKm: payload.targetPaceSecPerKm,
            lapsCount: payload.lapsCount,
            lapDistanceMeters: payload.lapDistanceMeters,
            lapTargetSeconds: payload.lapTargetSeconds,
            restBetweenLapsSeconds: payload.restBetweenLapsSeconds,
            notes: payload.notes,
            isDefault: payload.isDefault,
          },
        })
        .returning();

      localStorage.setItem('taf_running_initialized', 'true');
      return mapRunningWorkout(result);
    } catch (err: any) {
      console.error('[Turso API Error] runningWorkouts.upsert:', err);
      throw err;
    }
  },

  deleteWorkout: async (id: string): Promise<void> => {
    try {
      await db.delete(runningWorkouts).where(eq(runningWorkouts.id, id));
      localStorage.setItem('taf_running_initialized', 'true');
    } catch (err: any) {
      console.error('[Turso API Error] runningWorkouts.delete:', err);
      throw err;
    }
  },

  getAllHistory: async (): Promise<RunningLog[]> => {
    try {
      const rows = await db.select().from(runningHistory).orderBy(desc(runningHistory.date));
      return rows.map(mapRunningHistory);
    } catch (err: any) {
      console.error('[Turso API Error] runningHistory.getAll:', err);
      throw err;
    }
  },

  insertLog: async (log: RunningLog): Promise<RunningLog> => {
    try {
      const [result] = await db
        .insert(runningHistory)
        .values({
          id: log.id,
          workoutId: log.workoutId || null,
          workoutTitle: log.workoutTitle,
          date: log.date,
          distanceKm: log.distanceKm,
          durationSeconds: log.durationSeconds,
          paceSecPerKm: log.paceSecPerKm,
          speedKmH: log.speedKmH,
          laps: log.laps || null,
          notes: log.notes || null,
        })
        .returning();

      return mapRunningHistory(result);
    } catch (err: any) {
      console.error('[Turso API Error] runningHistory.insert:', err);
      throw err;
    }
  },

  deleteLog: async (id: string): Promise<void> => {
    try {
      await db.delete(runningHistory).where(eq(runningHistory.id, id));
    } catch (err: any) {
      console.error('[Turso API Error] runningHistory.delete:', err);
      throw err;
    }
  },

  deleteAllHistory: async (): Promise<void> => {
    try {
      await db.delete(runningHistory);
    } catch (err: any) {
      console.error('[Turso API Error] runningHistory.deleteAll:', err);
      throw err;
    }
  },
};
