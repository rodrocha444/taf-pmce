import Dexie, { type Table } from 'dexie';
import type { Workout, WorkoutSessionLog, RunningWorkout, RunningLog, ActiveSession, ExerciseEvolutionLog, ExerciseCatalogItem } from '../types';

export class TafPmceDatabase extends Dexie {
  workouts!: Table<Workout, string>;
  history!: Table<WorkoutSessionLog, string>;
  exerciseEvolution!: Table<ExerciseEvolutionLog, string>;
  exerciseCatalog!: Table<ExerciseCatalogItem, string>;
  runningWorkouts!: Table<RunningWorkout, string>;
  runningHistory!: Table<RunningLog, string>;
  activeSessionState!: Table<{ id: string; session: ActiveSession | null }, string>;

  constructor() {
    super('TafPmceDatabase');
    
    // Define Database Schema and Indexes
    this.version(3).stores({
      workouts: 'id, title, active, createdAt',
      history: 'id, workoutId, status, timestamp',
      exerciseEvolution: 'id, exerciseId, exerciseName, category, timestamp',
      exerciseCatalog: 'id, name, category, executionType',
      runningWorkouts: 'id, title, targetMode, createdAt',
      runningHistory: 'id, workoutTitle, date, distanceKm, durationSeconds',
      activeSessionState: 'id'
    });
  }
}

export const db = new TafPmceDatabase();
