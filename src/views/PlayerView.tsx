import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
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
  FastForward
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { formatSecondsToMMSS, getExerciseStartTime, getTotalWorkoutDuration } from '../utils/formatters';
import { ProgressRing } from '../components/ProgressRing';
import { wakeLockManager } from '../utils/wakeLock';

export const PlayerView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const activeSession = useWorkoutStore(state => state.activeSession);
  const settings = useWorkoutStore(state => state.settings);

  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const pauseWorkout = useWorkoutStore(state => state.pauseWorkout);
  const resumeWorkout = useWorkoutStore(state => state.resumeWorkout);
  const nextExercise = useWorkoutStore(state => state.nextExercise);
  const prevExercise = useWorkoutStore(state => state.prevExercise);
  const finishWorkout = useWorkoutStore(state => state.finishWorkout);
  const tickSession = useWorkoutStore(state => state.tickSession);
  const updateSettings = useWorkoutStore(state => state.updateSettings);

  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // If no session is active, start one automatically for current workout
  useEffect(() => {
    if (!activeSession) {
      startWorkout(workout.id);
    }
  }, [activeSession, startWorkout, workout.id]);

  // Request screen wake lock on mount
  useEffect(() => {
    wakeLockManager.request().then(active => setWakeLockActive(active));
    return () => {
      wakeLockManager.release();
    };
  }, []);

  // Main 1-second interval timer tick
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, tickSession]);

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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Timer className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold">Preparando o seu treino...</h2>
          <button
            onClick={() => startWorkout(workout.id)}
            className="px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm"
          >
            Iniciar Agora
          </button>
        </div>
      </div>
    );
  }

  const currentExerciseIndex = activeSession.currentExerciseIndex;
  const currentExercise = workout.exercises[currentExerciseIndex];
  const nextExerciseItem = workout.exercises[currentExerciseIndex + 1];
  const totalDuration = getTotalWorkoutDuration(workout.exercises);

  const isWorkPhase = activeSession.currentPhase === 'work';
  const currentPhaseMaxDuration = currentExercise
    ? (isWorkPhase ? (currentExercise.workDurationSeconds || 60) : (currentExercise.restDurationSeconds || 60))
    : 60;

  // Phase Progress Calculations
  const phaseProgress = Math.max(0, Math.min(100, ((currentPhaseMaxDuration - activeSession.phaseTimeRemaining) / currentPhaseMaxDuration) * 100));

  const totalProgress = Math.max(0, Math.min(100, (activeSession.totalTimeElapsed / totalDuration) * 100));

  const handleFinishEarly = () => {
    finishWorkout('cancelled');
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col justify-between p-4 md:p-6 select-none touch-manipulation">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 max-w-xl mx-auto w-full pt-1">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Encerrar</span>
        </button>

        {/* Screen & Sound Status Indicators */}
        <div className="flex items-center gap-2">
          {wakeLockActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
              <Sun className="w-3 h-3" />
              <span className="hidden xs:inline">Tela Acesa</span>
            </span>
          )}

          <button
            onClick={() => updateSettings({ autoAdvanceBlocks: !settings.autoAdvanceBlocks })}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              settings.autoAdvanceBlocks
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
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              settings.soundBeepEnabled
                ? 'bg-zinc-900 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800'
            }`}
            title="Bipes Sonoros"
          >
            {settings.soundBeepEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => updateSettings({ ttsVoiceEnabled: !settings.ttsVoiceEnabled })}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              settings.ttsVoiceEnabled
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
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center items-center py-3 space-y-5">

        {/* Preparation Banner */}
        {activeSession.isPreparing ? (
          <div className="w-full text-center space-y-6 animate-pulse-subtle">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>PREPARE-SE!</span>
            </div>

            <div className="text-8xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              {activeSession.prepTimeRemaining}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">PRÓXIMO EXERCÍCIO</p>
              <h2 className="text-2xl font-black text-white font-['Outfit']">{currentExercise?.name}</h2>
              {currentExercise?.focusNotes && (
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">{currentExercise.focusNotes}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Exercise Header Badges */}
            <div className="w-full text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 font-mono font-bold text-xs">
                  BLOCO {currentExerciseIndex + 1} DE {workout.exercises.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono font-bold text-xs">
                  INÍCIO {getExerciseStartTime(workout.exercises, currentExerciseIndex)}
                </span>
              </div>

              {/* Dynamic Phase Indicator Badge (EXECUÇÃO vs DESCANSO) */}
              <div className="flex items-center justify-center my-1">
                {isWorkPhase ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/50 text-amber-400 font-black text-sm uppercase tracking-wider animate-pulse-subtle">
                    <Flame className="w-4 h-4 fill-current text-amber-400" />
                    <span>Fase: EXECUÇÃO</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/50 text-cyan-400 font-black text-sm uppercase tracking-wider animate-pulse-subtle">
                    <Coffee className="w-4 h-4 text-cyan-400" />
                    <span>Fase: DESCANSO</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tight font-['Outfit'] leading-tight px-2">
                {currentExercise?.name}
              </h1>

              {currentExercise?.focusNotes && (
                <p className="text-xs sm:text-sm text-amber-400/90 font-medium max-w-md mx-auto px-4 bg-amber-500/5 py-1.5 rounded-xl border border-amber-500/10">
                  ⚡ {currentExercise.focusNotes}
                </p>
              )}
            </div>

            {/* Giant Timer Circle */}
            <div className="my-1">
              <ProgressRing
                radius={135}
                stroke={12}
                progress={phaseProgress}
                colorClass={
                  activeSession.isPaused
                    ? 'stroke-zinc-600'
                    : (isWorkPhase ? 'stroke-amber-400' : 'stroke-cyan-400')
                }
              >
                <div className="flex flex-col items-center">
                  <span className={`text-5xl xs:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md ${!isWorkPhase ? 'text-cyan-300' : ''}`}>
                    {formatSecondsToMMSS(activeSession.phaseTimeRemaining)}
                  </span>
                  <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mt-1">
                    {activeSession.isPaused ? 'PAUSADO' : (isWorkPhase ? 'TEMPO DE EXECUÇÃO' : 'TEMPO DE DESCANSO')}
                  </span>
                </div>
              </ProgressRing>
            </div>

            {/* Next Step / Exercise Preview Box */}
            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isWorkPhase ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {isWorkPhase ? <Coffee className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                </div>
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    {isWorkPhase ? 'A SEGUIR' : 'PRÓXIMO EXERCÍCIO'}
                  </p>
                  <p className="text-sm font-bold text-zinc-200 truncate">
                    {isWorkPhase
                      ? `Descanso (${formatSecondsToMMSS(currentExercise?.restDurationSeconds || 60)})`
                      : (nextExerciseItem ? nextExerciseItem.name : 'Fim do treino! 🎉')
                    }
                  </p>
                </div>
              </div>

              {nextExerciseItem && !isWorkPhase && (
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 shrink-0">
                  <span>{getExerciseStartTime(workout.exercises, currentExerciseIndex + 1)}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Overall Workout Progress Bar */}
        <div className="w-full space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-medium text-zinc-400 font-mono">
            <span>Progresso Total: {Math.round(totalProgress)}%</span>
            <span>{formatSecondsToMMSS(activeSession.totalTimeElapsed)} / {formatSecondsToMMSS(totalDuration)}</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Touch Controls Bar (Optimized for Mobile Hands) */}
      <div className="max-w-xl mx-auto w-full pt-1 pb-2">
        <div className="grid grid-cols-3 gap-3 items-center">
          {/* Previous Exercise Button */}
          <button
            onClick={prevExercise}
            disabled={currentExerciseIndex === 0 && activeSession.currentPhase === 'work'}
            className="w-full h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 font-bold flex flex-col items-center justify-center gap-1 transition-all"
          >
            <SkipBack className="w-5 h-5 fill-current" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Voltar</span>
          </button>

          {/* Pause / Play Primary Giant Button */}
          {activeSession.isPaused ? (
            <button
              onClick={resumeWorkout}
              className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black shadow-xl shadow-amber-500/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Play className="w-7 h-7 fill-current" />
              <span className="text-[10px] uppercase font-black tracking-wider">Continuar</span>
            </button>
          ) : (
            <button
              onClick={pauseWorkout}
              className="w-full h-16 rounded-2xl bg-zinc-800 border border-amber-500/50 hover:bg-zinc-700 active:scale-95 text-amber-400 font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Pause className="w-7 h-7 fill-current" />
              <span className="text-[10px] uppercase font-black tracking-wider">Pausar</span>
            </button>
          )}

          {/* Next Exercise Button */}
          <button
            onClick={nextExercise}
            className="w-full h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 font-bold flex flex-col items-center justify-center gap-1 transition-all"
          >
            <SkipForward className="w-5 h-5 fill-current" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Pular</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Exit */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Deseja parar o treino?</h3>
              <p className="text-xs text-zinc-400">
                Seu progresso até o momento será salvo no histórico de treinos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Voltar ao Treino
              </button>
              <button
                onClick={handleFinishEarly}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 active:scale-95 shadow-lg shadow-rose-600/30"
              >
                Encerrar Treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
