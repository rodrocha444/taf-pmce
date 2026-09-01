import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import type {
  Workout,
  ActiveSession,
  WorkoutSessionLog,
  UserSettings,
  Exercise,
  ExerciseExecutionType,
  ExerciseEvolutionLog,
} from '../types';
import { audioEngine } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { wakeLockManager } from '../utils/wake-lock';

export { DEFAULT_RUNNING_WORKOUTS } from './running-defaults';

export const formatExerciseVoiceLabel = (ex?: Exercise): { label: string; repsInfo: string } => {
  if (!ex) return { label: '', repsInfo: '' };
  const setInfo = ex.setNumber && ex.totalSets ? `, Série ${ex.setNumber} de ${ex.totalSets}` : '';
  const isReps = ex.executionType === 'reps' || (ex.targetReps !== undefined && ex.targetReps > 0);
  const repsInfo = isReps && ex.targetReps ? `. Meta: ${ex.targetReps} repetições` : '';
  return {
    label: `${ex.name}${setInfo}`,
    repsInfo
  };
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface WorkoutStore {
  // Ephemeral session state
  activeWorkoutId: string;
  activeSession: ActiveSession | null;

  // Persisted settings (localStorage)
  settings: UserSettings;

  // UI flags
  showCreateWorkoutModal: boolean;
  setShowCreateWorkoutModal: (open: boolean) => void;
  showCreateExerciseModal: boolean;
  setShowCreateExerciseModal: (open: boolean) => void;
  showManualHistoryModal: boolean;
  setShowManualHistoryModal: (open: boolean) => void;

  // Workout actions (mutate via TanStack Query hooks, not here)
  setActiveWorkoutId: (id: string) => void;

  // Session actions
  startWorkout: (workout: Workout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  tickSession: (workout: Workout) => void;
  completeExercise: (workout: Workout) => void;
  skipExercise: (workout: Workout) => void;
  nextExercise: (workout: Workout) => void;
  prevExercise: (workout: Workout) => void;

  /**
   * finishWorkout: encerra a sessão e retorna o log para persistência externa.
   * O chamador é responsável por salvar via useAddHistoryLog().
   */
  finishWorkout: (workout: Workout, status?: 'completed' | 'cancelled') => WorkoutSessionLog | null;

  /**
   * pendingLog: log gerado quando treino termina automaticamente via timer.
   * O PlayerView observa isso e persiste via useAddHistoryLog, depois limpa com clearPendingLog().
   */
  pendingLog: WorkoutSessionLog | null;
  clearPendingLog: () => void;

  updateActiveExercise: (exerciseId: string, updates: { executionType?: ExerciseExecutionType; targetReps?: number; workDurationSeconds?: number; restDurationSeconds?: number }, workout: Workout) => void;

  // Settings
  updateSettings: (settings: Partial<UserSettings>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeWorkoutId: '',
      activeSession: null,
      pendingLog: null,
      settings: {
        soundBeepEnabled: true,
        ttsVoiceEnabled: true,
        prepCountdownSeconds: 5,
        keepScreenOn: true,
        autoAdvanceBlocks: true,
        autoCloudSyncEnabled: false,
        volume: 1
      },
      showCreateWorkoutModal: false,
      setShowCreateWorkoutModal: (open) => set({ showCreateWorkoutModal: open }),
      showCreateExerciseModal: false,
      setShowCreateExerciseModal: (open) => set({ showCreateExerciseModal: open }),
      showManualHistoryModal: false,
      setShowManualHistoryModal: (open) => set({ showManualHistoryModal: open }),

      setActiveWorkoutId: (id: string) => set({ activeWorkoutId: id }),

      // ─── Session ────────────────────────────────────────────────────────

      startWorkout: (workout: Workout) => {
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

        speechEngine.unlock();

        if (isPreparing) {
          if (settings.ttsVoiceEnabled) {
            const { label, repsInfo } = formatExerciseVoiceLabel(firstExercise);
            speechEngine.speak(`Treino iniciando em ${settings.prepCountdownSeconds} segundos. Prepare-se para ${label}${repsInfo}`, true, settings.volume);
          }
        } else {
          if (settings.soundBeepEnabled) audioEngine.playGoBeep();
          if (settings.ttsVoiceEnabled) {
            const { label, repsInfo } = formatExerciseVoiceLabel(firstExercise);
            speechEngine.speak(`Valendo! Execução: ${label}${repsInfo}`, true, settings.volume);
          }
        }
      },

      pauseWorkout: () => {
        const session = get().activeSession;
        if (!session) return;
        set({ activeSession: { ...session, isPaused: true } });
        const { settings } = get();
        speechEngine.speak('Treino pausado', settings.ttsVoiceEnabled, settings.volume);
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
        const { settings } = get();
        speechEngine.speak('Treino retomado', settings.ttsVoiceEnabled, settings.volume);
      },

      tickSession: (workout: Workout) => {
        const session = get().activeSession;
        if (!session || session.isPaused) return;

        const { settings } = get();

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
            const currentEx = workout.exercises[session.currentExerciseIndex] || workout.exercises[0];
            if (settings.soundBeepEnabled) audioEngine.playGoBeep();
            const { label, repsInfo } = formatExerciseVoiceLabel(currentEx);
            speechEngine.speak(`Valendo! Execução: ${label}${repsInfo}`, settings.ttsVoiceEnabled, settings.volume);

            set({
              activeSession: {
                ...session,
                isPreparing: false,
                prepTimeRemaining: 0,
                currentPhase: 'work',
                phaseTimeRemaining: currentEx.workDurationSeconds || 60,
                exerciseTimeRemaining: currentEx.durationSeconds,
                lastUpdatedTimestamp: Date.now()
              }
            });
          }
          return;
        }

        const currentExercise = workout.exercises[session.currentExerciseIndex];
        if (!currentExercise) {
          get().finishWorkout(workout, 'completed');
          return;
        }

        const isRepsExercise = currentExercise.executionType === 'reps' || (currentExercise.targetReps !== undefined && currentExercise.targetReps > 0);

        // Reps exercises do NOT have an execution countdown timer
        if (session.currentPhase === 'work' && isRepsExercise) {
          set({
            activeSession: {
              ...session,
              totalTimeElapsed: session.totalTimeElapsed + 1,
              lastUpdatedTimestamp: Date.now()
            }
          });
          return;
        }

        const nextPhaseTime = session.phaseTimeRemaining - 1;
        const nextExerciseTime = session.exerciseTimeRemaining - 1;
        const nextTotalElapsed = session.totalTimeElapsed + 1;

        if (settings.soundBeepEnabled && nextPhaseTime <= 3 && nextPhaseTime > 0) {
          audioEngine.playCountdownTick();
        }

        if (session.currentPhase === 'rest' && settings.ttsVoiceEnabled && nextPhaseTime === 10) {
          const nextExIndex = session.currentExerciseIndex + 1;
          if (nextExIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextExIndex];
            const { label, repsInfo } = formatExerciseVoiceLabel(nextEx);
            speechEngine.speak(`Em dez segundos, próxima execução: ${label}${repsInfo}`, settings.ttsVoiceEnabled, settings.volume);
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
          if (session.currentPhase === 'work') {
            const newStatuses = {
              ...session.exerciseStatuses,
              [session.currentExerciseIndex]: session.exerciseStatuses[session.currentExerciseIndex] || ('completed' as const)
            };

            if (settings.soundBeepEnabled) audioEngine.playGoBeep();
            const restTime = currentExercise.restDurationSeconds || 60;
            const nextExItem = workout.exercises[session.currentExerciseIndex + 1];

            if (settings.ttsVoiceEnabled) {
              if (nextExItem) {
                const { label: nextLabel } = formatExerciseVoiceLabel(nextExItem);
                speechEngine.speak(`Execução concluída! Respire. Próximo exercício: ${nextLabel}`, true, settings.volume);
              } else {
                speechEngine.speak(`Descanso final! Treino quase concluído!`, true, settings.volume);
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
            const nextIndex = session.currentExerciseIndex + 1;

            if (nextIndex < workout.exercises.length) {
              const nextEx = workout.exercises[nextIndex];
              const shouldPause = !settings.autoAdvanceBlocks;
              const prepSeconds = settings.prepCountdownSeconds || 5;

              if (settings.soundBeepEnabled) audioEngine.playGoBeep();

              if (shouldPause) {
                if (settings.ttsVoiceEnabled) {
                  const { label: nextLabel } = formatExerciseVoiceLabel(nextEx);
                  speechEngine.speak(`Bloco concluído! Pausado. Toque em Continuar quando estiver pronto para: ${nextLabel}`, true, settings.volume);
                }
              } else {
                if (settings.ttsVoiceEnabled) {
                  const { label: nextLabel, repsInfo } = formatExerciseVoiceLabel(nextEx);
                  speechEngine.speak(`Prepare-se para: ${nextLabel}${repsInfo}`, true, settings.volume);
                }
              }

              set({
                activeSession: {
                  ...session,
                  currentExerciseIndex: nextIndex,
                  currentPhase: 'work',
                  isPreparing: true,
                  prepTimeRemaining: prepSeconds,
                  phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                  exerciseTimeRemaining: nextEx.durationSeconds,
                  totalTimeElapsed: nextTotalElapsed,
                  isPaused: shouldPause,
                  lastUpdatedTimestamp: Date.now()
                }
              });
            } else {
              get().finishWorkout(workout, 'completed');
            }
          }
        }
      },

      completeExercise: (workout: Workout) => {
        const session = get().activeSession;
        if (!session) return;
        const settings = get().settings;
        const shouldPause = !settings.autoAdvanceBlocks;

        const currentExIndex = session.currentExerciseIndex;
        const newStatuses = {
          ...session.exerciseStatuses,
          [currentExIndex]: session.exerciseStatuses[currentExIndex] || ('completed' as const)
        };

        if (session.currentPhase === 'work') {
          const currentEx = workout.exercises[currentExIndex];
          if (settings.ttsVoiceEnabled) speechEngine.speak('Execução concluída! Descanso.', true, settings.volume);

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
          const nextIndex = currentExIndex + 1;
          if (nextIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextIndex];
            const prepSeconds = settings.prepCountdownSeconds || 5;
            if (settings.ttsVoiceEnabled) {
              const { label: nextLabel, repsInfo } = formatExerciseVoiceLabel(nextEx);
              speechEngine.speak(`Descanso encerrado. Prepare-se para: ${nextLabel}${repsInfo}`, true, settings.volume);
            }

            set({
              activeSession: {
                ...session,
                exerciseStatuses: newStatuses,
                currentExerciseIndex: nextIndex,
                currentPhase: 'work',
                isPreparing: true,
                prepTimeRemaining: prepSeconds,
                phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                exerciseTimeRemaining: nextEx.durationSeconds,
                isPaused: shouldPause
              }
            });
          } else {
            set({ activeSession: { ...session, exerciseStatuses: newStatuses } });
            get().finishWorkout(workout, 'completed');
          }
        }
      },

      skipExercise: (workout: Workout) => {
        const session = get().activeSession;
        if (!session) return;
        const settings = get().settings;
        const shouldPause = !settings.autoAdvanceBlocks;

        const currentExIndex = session.currentExerciseIndex;

        if (session.currentPhase === 'work') {
          const currentEx = workout.exercises[currentExIndex];
          const newStatuses = { ...session.exerciseStatuses, [currentExIndex]: 'skipped' as const };

          if (settings.ttsVoiceEnabled) speechEngine.speak('Execução pulada.', true, settings.volume);

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
          const currentStatus = session.exerciseStatuses[currentExIndex] || 'completed';
          const newStatuses = { ...session.exerciseStatuses, [currentExIndex]: currentStatus };

          const nextIndex = currentExIndex + 1;
          if (nextIndex < workout.exercises.length) {
            const nextEx = workout.exercises[nextIndex];
            const prepSeconds = settings.prepCountdownSeconds || 5;
            if (settings.ttsVoiceEnabled) {
              const { label: nextLabel, repsInfo } = formatExerciseVoiceLabel(nextEx);
              speechEngine.speak(`Descanso pulado. Prepare-se para: ${nextLabel}${repsInfo}`, true, settings.volume);
            }

            set({
              activeSession: {
                ...session,
                exerciseStatuses: newStatuses,
                currentExerciseIndex: nextIndex,
                currentPhase: 'work',
                isPreparing: true,
                prepTimeRemaining: prepSeconds,
                phaseTimeRemaining: nextEx.workDurationSeconds || 60,
                exerciseTimeRemaining: nextEx.durationSeconds,
                isPaused: shouldPause
              }
            });
          } else {
            set({ activeSession: { ...session, exerciseStatuses: newStatuses } });
            get().finishWorkout(workout, 'completed');
          }
        }
      },

      nextExercise: (workout: Workout) => {
        const session = get().activeSession;
        if (session?.currentPhase === 'work') {
          get().skipExercise(workout);
        } else {
          get().completeExercise(workout);
        }
      },

      prevExercise: (workout: Workout) => {
        const session = get().activeSession;
        if (!session) return;

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

      /**
       * finishWorkout: encerra sessão e retorna o WorkoutSessionLog.
       * O componente chamador deve persistir via useAddHistoryLog().
       */
      finishWorkout: (workout: Workout, status = 'completed') => {
        const session = get().activeSession;
        const { settings } = get();

        wakeLockManager.release();

        let log: WorkoutSessionLog | null = null;

        if (session) {
          const statuses = session.exerciseStatuses || {};
          const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
          const skippedCount = Object.values(statuses).filter(s => s === 'skipped').length;

          if (status === 'completed') {
            if (settings.soundBeepEnabled) audioEngine.playCompletionFanfare();
            if (settings.ttsVoiceEnabled) speechEngine.speak('Parabéns! Treino TAF concluído com sucesso!', true, settings.volume);
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            } catch (e) {
              console.warn('Confetti failed:', e);
            }
          } else {
            if (settings.ttsVoiceEnabled) speechEngine.speak('Treino encerrado.', true, settings.volume);
          }

          const realElapsed = session.startTimestamp
            ? Math.max(0, Math.floor((Date.now() - session.startTimestamp) / 1000))
            : session.totalTimeElapsed;

          const exerciseLogs: ExerciseEvolutionLog[] = workout.exercises.map((ex, idx) => {
            const exStatus = statuses[idx] || (idx < session.currentExerciseIndex ? 'completed' : 'skipped');
            const isCompleted = exStatus === 'completed';
            const isReps = ex.executionType === 'reps' || (ex.targetReps !== undefined && ex.targetReps > 0);

            return {
              id: `ex-log-${Date.now()}-${idx}`,
              workoutId: workout.id,
              exerciseId: ex.id,
              exerciseName: ex.name,
              executionType: isReps ? 'reps' : 'time',
              targetReps: ex.targetReps,
              completedReps: isCompleted && isReps ? (ex.targetReps || 10) : 0,
              workDurationSeconds: ex.workDurationSeconds || 60,
              realWorkSeconds: isCompleted ? (ex.workDurationSeconds || 60) : 0,
              status: exStatus,
              timestamp: new Date().toISOString(),
              setNumber: ex.setNumber,
              totalSets: ex.totalSets
            };
          });

          log = {
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
            exerciseStatuses: statuses,
            exerciseLogs
          };
        }

        // Salva pendingLog para que o PlayerView possa observar e persistir via TanStack Query
        set({ activeSession: null, pendingLog: log });
        return log;
      },

      clearPendingLog: () => set({ pendingLog: null }),

      updateSettings: (newSettings) => {
        set(state => ({ settings: { ...state.settings, ...newSettings } }));
      },

      updateActiveExercise: (exerciseId: string, updates: { executionType?: ExerciseExecutionType; targetReps?: number; workDurationSeconds?: number; restDurationSeconds?: number }, currentWorkout: Workout) => {
        set(state => {
          let updatedSession = state.activeSession;
          if (!updatedSession || !currentWorkout) return state;

          const updatedExercises = currentWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            const workSecs = updates.workDurationSeconds !== undefined ? Math.max(5, updates.workDurationSeconds) : (ex.workDurationSeconds || 60);
            const restSecs = updates.restDurationSeconds !== undefined ? Math.max(0, updates.restDurationSeconds) : (ex.restDurationSeconds || 60);
            return {
              ...ex,
              executionType: updates.executionType !== undefined ? updates.executionType : ex.executionType,
              targetReps: updates.targetReps !== undefined ? updates.targetReps : ex.targetReps,
              workDurationSeconds: workSecs,
              restDurationSeconds: restSecs,
              durationSeconds: workSecs + restSecs
            };
          });

          if (updatedSession && updatedSession.workoutId === currentWorkout.id) {
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

          return { activeSession: updatedSession };
        });
      },
    }),
    {
      name: 'taf-pmce-session',
      storage: createJSONStorage(() => localStorage),
      // Só persiste settings e activeWorkoutId — não dados de treino
      partialize: (state) => ({
        settings: state.settings,
        activeWorkoutId: state.activeWorkoutId,
        activeSession: state.activeSession,
      })
    }
  )
);
