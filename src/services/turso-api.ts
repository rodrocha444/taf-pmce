/**
 * turso-api.ts
 * Camada de acesso a dados (CRUD) direta no Turso LibSQL via Drizzle ORM.
 * Sem persistência em localStorage (exige configuração válida do banco de dados).
 */
import { eq, desc, asc } from 'drizzle-orm';
import { db, isTursoConfigured } from '../db';
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
import type {
  Workout,
  WorkoutSessionLog,
  ExerciseCatalogItem,
  RunningWorkout,
  RunningLog,
} from '../types';

export const DB_NOT_CONFIGURED_ERROR =
  'Banco de dados não configurado. Defina as variáveis VITE_TURSO_DATABASE_URL e VITE_TURSO_AUTH_TOKEN no .env para carregar e salvar dados.';

function getDb() {
  if (!db || !isTursoConfigured) {
    throw new Error(DB_NOT_CONFIGURED_ERROR);
  }
  return db;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
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

// ─── Workouts API ───────────────────────────────────────────────────────────

export const workoutsApi = {
  getAll: async (): Promise<Workout[]> => {
    const client = getDb();
    const rows = await client.select().from(workouts).orderBy(asc(workouts.createdAt));
    return rows.map(mapWorkout);
  },

  upsert: async (workout: Workout): Promise<Workout> => {
    const client = getDb();
    const dbPayload = {
      id: workout.id,
      title: workout.title,
      description: workout.description || null,
      exercises: workout.exercises || [],
      isDefault: workout.isDefault ?? false,
      createdAt: workout.createdAt || new Date().toISOString(),
      updatedAt: workout.updatedAt || new Date().toISOString(),
    };

    const [result] = await client
      .insert(workouts)
      .values(dbPayload)
      .onConflictDoUpdate({
        target: workouts.id,
        set: {
          title: dbPayload.title,
          description: dbPayload.description,
          exercises: dbPayload.exercises,
          isDefault: dbPayload.isDefault,
          updatedAt: dbPayload.updatedAt,
        },
      })
      .returning();

    return mapWorkout(result);
  },

  delete: async (id: string): Promise<void> => {
    const client = getDb();
    await client.delete(workouts).where(eq(workouts.id, id));
  },
};

// ─── Workout History API ────────────────────────────────────────────────────

export const historyApi = {
  getAll: async (): Promise<WorkoutSessionLog[]> => {
    const client = getDb();
    const rows = await client.select().from(workoutHistory).orderBy(desc(workoutHistory.date));
    return rows.map(mapHistory);
  },

  insert: async (log: WorkoutSessionLog): Promise<WorkoutSessionLog> => {
    const client = getDb();
    const [result] = await client
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
  },

  delete: async (id: string): Promise<void> => {
    const client = getDb();
    await client.delete(workoutHistory).where(eq(workoutHistory.id, id));
  },

  deleteAll: async (): Promise<void> => {
    const client = getDb();
    await client.delete(workoutHistory);
  },
};

// ─── Exercise Catalog API ───────────────────────────────────────────────────

export const catalogApi = {
  getAll: async (): Promise<ExerciseCatalogItem[]> => {
    const client = getDb();
    const rows = await client.select().from(exerciseCatalog).orderBy(asc(exerciseCatalog.name));
    return rows.map(mapCatalog);
  },

  insert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    return catalogApi.upsert(item);
  },

  upsert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    const client = getDb();
    const payload = {
      id: item.id,
      name: item.name,
      executionType: item.executionType,
      defaultWorkDurationSeconds: item.defaultWorkDurationSeconds,
      defaultRestDurationSeconds: item.defaultRestDurationSeconds,
      defaultTargetReps: item.defaultTargetReps ?? null,
      focusNotes: item.focusNotes || null,
    };

    const [result] = await client
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

    return mapCatalog(result);
  },

  delete: async (id: string): Promise<void> => {
    const client = getDb();
    await client.delete(exerciseCatalog).where(eq(exerciseCatalog.id, id));
  },
};

// ─── Running Workouts & History API ─────────────────────────────────────────

export const runningApi = {
  getAllWorkouts: async (): Promise<RunningWorkout[]> => {
    const client = getDb();
    const rows = await client.select().from(runningWorkouts).orderBy(asc(runningWorkouts.createdAt));
    return rows.map(mapRunningWorkout);
  },

  upsertWorkout: async (workout: RunningWorkout): Promise<RunningWorkout> => {
    const client = getDb();
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

    const [result] = await client
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

    return mapRunningWorkout(result);
  },

  deleteWorkout: async (id: string): Promise<void> => {
    const client = getDb();
    await client.delete(runningWorkouts).where(eq(runningWorkouts.id, id));
  },

  getAllHistory: async (): Promise<RunningLog[]> => {
    const client = getDb();
    const rows = await client.select().from(runningHistory).orderBy(desc(runningHistory.date));
    return rows.map(mapRunningHistory);
  },

  insertLog: async (log: RunningLog): Promise<RunningLog> => {
    const client = getDb();
    const [result] = await client
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
  },

  deleteLog: async (id: string): Promise<void> => {
    const client = getDb();
    await client.delete(runningHistory).where(eq(runningHistory.id, id));
  },

  deleteAllHistory: async (): Promise<void> => {
    const client = getDb();
    await client.delete(runningHistory);
  },
};
