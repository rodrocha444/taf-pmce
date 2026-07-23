import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sun,
  XCircle,
  AlertCircle,
  Timer,
  ChevronRight,
  Sparkles,
  Coffee,
  Flame,
  FastForward,
  CheckCircle2,
  Clock,
  Edit2,
  Target
} from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatSecondsToMMSS, getExerciseStartTime, getTotalWorkoutDuration } from '../utils/formatters';
import { ProgressRing } from '../components/progress-ring';
import { wakeLockManager } from '../utils/wake-lock';

type ConfirmModalType = 'complete' | 'skip' | 'exit' | null;

export const PlayerView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const activeSession = useWorkoutStore(state => state.activeSession);
  const settings = useWorkoutStore(state => state.settings);

  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const pauseWorkout = useWorkoutStore(state => state.pauseWorkout);
  const resumeWorkout = useWorkoutStore(state => state.resumeWorkout);
  const completeExercise = useWorkoutStore(state => state.completeExercise);
  const skipExercise = useWorkoutStore(state => state.skipExercise);
  const finishWorkout = useWorkoutStore(state => state.finishWorkout);
  const tickSession = useWorkoutStore(state => state.tickSession);
  const updateSettings = useWorkoutStore(state => state.updateSettings);
  const updateActiveExercise = useWorkoutStore(state => state.updateActiveExercise);

  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalType>(null);
  const [modalCountdown, setModalCountdown] = useState<number>(5);
  const [wasRunningBeforeModal, setWasRunningBeforeModal] = useState<boolean>(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Edit active exercise state in player
  const [isEditingExercise, setIsEditingExercise] = useState<boolean>(false);
  const [editExecutionType, setEditExecutionType] = useState<'reps' | 'time'>('reps');
  const [editTargetReps, setEditTargetReps] = useState<number | ''>(10);
  const [editWorkMinutes, setEditWorkMinutes] = useState<number>(1);
  const [editWorkSeconds, setEditWorkSeconds] = useState<number>(0);
  const [editRestMinutes, setEditRestMinutes] = useState<number>(1);
  const [editRestSeconds, setEditRestSeconds] = useState<number>(0);

  // Continuous 1-second wall-clock timer tick (NEVER PAUSES, persists even if app closes)
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request & maintain screen wake lock during workout execution
  useEffect(() => {
    wakeLockManager.setEnabled(settings.keepScreenOn);

    if (!settings.keepScreenOn) {
      wakeLockManager.release();
      setWakeLockActive(false);
      return;
    }

    const acquireLock = async () => {
      const active = await wakeLockManager.request();
      setWakeLockActive(active);
    };

    acquireLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && settings.keepScreenOn) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockManager.release();
    };
  }, [settings.keepScreenOn]);

  // Main 1-second interval timer tick
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, tickSession]);

  // Handle 5-second countdown lock for confirmation modal buttons
  useEffect(() => {
    if (!confirmModal) return;

    setModalCountdown(5);
    const interval = setInterval(() => {
      setModalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmModal]);

  // Trigger vibration feedback on phase/exercise change on mobile
  useEffect(() => {
    if (activeSession && !activeSession.isPreparing && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    }
  }, [activeSession?.currentExerciseIndex, activeSession?.currentPhase, activeSession?.isPreparing]);

  if (!activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Timer className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Nenhum treino em andamento</h2>
            <p className="text-xs text-zinc-400">Toque abaixo para iniciar a série oficial do TAF PMCE</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => startWorkout(workout.id)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              Iniciar Treino
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentExerciseIndex = activeSession.currentExerciseIndex;
  const currentExercise = workout.exercises[currentExerciseIndex];
  const nextExerciseItem = workout.exercises[currentExerciseIndex + 1];
  const totalDuration = getTotalWorkoutDuration(workout.exercises);

  const isWorkPhase = activeSession.currentPhase === 'work';
  const isRepsMode = currentExercise?.executionType === 'reps' || (currentExercise?.targetReps !== undefined && currentExercise.targetReps > 0);
  const currentPhaseMaxDuration = currentExercise
    ? (isWorkPhase ? (currentExercise.workDurationSeconds || 60) : (currentExercise.restDurationSeconds || 60))
    : 60;

  // Phase Progress Calculations
  const phaseProgress = Math.max(0, Math.min(100, ((currentPhaseMaxDuration - activeSession.phaseTimeRemaining) / currentPhaseMaxDuration) * 100));

  // Exercise completed count from statuses
  const statuses = activeSession.exerciseStatuses || {};
  const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
  const skippedCount = Object.values(statuses).filter(s => s === 'skipped').length;

  let completedSeconds = 0;
  let skippedSeconds = 0;

  workout.exercises.forEach((ex, idx) => {
    const status = statuses[idx];
    if (status === 'completed') {
      completedSeconds += ex.durationSeconds;
    } else if (status === 'skipped') {
      skippedSeconds += ex.durationSeconds;
    } else if (idx === currentExerciseIndex) {
      const elapsed = Math.max(0, ex.durationSeconds - activeSession.exerciseTimeRemaining);
      completedSeconds += elapsed;
    }
  });

  const realElapsedSeconds = activeSession.startTimestamp
    ? Math.max(0, Math.floor((nowTimestamp - activeSession.startTimestamp) / 1000))
    : activeSession.totalTimeElapsed;

  const openModal = (type: ConfirmModalType) => {
    if (activeSession && !activeSession.isPaused) {
      setWasRunningBeforeModal(true);
      pauseWorkout();
    } else {
      setWasRunningBeforeModal(false);
    }
    setConfirmModal(type);
  };

  const closeModal = () => {
    setConfirmModal(null);
    if (wasRunningBeforeModal && activeSession?.isPaused) {
      resumeWorkout();
    }
  };

  const openEditActiveExerciseModal = () => {
    if (!currentExercise) return;
    if (activeSession && !activeSession.isPaused) {
      setWasRunningBeforeModal(true);
      pauseWorkout();
    } else {
      setWasRunningBeforeModal(false);
    }
    const isReps = currentExercise.executionType === 'reps' || (currentExercise.targetReps !== undefined && currentExercise.targetReps > 0);
    setEditExecutionType(isReps ? 'reps' : 'time');
    setEditTargetReps(currentExercise.targetReps ?? 10);
    const workTotal = currentExercise.workDurationSeconds || 60;
    setEditWorkMinutes(Math.floor(workTotal / 60));
    setEditWorkSeconds(workTotal % 60);

    const restTotal = currentExercise.restDurationSeconds || 60;
    setEditRestMinutes(Math.floor(restTotal / 60));
    setEditRestSeconds(restTotal % 60);

    setIsEditingExercise(true);
  };

  const closeEditActiveExerciseModal = () => {
    setIsEditingExercise(false);
    if (wasRunningBeforeModal && activeSession?.isPaused) {
      resumeWorkout();
    }
  };

  const handleSaveActiveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExercise) return;

    const totalWorkSecs = Math.max(5, editWorkMinutes * 60 + editWorkSeconds);
    const totalRestSecs = Math.max(0, editRestMinutes * 60 + editRestSeconds);
    const isReps = editExecutionType === 'reps';
    const repsVal = isReps && typeof editTargetReps === 'number' ? Math.max(1, editTargetReps) : undefined;

    updateActiveExercise(currentExercise.id, {
      executionType: editExecutionType,
      targetReps: repsVal,
      workDurationSeconds: totalWorkSecs,
      restDurationSeconds: totalRestSecs
    });

    setIsEditingExercise(false);
    if (wasRunningBeforeModal) {
      resumeWorkout();
    }
  };

  const handleConfirmComplete = () => {
    setConfirmModal(null);
    completeExercise();
  };

  const handleConfirmSkip = () => {
    setConfirmModal(null);
    skipExercise();
  };

  const handleConfirmExit = () => {
    setConfirmModal(null);
    finishWorkout('cancelled');
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col justify-between player-safe-container select-none touch-manipulation">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 max-w-xl mx-auto w-full pt-1 px-1">
        <button
          onClick={() => openModal('exit')}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Encerrar</span>
        </button>

        {/* Screen & Sound Status Indicators */}
        <div className="flex items-center gap-1.5">
          {wakeLockActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
              <Sun className="w-3 h-3" />
              <span className="hidden xs:inline">Tela Acesa</span>
            </span>
          )}

          <button
            onClick={() => updateSettings({ autoAdvanceBlocks: !settings.autoAdvanceBlocks })}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${settings.autoAdvanceBlocks
                ? 'bg-zinc-900 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800'
              }`}
            title={settings.autoAdvanceBlocks ? 'Avanço Automático Ativado' : 'Avanço Automático Desativado'}
          >
            <FastForward className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">{settings.autoAdvanceBlocks ? 'Auto' : 'Manual'}</span>
          </button>

          <button
            onClick={() => updateSettings({ soundBeepEnabled: !settings.soundBeepEnabled })}
            className={`p-1.5 rounded-xl border text-xs font-medium transition-all ${settings.soundBeepEnabled
                ? 'bg-zinc-900 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800'
              }`}
            title="Bipes Sonoros"
          >
            {settings.soundBeepEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => updateSettings({ ttsVoiceEnabled: !settings.ttsVoiceEnabled })}
            className={`p-1.5 rounded-xl border text-xs font-medium transition-all ${settings.ttsVoiceEnabled
                ? 'bg-zinc-900 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800'
              }`}
            title="Voz Guiada PT-BR"
          >
            {settings.ttsVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center items-center py-1 space-y-2">

        {/* Preparation Banner */}
        {activeSession.isPreparing ? (
          <div className="w-full text-center space-y-4 animate-pulse-subtle">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>PREPARE-SE!</span>
            </div>

            <div className="text-7xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              {activeSession.prepTimeRemaining}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">PRÓXIMO EXERCÍCIO</p>
              <h2 className="text-xl font-black text-white font-['Outfit']">{currentExercise?.name}</h2>
              {currentExercise?.targetReps !== undefined && currentExercise.targetReps > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs mt-0.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span>Meta: {currentExercise.targetReps} {currentExercise.targetReps === 1 ? 'repetição' : 'repetições'}</span>
                </div>
              )}
              {currentExercise?.focusNotes && (
                <p className="text-xs text-zinc-400 max-w-sm mx-auto pt-0.5">{currentExercise.focusNotes}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Exercise Header Badges */}
            <div className="w-full text-center space-y-1">
              {/* Dynamic Phase Indicator Badge */}
              <div className="flex items-center justify-center">
                {isWorkPhase ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-black text-[11px] uppercase tracking-wider">
                    <Flame className="w-3 h-3 fill-current text-amber-400" />
                    <span>EXECUÇÃO</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-black text-[11px] uppercase tracking-wider">
                    <Coffee className="w-3 h-3 text-cyan-400" />
                    <span>DESCANSO</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl xs:text-3xl font-black text-white tracking-tight font-['Outfit'] leading-tight px-2">
                {currentExercise?.name}
              </h1>

              {currentExercise?.focusNotes && (
                <p className="text-xs text-amber-400/90 font-medium max-w-md mx-auto px-3 bg-amber-500/5 py-0.5 rounded-lg border border-amber-500/10">
                  ⚡ {currentExercise.focusNotes}
                </p>
              )}

              {/* Edit Active Exercise Button */}
              <div className="flex items-center justify-center pt-0.5">
                <button
                  onClick={openEditActiveExerciseModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-bold hover:text-amber-400 hover:border-amber-500/30 active:scale-95 transition-all cursor-pointer"
                  title="Alterar repetições ou tempo deste exercício"
                >
                  <Edit2 className="w-3 h-3 text-amber-400" />
                  <span>Editar Exercício</span>
                </button>
              </div>
            </div>

            {/* Display Circle (ProgressRing / Reps Banner) */}
            <div className="my-0.5">
              <ProgressRing
                radius={115}
                stroke={10}
                progress={isWorkPhase && isRepsMode ? 100 : phaseProgress}
                colorClass={
                  activeSession.isPaused
                    ? 'stroke-zinc-600'
                    : (isWorkPhase
                        ? (isRepsMode ? 'stroke-purple-500' : 'stroke-amber-400')
                        : 'stroke-cyan-400')
                }
              >
                {isWorkPhase && isRepsMode ? (
                  /* Exibição para Exercícios Por Repetição */
                  <div className="flex flex-col items-center">
                    <span className="text-5xl xs:text-6xl font-black font-mono tracking-tight text-purple-300 drop-shadow-lg">
                      {currentExercise?.targetReps}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase mt-0.5">
                      {activeSession.isPaused ? 'PAUSADO' : 'REPETIÇÕES (META)'}
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-2 font-medium bg-zinc-900/90 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Toque em Concluir ✓ ao finalizar
                    </span>
                  </div>
                ) : (
                  /* Exibição para Exercícios Por Tempo e Fase de Descanso */
                  <div className="flex flex-col items-center">
                    <span className={`text-4xl xs:text-5xl font-black font-mono tracking-tight drop-shadow-md ${!isWorkPhase ? 'text-cyan-300' : 'text-amber-300'}`}>
                      {formatSecondsToMMSS(activeSession.phaseTimeRemaining)}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                      {activeSession.isPaused ? 'PAUSADO' : (isWorkPhase ? 'TEMPO DE EXECUÇÃO' : 'TEMPO DE DESCANSO')}
                    </span>
                  </div>
                )}
              </ProgressRing>
            </div>

            {/* Next Step / Exercise Preview Box */}
            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${isWorkPhase ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                  {isWorkPhase ? <Coffee className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                    {isWorkPhase ? 'A SEGUIR' : 'PRÓXIMO EXERCÍCIO'}
                  </p>
                  <p className="text-xs font-bold text-zinc-200 truncate">
                    {isWorkPhase
                      ? `Descanso (${formatSecondsToMMSS(currentExercise?.restDurationSeconds || 60)})`
                      : (nextExerciseItem
                          ? `${nextExerciseItem.name}${nextExerciseItem.targetReps !== undefined && nextExerciseItem.targetReps > 0 ? ` (${nextExerciseItem.targetReps} ${nextExerciseItem.targetReps === 1 ? 'rep' : 'reps'})` : ''}`
                          : 'Fim do treino! 🎉')
                    }
                  </p>
                </div>
              </div>

              {nextExerciseItem && !isWorkPhase && (
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 shrink-0">
                  <span>{getExerciseStartTime(workout.exercises, currentExerciseIndex + 1)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Multi-Colored Segmented Workout Progress Bar */}
        <div className="w-full space-y-1">
          <div className="flex flex-wrap justify-between items-center text-[11px] font-medium font-mono gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-amber-400 font-bold text-[10px]">
                Bloco {currentExerciseIndex + 1}/{workout.exercises.length}
              </span>
              {completedCount > 0 && (
                <span className="text-emerald-400 font-bold flex items-center gap-1" title="Exercícios concluídos">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ✓ {completedCount}
                </span>
              )}
              {skippedCount > 0 && (
                <span className="text-orange-400 font-bold flex items-center gap-1" title="Exercícios pulados">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  ⏭ {skippedCount}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-zinc-400 text-[10px] font-mono">
              <span title="Tempo total real percorrido no relógio (sem pausas)">
                Geral: <strong className="text-amber-400 font-bold">{formatSecondsToMMSS(realElapsedSeconds)}</strong>
              </span>
              <span>•</span>
              <span title="Tempo executado previsto / Tempo total previsto">
                Previsto: <strong className="text-zinc-200 font-bold">{formatSecondsToMMSS(completedSeconds + skippedSeconds)}</strong> / <strong className="text-zinc-200 font-bold">{formatSecondsToMMSS(totalDuration)}</strong>
              </span>
            </div>
          </div>

          {/* Segmented Timeline Bar */}
          <div className="h-3 w-full bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-800/80 flex gap-0.5 p-0.5">
            {workout.exercises.map((ex, idx) => {
              const status = activeSession.exerciseStatuses?.[idx];
              const isCurrent = currentExerciseIndex === idx;
              const segWidth = (ex.durationSeconds / totalDuration) * 100;

              if (status === 'completed') {
                return (
                  <div
                    key={ex.id}
                    className="h-full bg-emerald-500 rounded-sm transition-all duration-300"
                    style={{ width: `${segWidth}%` }}
                    title={`#${idx + 1} ${ex.name}: Concluído`}
                  />
                );
              }

              if (status === 'skipped') {
                return (
                  <div
                    key={ex.id}
                    className="h-full bg-orange-500 rounded-sm transition-all duration-300"
                    style={{ width: `${segWidth}%` }}
                    title={`#${idx + 1} ${ex.name}: Pulado`}
                  />
                );
              }

              if (isCurrent) {
                const elapsedInEx = ex.durationSeconds - activeSession.exerciseTimeRemaining;
                const currentPct = Math.max(0, Math.min(100, (elapsedInEx / ex.durationSeconds) * 100));

                return (
                  <div
                    key={ex.id}
                    className="h-full bg-zinc-800 rounded-sm relative overflow-hidden"
                    style={{ width: `${segWidth}%` }}
                    title={`#${idx + 1} ${ex.name}: Em Execução`}
                  >
                    <div
                      className={`h-full ${isWorkPhase ? 'bg-amber-400' : 'bg-cyan-400'} transition-all duration-300`}
                      style={{ width: `${currentPct}%` }}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={ex.id}
                  className="h-full bg-zinc-800/60 rounded-sm"
                  style={{ width: `${segWidth}%` }}
                  title={`#${idx + 1} ${ex.name}: Pendente`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Touch Controls Bar (3 Buttons for Work Phase, 2 Buttons for Rest Phase) */}
      <div className="max-w-xl mx-auto w-full pt-1 pb-1">
        <div className={`grid ${isWorkPhase ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 items-center`}>
          {/* Pause / Play Primary Giant Button */}
          {activeSession.isPaused ? (
            <button
              onClick={resumeWorkout}
              className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black shadow-xl shadow-amber-500/30 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="text-[10px] uppercase font-black tracking-wider">Continuar</span>
            </button>
          ) : (
            <button
              onClick={pauseWorkout}
              className="w-full h-14 rounded-2xl bg-zinc-800 border border-amber-500/50 hover:bg-zinc-700 active:scale-95 text-amber-400 font-black flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span className="text-[10px] uppercase font-black tracking-wider">Pausar</span>
            </button>
          )}

          {/* Pular Button (Differentiated for Exercise vs Rest) */}
          {isWorkPhase ? (
            <button
              onClick={() => openModal('skip')}
              className="w-full h-14 rounded-2xl bg-zinc-900 border border-orange-500/40 hover:bg-zinc-800 active:scale-95 text-orange-400 font-bold flex flex-col items-center justify-center gap-0.5 transition-all"
              title="Pular a execução deste exercício"
            >
              <SkipForward className="w-4 h-4 fill-current text-orange-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">Pular Exercício</span>
            </button>
          ) : (
            <button
              onClick={() => openModal('skip')}
              className="w-full h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 active:scale-95 text-cyan-400 font-bold flex flex-col items-center justify-center gap-0.5 transition-all"
              title="Pular o tempo de descanso"
            >
              <Coffee className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Pular Descanso</span>
            </button>
          )}

          {/* Concluir ✓ Button */}
          {isWorkPhase && (
            <button
              onClick={() => openModal('complete')}
              className="w-full h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 font-bold flex flex-col items-center justify-center gap-0.5 transition-all"
              title="Concluir exercício"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Concluir</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal: CONCLUIR */}
      {confirmModal === 'complete' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Marcar como Concluído?</h3>
              <p className="text-xs text-zinc-400">
                Confirmar a conclusão do exercício <strong className="text-white">"{currentExercise?.name}"</strong> e avançar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={closeModal}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmComplete}
                className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
              >
                Sim, Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: PULAR */}
      {confirmModal === 'skip' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/20">
              <SkipForward className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {isWorkPhase ? 'Confirmar Pular Exercício?' : 'Confirmar Pular Descanso?'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isWorkPhase
                  ? `Deseja pular a execução de "${currentExercise?.name}"?`
                  : `Deseja encerrar o descanso e ir direto para o próximo exercício?`
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={closeModal}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSkip}
                className="w-full py-3 rounded-xl bg-orange-500 text-zinc-950 font-bold text-xs hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
              >
                Sim, Pular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: ENCERRAR */}
      {confirmModal === 'exit' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Deseja parar o treino?</h3>
              <p className="text-xs text-zinc-400">
                Seu progresso até o momento ({completedCount} concluídos, {skippedCount} pulados) será salvo no histórico.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={closeModal}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Voltar ao Treino
              </button>
              <button
                onClick={handleConfirmExit}
                disabled={modalCountdown > 0}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 active:scale-95 shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                {modalCountdown > 0 ? `Confirmar (${modalCountdown}s)` : 'Encerrar Treino'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Active Exercise Modal */}
      {isEditingExercise && currentExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveActiveExercise}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Editar {currentExercise.name}</span>
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Seletor de Modo do Exercício */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">Modo do Exercício</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditExecutionType('reps')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editExecutionType === 'reps'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Por Repetição</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditExecutionType('time')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editExecutionType === 'time'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Por Tempo</span>
                  </button>
                </div>
              </div>

              {/* Input Condicional baseado no Modo Escolhido */}
              {editExecutionType === 'reps' ? (
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <label className="block text-purple-300 font-bold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quantidade de Repetições (Reps)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={editTargetReps}
                    onChange={e => setEditTargetReps(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-bold text-sm"
                  />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <label className="block text-amber-300 font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span>Tempo de Execução (Work)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={editWorkMinutes}
                        onChange={e => setEditWorkMinutes(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editWorkSeconds}
                        onChange={e => setEditWorkSeconds(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tempo de Descanso */}
              <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                <label className="block text-cyan-400 font-bold flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Tempo de Descanso (Rest)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Minutos</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={editRestMinutes}
                      onChange={e => setEditRestMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editRestSeconds}
                      onChange={e => setEditRestSeconds(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditActiveExerciseModal}
                className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20 font-bold"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
