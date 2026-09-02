/**
 * turso-api.ts
 * Camada de acesso a dados (CRUD) local-first com sincronização Turso LibSQL e Drizzle ORM.
 * Fornece persistência limpa via localStorage com sincronização opcional na nuvem.
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

// ─── Local Storage Keys ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  WORKOUTS: 'taf_workouts_v2',
  HISTORY: 'taf_workout_history_v2',
  CATALOG: 'taf_exercise_catalog_v2',
  RUNNING_WORKOUTS: 'taf_running_workouts_v2',
  RUNNING_HISTORY: 'taf_running_history_v2',
};

function readLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[LocalStorage] Falha ao ler ${key}:`, err);
    return defaultValue;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[LocalStorage] Falha ao salvar ${key}:`, err);
  }
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
    const localList = readLocal<Workout[]>(STORAGE_KEYS.WORKOUTS, []);

    if (db && isTursoConfigured) {
      try {
        const rows = await db.select().from(workouts).orderBy(asc(workouts.createdAt));
        const items = rows.map(mapWorkout);
        writeLocal(STORAGE_KEYS.WORKOUTS, items);
        return items;
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao obter treinos da nuvem, usando cache local:', err);
      }
    }

    return localList;
  },

  upsert: async (workout: Workout): Promise<Workout> => {
    const payload: Workout = {
      id: workout.id,
      title: workout.title,
      description: workout.description || '',
      exercises: workout.exercises || [],
      isDefault: workout.isDefault ?? false,
      createdAt: workout.createdAt || new Date().toISOString(),
      updatedAt: workout.updatedAt || new Date().toISOString(),
    };

    const currentList = readLocal<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    const exists = currentList.some(w => w.id === payload.id);
    const updatedList = exists
      ? currentList.map(w => (w.id === payload.id ? payload : w))
      : [...currentList, payload];
    writeLocal(STORAGE_KEYS.WORKOUTS, updatedList);

    if (db && isTursoConfigured) {
      try {
        const dbPayload = {
          id: payload.id,
          title: payload.title,
          description: payload.description || null,
          exercises: payload.exercises,
          isDefault: payload.isDefault ?? false,
          createdAt: payload.createdAt || new Date().toISOString(),
          updatedAt: payload.updatedAt || new Date().toISOString(),
        };

        const [result] = await db
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
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao sincronizar treino com a nuvem, salvo localmente:', err);
      }
    }

    return payload;
  },

  delete: async (id: string): Promise<void> => {
    const currentList = readLocal<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    const filtered = currentList.filter(w => w.id !== id);
    writeLocal(STORAGE_KEYS.WORKOUTS, filtered);

    if (db && isTursoConfigured) {
      try {
        await db.delete(workouts).where(eq(workouts.id, id));
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao excluir treino da nuvem:', err);
      }
    }
  },
};

// ─── Workout History API ────────────────────────────────────────────────────

export const historyApi = {
  getAll: async (): Promise<WorkoutSessionLog[]> => {
    const localHistory = readLocal<WorkoutSessionLog[]>(STORAGE_KEYS.HISTORY, []);

    if (db && isTursoConfigured) {
      try {
        const rows = await db.select().from(workoutHistory).orderBy(desc(workoutHistory.date));
        const items = rows.map(mapHistory);
        writeLocal(STORAGE_KEYS.HISTORY, items);
        return items;
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao obter histórico da nuvem, usando cache local:', err);
      }
    }

    return localHistory;
  },

  insert: async (log: WorkoutSessionLog): Promise<WorkoutSessionLog> => {
    const localHistory = readLocal<WorkoutSessionLog[]>(STORAGE_KEYS.HISTORY, []);
    writeLocal(STORAGE_KEYS.HISTORY, [log, ...localHistory]);

    if (db && isTursoConfigured) {
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
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao sincronizar histórico na nuvem, salvo localmente:', err);
      }
    }

    return log;
  },

  delete: async (id: string): Promise<void> => {
    const localHistory = readLocal<WorkoutSessionLog[]>(STORAGE_KEYS.HISTORY, []);
    writeLocal(STORAGE_KEYS.HISTORY, localHistory.filter(h => h.id !== id));

    if (db && isTursoConfigured) {
      try {
        await db.delete(workoutHistory).where(eq(workoutHistory.id, id));
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao remover item do histórico na nuvem:', err);
      }
    }
  },

  deleteAll: async (): Promise<void> => {
    writeLocal(STORAGE_KEYS.HISTORY, []);

    if (db && isTursoConfigured) {
      try {
        await db.delete(workoutHistory);
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao limpar histórico na nuvem:', err);
      }
    }
  },
};

// ─── Exercise Catalog API ───────────────────────────────────────────────────

export const catalogApi = {
  getAll: async (): Promise<ExerciseCatalogItem[]> => {
    const localCatalog = readLocal<ExerciseCatalogItem[]>(STORAGE_KEYS.CATALOG, []);

    if (db && isTursoConfigured) {
      try {
        const rows = await db.select().from(exerciseCatalog).orderBy(asc(exerciseCatalog.name));
        const items = rows.map(mapCatalog);
        writeLocal(STORAGE_KEYS.CATALOG, items);
        return items;
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao carregar catálogo da nuvem, usando cache local:', err);
      }
    }

    return localCatalog;
  },

  insert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    return catalogApi.upsert(item);
  },

  upsert: async (item: ExerciseCatalogItem): Promise<ExerciseCatalogItem> => {
    const current = readLocal<ExerciseCatalogItem[]>(STORAGE_KEYS.CATALOG, []);
    const exists = current.some(c => c.id === item.id);
    const updated = exists ? current.map(c => (c.id === item.id ? item : c)) : [...current, item];
    writeLocal(STORAGE_KEYS.CATALOG, updated);

    if (db && isTursoConfigured) {
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

        return mapCatalog(result);
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao sincronizar item do catálogo na nuvem:', err);
      }
    }

    return item;
  },

  delete: async (id: string): Promise<void> => {
    const current = readLocal<ExerciseCatalogItem[]>(STORAGE_KEYS.CATALOG, []);
    writeLocal(STORAGE_KEYS.CATALOG, current.filter(c => c.id !== id));

    if (db && isTursoConfigured) {
      try {
        await db.delete(exerciseCatalog).where(eq(exerciseCatalog.id, id));
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao excluir item do catálogo na nuvem:', err);
      }
    }
  },
};

// ─── Running Workouts & History API ─────────────────────────────────────────

export const runningApi = {
  getAllWorkouts: async (): Promise<RunningWorkout[]> => {
    const localWorkouts = readLocal<RunningWorkout[]>(STORAGE_KEYS.RUNNING_WORKOUTS, []);

    if (db && isTursoConfigured) {
      try {
        const rows = await db.select().from(runningWorkouts).orderBy(asc(runningWorkouts.createdAt));
        const items = rows.map(mapRunningWorkout);
        writeLocal(STORAGE_KEYS.RUNNING_WORKOUTS, items);
        return items;
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao carregar metas de corrida da nuvem, usando cache local:', err);
      }
    }

    return localWorkouts;
  },

  upsertWorkout: async (workout: RunningWorkout): Promise<RunningWorkout> => {
    const current = readLocal<RunningWorkout[]>(STORAGE_KEYS.RUNNING_WORKOUTS, []);
    const exists = current.some(r => r.id === workout.id);
    const updated = exists ? current.map(r => (r.id === workout.id ? workout : r)) : [...current, workout];
    writeLocal(STORAGE_KEYS.RUNNING_WORKOUTS, updated);

    if (db && isTursoConfigured) {
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

        return mapRunningWorkout(result);
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao salvar treino de corrida na nuvem:', err);
      }
    }

    return workout;
  },

  deleteWorkout: async (id: string): Promise<void> => {
    const current = readLocal<RunningWorkout[]>(STORAGE_KEYS.RUNNING_WORKOUTS, []);
    writeLocal(STORAGE_KEYS.RUNNING_WORKOUTS, current.filter(r => r.id !== id));

    if (db && isTursoConfigured) {
      try {
        await db.delete(runningWorkouts).where(eq(runningWorkouts.id, id));
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao excluir treino de corrida na nuvem:', err);
      }
    }
  },

  getAllHistory: async (): Promise<RunningLog[]> => {
    const localLogs = readLocal<RunningLog[]>(STORAGE_KEYS.RUNNING_HISTORY, []);

    if (db && isTursoConfigured) {
      try {
        const rows = await db.select().from(runningHistory).orderBy(desc(runningHistory.date));
        const items = rows.map(mapRunningHistory);
        writeLocal(STORAGE_KEYS.RUNNING_HISTORY, items);
        return items;
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao carregar histórico de corrida da nuvem, usando cache local:', err);
      }
    }

    return localLogs;
  },

  insertLog: async (log: RunningLog): Promise<RunningLog> => {
    const current = readLocal<RunningLog[]>(STORAGE_KEYS.RUNNING_HISTORY, []);
    writeLocal(STORAGE_KEYS.RUNNING_HISTORY, [log, ...current]);

    if (db && isTursoConfigured) {
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
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao salvar registro de corrida na nuvem:', err);
      }
    }

    return log;
  },

  deleteLog: async (id: string): Promise<void> => {
    const current = readLocal<RunningLog[]>(STORAGE_KEYS.RUNNING_HISTORY, []);
    writeLocal(STORAGE_KEYS.RUNNING_HISTORY, current.filter(l => l.id !== id));

    if (db && isTursoConfigured) {
      try {
        await db.delete(runningHistory).where(eq(runningHistory.id, id));
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao excluir registro de corrida na nuvem:', err);
      }
    }
  },

  deleteAllHistory: async (): Promise<void> => {
    writeLocal(STORAGE_KEYS.RUNNING_HISTORY, []);

    if (db && isTursoConfigured) {
      try {
        await db.delete(runningHistory);
      } catch (err) {
        console.warn('[Turso API Warning] Falha ao limpar histórico de corrida na nuvem:', err);
      }
    }
  },
};

