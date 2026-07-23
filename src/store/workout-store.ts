import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import type { Workout, ActiveSession, WorkoutSessionLog, UserSettings, Exercise } from '../types';
import { DEFAULT_TAF_WORKOUT } from '../data/default-workout';
import { audioEngine } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { wakeLockManager } from '../utils/wake-lock';

interface WorkoutStore {
  workouts: Workout[];
  activeWorkoutId: string;
  activeSession: ActiveSession | null;
  history: WorkoutSessionLog[];
  settings: UserSettings;

  // Actions
  getActiveWorkout: () => Workout;
  startWorkout: (workoutId?: string) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  tickSession: () => void;
  completeExercise: () => void;
  skipExercise: () => void;
  nextExercise: () => void;
  prevExercise: () => void;
  finishWorkout: (status?: 'completed' | 'cancelled') => void;
  deleteHistoryLog: (id: string) => void;
  clearHistory: () => void;
  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  resetDefaultWorkout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  addExerciseToWorkout: (workoutId: string, exercise: Omit<Exercise, 'id' | 'durationSeconds'>) => void;
  updateExerciseInWorkout: (workoutId: string, exercise: Exercise) => void;
  updateActiveExercise: (exerciseId: string, updates: { targetReps?: number; workDurationSeconds?: number; restDurationSeconds?: number }) => void;
  deleteExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  reorderExercisesInWorkout: (workoutId: string, startIndex: number, endIndex: number) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [DEFAULT_TAF_WORKOUT],
      activeWorkoutId: DEFAULT_TAF_WORKOUT.id,
      activeSession: null,
      history: [],
      settings: {
        soundBeepEnabled: true,
        ttsVoiceEnabled: true,
        prepCountdownSeconds: 5,
        keepScreenOn: true,
        autoAdvanceBlocks: true,
        volume: 1
      },

      getActiveWorkout: () => {
        const { workouts, activeWorkoutId } = get();
        return workouts.find(w => w.id === activeWorkoutId) || workouts[0] || DEFAULT_TAF_WORKOUT;
      },

      startWorkout: (workoutId) => {
        const targetId = workoutId || get().activeWorkoutId;
        const workout = get().workouts.find(w => w.id === targetId) || get().getActiveWorkout();
        if (!workout.exercises.length) return;

        const settings = get().settings;
        if (settings.keepScreenOn) {
          wakeLockManager.request();
        }

        const isPreparing = settings.prepCountdownSeconds > 0;
        const firstExercise = workout.exercises[0];

        const initialSession: ActiveSession = {
          workoutId: workout.id,
          currentExerciseIndex: 0,
          currentPhase: 'work',
          phaseTimeRemaining: firstExercise.workDurationSeconds || 60,
          exerciseTimeRemaining: firstExercise.durationSeconds,
          totalTimeElapsed: 0,
          isPaused: false,
          isPreparing,
          prepTimeRemaining: isPreparing ? settings.prepCountdownSeconds : 0,
          startTimestamp: Date.now(),
          lastUpdatedTimestamp: Date.now(),
          exerciseStatuses: {}
        };

        set({ activeWorkoutId: workout.id, activeSession: initialSession });

        if (isPreparing) {
          if (settings.ttsVoiceEnabled) {
            speechEngine.speak(`Treino iniciando em ${settings.prepCountdownSeconds} segundos. Prepare-se para ${firstExercise.name}`);
          }
        } else {
          if (settings.soundBeepEnabled) audioEngine.playGoBeep();
          if (settings.ttsVoiceEnabled) speechEngine.speak(`Valendo! Execução: ${firstExercise.name}`);
        }
      },

      pauseWorkout: () => {
        const session = get().activeSession;
        if (!session) return;
        set({ activeSession: { ...session, isPaused: true } });
        if (get().settings.ttsVoiceEnabled) speechEngine.speak('Treino pausado');
      },

      resumeWorkout: () => {
        const session = get().activeSession;
        if (!session) return;
        set({
          activeSession: {
            ...session,
            isPaused: false,
            lastUpdatedTimestamp: Date.now()
          }
        });
        if (get().settings.ttsVoiceEnabled) speechEngine.speak('Treino retomado');
      },

      tickSession: () => {
        const session = get().activeSession;
        if (!session || session.isPaused) return;

        const { settings, workouts } = get();
        const workout = workouts.find(w => w.id === session.workoutId) || DEFAULT_TAF_WORKOUT;

        // Preparation phase countdown
        if (session.isPreparing) {
          const nextPrepRemaining = session.prepTimeRemaining - 1;

          if (nextPrepRemaining > 0) {
            if (settings.soundBeepEnabled && nextPrepRemaining <= 3) {
              audioEngine.playCountdownTick();
            }
            set({
              activeSession: {
                ...session,
                prepTimeRemaining: nextPrepRemaining,
                lastUpdatedTimestamp: Date.now()
              }
            });
          } else {
            const firstEx = workout.exercises[0];
            if (settings.soundBeepEnabled) audioEngine.playGoBeep();
            if (settings.ttsVoiceEnabled) speechEngine.speak(`Valendo! Execução: ${firstEx.name}`);

            set({
              activeSession: {
                ...session,
                isPreparing: false,
                prepTimeRemaining: 0,
                currentPhase: 'work',
                phaseTimeRemaining: firstEx.workDurationSeconds || 60,
                exerciseTimeRemaining: firstEx.durationSeconds,
                lastUpdatedTimestamp: Date.now()
              }
            });
          }
          return;
        }

        const currentExercise = workout.exercises[session.currentExerciseIndex];
        if (!currentExercise) {
          get().finishWorkout('completed');
          return;
        }

        const nextPhaseTime = session.phaseTimeRemaining - 1;
        const nextExerciseTime = session.exerciseTimeRemaining - 1;
        const nextTotalElapsed = session.totalTimeElapsed + 1;

        // Audio tick countdown at final 3 seconds of phase
        if (settings.soundBeepEnabled && nextPhaseTime <= 3 && nextPhaseTime > 0) {
          audioEngine.playCountdownTick();
        }

        // Voice alert 10 seconds before rest ends
        if (session.currentPhase === 'rest' && settings.ttsVoiceEnabled && nextPhaseTime === 10) {
          const nextExIndex = session.currentExerciseIndex + 1;
          if (nextExIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextExIndex];
            speechEngine.speak(`Em dez segundos, próxima execução: ${nextEx.name}`);
          }
        }

        if (nextPhaseTime > 0) {
          set({
            activeSession: {
              ...session,
              phaseTimeRemaining: nextPhaseTime,
              exerciseTimeRemaining: nextExerciseTime,
              totalTimeElapsed: nextTotalElapsed,
              lastUpdatedTimestamp: Date.now()
            }
          });
        } else {
          // Phase finished naturally!
          if (session.currentPhase === 'work') {
            // Execution finished naturally -> mark completed!
            const newStatuses = {
              ...session.exerciseStatuses,
              [session.currentExerciseIndex]: session.exerciseStatuses[session.currentExerciseIndex] || ('completed' as const)
            };

            if (settings.soundBeepEnabled) audioEngine.playGoBeep();
            const restTime = currentExercise.restDurationSeconds || 60;
            const nextExItem = workout.exercises[session.currentExerciseIndex + 1];

            if (settings.ttsVoiceEnabled) {
              if (nextExItem) {
                speechEngine.speak(`Execução concluída! Respire. Próximo exercício: ${nextExItem.name}`);
              } else {
                speechEngine.speak(`Descanso final! Treino quase concluído!`);
              }
            }

            set({
              activeSession: {
                ...session,
                exerciseStatuses: newStatuses,
                currentPhase: 'rest',
                phaseTimeRemaining: restTime,
                exerciseTimeRemaining: nextExerciseTime,
                totalTimeElapsed: nextTotalElapsed,
                lastUpdatedTimestamp: Date.now()
              }
            });
          } else {
            // Rest finished naturally -> Switch from Rest -> Next Exercise Work Phase
            const nextIndex = session.currentExerciseIndex + 1;

            if (nextIndex < workout.exercises.length) {
              const nextEx = workout.exercises[nextIndex];
              const shouldPause = !settings.autoAdvanceBlocks;

              if (settings.soundBeepEnabled) audioEngine.playGoBeep();

              if (shouldPause) {
                if (settings.ttsVoiceEnabled) {
                  speechEngine.speak(`Bloco concluído! Pausado. Toque em Continuar quando estiver pronto para: ${nextEx.name}`);
                }
              } else {
                if (settings.ttsVoiceEnabled) {
                  speechEngine.speak(`Valendo! Execução: ${nextEx.name}`);
                }
              }

              set({
                activeSession: {
                  ...session,
                  currentExerciseIndex: nextIndex,
                  currentPhase: 'work',
                  phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                  exerciseTimeRemaining: nextEx.durationSeconds,
                  totalTimeElapsed: nextTotalElapsed,
                  isPaused: shouldPause,
                  lastUpdatedTimestamp: Date.now()
                }
              });
            } else {
              // Entire workout finished!
              get().finishWorkout('completed');
            }
          }
        }
      },

      // CONCLUIR: Explicitly marks exercise as completed
      completeExercise: () => {
        const session = get().activeSession;
        if (!session) return;
        const workout = get().getActiveWorkout();
        const settings = get().settings;
        const shouldPause = !settings.autoAdvanceBlocks;

        const currentExIndex = session.currentExerciseIndex;
        const newStatuses = {
          ...session.exerciseStatuses,
          [currentExIndex]: session.exerciseStatuses[currentExIndex] || ('completed' as const)
        };

        if (session.currentPhase === 'work') {
          const currentEx = workout.exercises[currentExIndex];
          if (settings.ttsVoiceEnabled) speechEngine.speak('Execução concluída! Descanso.');

          set({
            activeSession: {
              ...session,
              exerciseStatuses: { ...newStatuses, [currentExIndex]: 'completed' },
              currentPhase: 'rest',
              phaseTimeRemaining: currentEx.restDurationSeconds || 60,
              isPreparing: false,
              isPaused: shouldPause
            }
          });
        } else {
          // If in rest phase, skipping rest advances directly to next exercise work phase
          const nextIndex = currentExIndex + 1;
          if (nextIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextIndex];
            if (settings.ttsVoiceEnabled) speechEngine.speak(`Descanso pulado. Valendo: ${nextEx.name}`);

            set({
              activeSession: {
                ...session,
                exerciseStatuses: newStatuses,
                currentExerciseIndex: nextIndex,
                currentPhase: 'work',
                phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                exerciseTimeRemaining: nextEx.durationSeconds,
                isPreparing: false,
                isPaused: shouldPause
              }
            });
          } else {
            set({ activeSession: { ...session, exerciseStatuses: newStatuses } });
            get().finishWorkout('completed');
          }
        }
      },

      // PULAR:
      // If during WORK phase: marks exercise as SKIPPED and enters rest phase.
      // If during REST phase: ONLY skips the rest phase (preserves completed status of exercise execution)!
      skipExercise: () => {
        const session = get().activeSession;
        if (!session) return;
        const workout = get().getActiveWorkout();
        const settings = get().settings;
        const shouldPause = !settings.autoAdvanceBlocks;

        const currentExIndex = session.currentExerciseIndex;

        if (session.currentPhase === 'work') {
          // Skipping execution phase -> Mark exercise as 'skipped'
          const currentEx = workout.exercises[currentExIndex];
          const newStatuses = { ...session.exerciseStatuses, [currentExIndex]: 'skipped' as const };

          if (settings.ttsVoiceEnabled) speechEngine.speak('Execução pulada.');

          set({
            activeSession: {
              ...session,
              exerciseStatuses: newStatuses,
              currentPhase: 'rest',
              phaseTimeRemaining: currentEx.restDurationSeconds || 60,
              isPreparing: false,
              isPaused: shouldPause
            }
          });
        } else {
          // Tapping Pular during REST phase -> Only skip the rest! Preserve exercise status (defaults to completed)!
          const currentStatus = session.exerciseStatuses[currentExIndex] || 'completed';
          const newStatuses = { ...session.exerciseStatuses, [currentExIndex]: currentStatus };

          const nextIndex = currentExIndex + 1;
          if (nextIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextIndex];
            if (settings.ttsVoiceEnabled) speechEngine.speak(`Descanso pulado. Valendo: ${nextEx.name}`);

            set({
              activeSession: {
                ...session,
                exerciseStatuses: newStatuses,
                currentExerciseIndex: nextIndex,
                currentPhase: 'work',
                phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                exerciseTimeRemaining: nextEx.durationSeconds,
                isPreparing: false,
                isPaused: shouldPause
              }
            });
          } else {
            set({ activeSession: { ...session, exerciseStatuses: newStatuses } });
            get().finishWorkout('completed');
          }
        }
      },

      nextExercise: () => {
        const session = get().activeSession;
        if (session?.currentPhase === 'work') {
          get().skipExercise();
        } else {
          get().completeExercise();
        }
      },

      prevExercise: () => {
        const session = get().activeSession;
        if (!session) return;
        const workout = get().getActiveWorkout();

        if (session.currentPhase === 'rest') {
          const currentEx = workout.exercises[session.currentExerciseIndex];
          set({
            activeSession: {
              ...session,
              currentPhase: 'work',
              phaseTimeRemaining: currentEx.workDurationSeconds || 60,
              isPreparing: false
            }
          });
        } else {
          const prevIndex = Math.max(0, session.currentExerciseIndex - 1);
          const prevEx = workout.exercises[prevIndex];

          set({
            activeSession: {
              ...session,
              currentExerciseIndex: prevIndex,
              currentPhase: 'work',
              phaseTimeRemaining: prevEx.workDurationSeconds || 60,
              exerciseTimeRemaining: prevEx.durationSeconds,
              isPreparing: false
            }
          });
        }
      },

      finishWorkout: (status = 'completed') => {
        const session = get().activeSession;
        const { workouts, settings } = get();

        wakeLockManager.release();

        if (session) {
          const workout = workouts.find(w => w.id === session.workoutId) || DEFAULT_TAF_WORKOUT;

          const statuses = session.exerciseStatuses || {};
          const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
          const skippedCount = Object.values(statuses).filter(s => s === 'skipped').length;

          if (status === 'completed') {
            if (settings.soundBeepEnabled) audioEngine.playCompletionFanfare();
            if (settings.ttsVoiceEnabled) speechEngine.speak('Parabéns! Treino TAF concluído com sucesso!');
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            } catch (e) {
              console.warn('Confetti failed:', e);
            }
          } else {
            if (settings.ttsVoiceEnabled) speechEngine.speak('Treino encerrado.');
          }

          const realElapsed = session.startTimestamp
            ? Math.max(0, Math.floor((Date.now() - session.startTimestamp) / 1000))
            : session.totalTimeElapsed;

          const log: WorkoutSessionLog = {
            id: `log-${Date.now()}`,
            workoutId: workout.id,
            workoutTitle: workout.title,
            date: new Date().toISOString(),
            durationSeconds: session.totalTimeElapsed,
            realDurationSeconds: realElapsed,
            exercisesCompletedCount: completedCount,
            exercisesSkippedCount: skippedCount,
            totalExercisesCount: workout.exercises.length,
            status,
            exerciseStatuses: statuses
          };

          set(state => ({
            history: [log, ...state.history],
            activeSession: null
          }));
        } else {
          set({ activeSession: null });
        }
      },

      deleteHistoryLog: (id: string) => {
        set(state => ({
          history: state.history.filter(h => h.id !== id)
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      saveWorkout: (updatedWorkout) => {
        set(state => {
          const exists = state.workouts.some(w => w.id === updatedWorkout.id);
          const newWorkouts = exists
            ? state.workouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w)
            : [...state.workouts, updatedWorkout];
          return { workouts: newWorkouts };
        });
      },

      deleteWorkout: (id) => {
        set(state => ({
          workouts: state.workouts.filter(w => w.id !== id || w.isDefault),
          activeWorkoutId: state.activeWorkoutId === id ? DEFAULT_TAF_WORKOUT.id : state.activeWorkoutId
        }));
      },

      resetDefaultWorkout: () => {
        set(state => ({
          workouts: state.workouts.map(w => w.id === DEFAULT_TAF_WORKOUT.id ? { ...DEFAULT_TAF_WORKOUT, updatedAt: new Date().toISOString() } : w)
        }));
      },

      updateSettings: (newSettings) => {
        set(state => ({ settings: { ...state.settings, ...newSettings } }));
      },

      addExerciseToWorkout: (workoutId, exerciseData) => {
        const workSecs = exerciseData.workDurationSeconds || 60;
        const restSecs = exerciseData.restDurationSeconds || 60;
        const newExercise: Exercise = {
          ...exerciseData,
          id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          workDurationSeconds: workSecs,
          restDurationSeconds: restSecs,
          durationSeconds: workSecs + restSecs
        };
        set(state => ({
          workouts: state.workouts.map(w => {
            if (w.id === workoutId) {
              return {
                ...w,
                exercises: [...w.exercises, newExercise],
                updatedAt: new Date().toISOString()
              };
            }
            return w;
          })
        }));
      },

      updateExerciseInWorkout: (workoutId, updatedExercise) => {
        const workSecs = updatedExercise.workDurationSeconds || 60;
        const restSecs = updatedExercise.restDurationSeconds || 60;
        const finalExercise: Exercise = {
          ...updatedExercise,
          workDurationSeconds: workSecs,
          restDurationSeconds: restSecs,
          durationSeconds: workSecs + restSecs
        };
        set(state => ({
          workouts: state.workouts.map(w => {
            if (w.id === workoutId) {
              return {
                ...w,
                exercises: w.exercises.map(e => e.id === finalExercise.id ? finalExercise : e),
                updatedAt: new Date().toISOString()
              };
            }
            return w;
          })
        }));
      },

      updateActiveExercise: (exerciseId, updates) => {
        set(state => {
          const activeWorkout = state.workouts.find(w => w.id === state.activeWorkoutId);
          if (!activeWorkout) return state;

          const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            const workSecs = updates.workDurationSeconds !== undefined ? Math.max(5, updates.workDurationSeconds) : (ex.workDurationSeconds || 60);
            const restSecs = updates.restDurationSeconds !== undefined ? Math.max(0, updates.restDurationSeconds) : (ex.restDurationSeconds || 60);
            return {
              ...ex,
              targetReps: updates.targetReps !== undefined ? updates.targetReps : ex.targetReps,
              workDurationSeconds: workSecs,
              restDurationSeconds: restSecs,
              durationSeconds: workSecs + restSecs
            };
          });

          const updatedWorkouts = state.workouts.map(w =>
            w.id === activeWorkout.id ? { ...w, exercises: updatedExercises, updatedAt: new Date().toISOString() } : w
          );

          let updatedSession = state.activeSession;
          if (updatedSession && updatedSession.workoutId === activeWorkout.id) {
            const currentEx = updatedExercises[updatedSession.currentExerciseIndex];
            if (currentEx && currentEx.id === exerciseId) {
              const isWork = updatedSession.currentPhase === 'work';
              const maxPhaseTime = isWork ? (currentEx.workDurationSeconds || 60) : (currentEx.restDurationSeconds || 60);
              const phaseRemaining = Math.min(updatedSession.phaseTimeRemaining, maxPhaseTime);
              const exerciseRemaining = isWork ? (phaseRemaining + (currentEx.restDurationSeconds || 60)) : phaseRemaining;

              updatedSession = {
                ...updatedSession,
                phaseTimeRemaining: phaseRemaining,
                exerciseTimeRemaining: exerciseRemaining,
                lastUpdatedTimestamp: Date.now()
              };
            }
          }

          return {
            workouts: updatedWorkouts,
            activeSession: updatedSession
          };
        });
      },

      deleteExerciseFromWorkout: (workoutId, exerciseId) => {
        set(state => ({
          workouts: state.workouts.map(w => {
            if (w.id === workoutId) {
              return {
                ...w,
                exercises: w.exercises.filter(e => e.id !== exerciseId),
                updatedAt: new Date().toISOString()
              };
            }
            return w;
          })
        }));
      },

      reorderExercisesInWorkout: (workoutId, startIndex, endIndex) => {
        set(state => ({
          workouts: state.workouts.map(w => {
            if (w.id === workoutId) {
              const list = [...w.exercises];
              const [removed] = list.splice(startIndex, 1);
              list.splice(endIndex, 0, removed);
              return {
                ...w,
                exercises: list,
                updatedAt: new Date().toISOString()
              };
            }
            return w;
          })
        }));
      }
    }),
    {
      name: 'taf-pmce-workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workouts: state.workouts,
        activeWorkoutId: state.activeWorkoutId,
        history: state.history,
        settings: state.settings,
        activeSession: state.activeSession
      })
    }
  )
);
