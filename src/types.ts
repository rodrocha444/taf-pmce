export type ExerciseExecutionType = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  focusNotes?: string;
  executionType?: ExerciseExecutionType; // 'reps' (por repetição) ou 'time' (por tempo de execução)
  targetReps?: number;         // meta de repetições do exercício (quando executionType === 'reps')
  workDurationSeconds: number; // default 60 (1 min execution)
  restDurationSeconds: number; // default 60 (1 min rest)
  durationSeconds: number;     // total = work + rest (120s / 2 mins)
  category?: 'barra' | 'abdominal' | 'flexao' | 'perna' | 'isometria' | 'outros';
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionLog {
  id: string;
  workoutId: string;
  workoutTitle: string;
  date: string;
  durationSeconds: number;
  realDurationSeconds?: number;
  exercisesCompletedCount: number;
  exercisesSkippedCount: number;
  totalExercisesCount: number;
  status: 'completed' | 'cancelled';
  exerciseStatuses?: Record<number, 'completed' | 'skipped'>;
}

export interface UserSettings {
  soundBeepEnabled: boolean;
  ttsVoiceEnabled: boolean;
  prepCountdownSeconds: number; // e.g. 5 seconds preparation countdown
  keepScreenOn: boolean;
  autoAdvanceBlocks: boolean; // true = automatically advance to next exercise, false = pause and wait for tap
  volume: number; // 0 to 1
}

export type ExercisePhase = 'work' | 'rest';

export interface ActiveSession {
  workoutId: string;
  currentExerciseIndex: number;
  currentPhase: ExercisePhase;
  phaseTimeRemaining: number;
  exerciseTimeRemaining: number;
  totalTimeElapsed: number;
  isPaused: boolean;
  isPreparing: boolean;
  prepTimeRemaining: number;
  startTimestamp: number | null;
  lastUpdatedTimestamp: number | null;
  exerciseStatuses: Record<number, 'completed' | 'skipped'>;
}

export type RunningTargetMode = 'distance' | 'time' | 'pace' | 'interval';

export interface RunningWorkout {
  id: string;
  title: string;
  targetMode: RunningTargetMode; // 'distance', 'time', 'pace', 'interval'
  targetDistanceKm?: number;      // e.g. 2.4 (2.4 km)
  targetDurationSeconds?: number; // e.g. 720 (12 mins)
  targetPaceSecPerKm?: number;    // e.g. 300 (5:00 min/km)
  lapsCount?: number;             // e.g. 6 voltas
  lapDistanceMeters?: number;     // e.g. 400m por volta
  lapTargetSeconds?: number;      // e.g. 120s por volta (2 min)
  restBetweenLapsSeconds?: number; // e.g. 60s de descanso entre voltas
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface RunningLapDetail {
  lapNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  paceSecPerKm: number;
}

export interface RunningLog {
  id: string;
  workoutTitle: string;
  date: string;
  distanceKm: number;          // e.g. 2.4 km
  durationSeconds: number;     // e.g. 690s (11m 30s)
  paceSecPerKm: number;        // calculated min/km pace in seconds
  speedKmH: number;            // calculated km/h speed
  laps?: RunningLapDetail[];    // detalhamento por voltas/intervalos
  notes?: string;
}
