import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import type {
  Exercise,
  ExerciseEvolutionLog,
  RunningLapDetail,
  RunningTargetMode,
  ExerciseExecutionType,
} from '../types';

// ─── 1. Workouts ─────────────────────────────────────────────────────────────
export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  exercises: text('exercises', { mode: 'json' }).$type<Exercise[]>().notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type WorkoutRow = typeof workouts.$inferSelect;
export type InsertWorkoutRow = typeof workouts.$inferInsert;

// ─── 2. Workout History ──────────────────────────────────────────────────────
export const workoutHistory = sqliteTable('workout_history', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull(),
  workoutTitle: text('workout_title').notNull(),
  date: text('date').notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  realDurationSeconds: integer('real_duration_seconds'),
  exercisesCompletedCount: integer('exercises_completed_count').notNull().default(0),
  exercisesSkippedCount: integer('exercises_skipped_count').notNull().default(0),
  totalExercisesCount: integer('total_exercises_count').notNull().default(0),
  status: text('status').notNull().default('completed'),
  exerciseStatuses: text('exercise_statuses', { mode: 'json' }).$type<Record<number, 'completed' | 'skipped'>>(),
  exerciseLogs: text('exercise_logs', { mode: 'json' }).$type<ExerciseEvolutionLog[]>(),
});

export type WorkoutHistoryRow = typeof workoutHistory.$inferSelect;
export type InsertWorkoutHistoryRow = typeof workoutHistory.$inferInsert;

// ─── 3. Exercise Catalog ────────────────────────────────────────────────────
export const exerciseCatalog = sqliteTable('exercise_catalog', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  executionType: text('execution_type').$type<ExerciseExecutionType>().notNull().default('reps'),
  defaultWorkDurationSeconds: integer('default_work_duration_seconds').notNull().default(60),
  defaultRestDurationSeconds: integer('default_rest_duration_seconds').notNull().default(60),
  defaultTargetReps: integer('default_target_reps'),
  focusNotes: text('focus_notes'),
});

export type ExerciseCatalogRow = typeof exerciseCatalog.$inferSelect;
export type InsertExerciseCatalogRow = typeof exerciseCatalog.$inferInsert;

// ─── 4. Running Workouts ────────────────────────────────────────────────────
export const runningWorkouts = sqliteTable('running_workouts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  targetMode: text('target_mode').$type<RunningTargetMode>().notNull().default('distance'),
  targetDistanceKm: real('target_distance_km'),
  targetDurationSeconds: integer('target_duration_seconds'),
  targetPaceSecPerKm: integer('target_pace_sec_per_km'),
  lapsCount: integer('laps_count'),
  lapDistanceMeters: integer('lap_distance_meters'),
  lapTargetSeconds: integer('lap_target_seconds'),
  restBetweenLapsSeconds: integer('rest_between_laps_seconds'),
  notes: text('notes'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export type RunningWorkoutRow = typeof runningWorkouts.$inferSelect;
export type InsertRunningWorkoutRow = typeof runningWorkouts.$inferInsert;

// ─── 5. Running History ─────────────────────────────────────────────────────
export const runningHistory = sqliteTable('running_history', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id'),
  workoutTitle: text('workout_title').notNull(),
  date: text('date').notNull(),
  distanceKm: real('distance_km').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  paceSecPerKm: integer('pace_sec_per_km').notNull(),
  speedKmH: real('speed_km_h').notNull(),
  laps: text('laps', { mode: 'json' }).$type<RunningLapDetail[]>(),
  notes: text('notes'),
});

export type RunningHistoryRow = typeof runningHistory.$inferSelect;
export type InsertRunningHistoryRow = typeof runningHistory.$inferInsert;
