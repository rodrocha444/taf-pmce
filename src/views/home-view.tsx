import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit3, RotateCcw, Clock, ShieldCheck, Flame, Info, CheckCircle2 } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { ExerciseCard } from '../components/exercise-card';
import { getExerciseStartTime, formatTimeHoursMins, getTotalWorkoutDuration } from '../utils/formatters';
import { ConfirmModal } from '../components/confirm-modal';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const activeSession = useWorkoutStore(state => state.activeSession);
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const resetDefaultWorkout = useWorkoutStore(state => state.resetDefaultWorkout);
  const history = useWorkoutStore(state => state.history);

  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const totalDuration = getTotalWorkoutDuration(workout.exercises);
  const completedCount = history.filter(h => h.status === 'completed').length;

  const handleStart = () => {
    if (!activeSession) {
      startWorkout(workout.id);
    }
    navigate('/player');
  };

  const handleConfirmReset = () => {
    resetDefaultWorkout();
    setShowResetModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Active Session Alert Banner (if timer is running) */}
      {activeSession && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-400">Treino em Andamento!</h4>
              <p className="text-xs text-zinc-300">Exercício #{activeSession.currentExerciseIndex + 1} em execução</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/player')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/30 hover:bg-amber-400 active:scale-95 transition-all"
          >
            Abrir Player
          </button>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Série Oficial Foco TAF PMCE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
              {workout.title}
            </h1>

            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              {workout.description}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Duração: <strong className="text-white">{formatTimeHoursMins(totalDuration)}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Exercícios: <strong className="text-white">{workout.exercises.length} Blocos</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Concluídos: <strong className="text-white">{completedCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Giant for Mobile Tapping) */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-lg shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>INICIAR TREINO</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/edit')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Editar Treino</span>
              </button>

              <button
                onClick={() => setShowResetModal(true)}
                className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-all border border-zinc-700 active:scale-95"
                title="Restaurar Padrão TAF"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Exercise List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit']">Cronograma da Série</h2>
            <p className="text-xs text-zinc-400">Linha do tempo com horários exatos de cada bloco</p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            15 Blocos (1 min Execução + 1 min Descanso)
          </span>
        </div>

        <div className="space-y-3">
          {workout.exercises.map((exercise, idx) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={idx}
              startTimeFormatted={getExerciseStartTime(workout.exercises, idx)}
              status={activeSession?.exerciseStatuses?.[idx]}
              isCurrent={activeSession?.currentExerciseIndex === idx}
            />
          ))}

          {/* Final Finish Marker Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                30:00
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">30:00 – Fim do treino!</h4>
                <p className="text-xs text-emerald-400 font-medium">Missão cumprida com sucesso</p>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Info Tip Footer */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong>Dica para Celular:</strong> Durante o treino, o aplicativo manterá a tela do seu dispositivo sempre acesa (Wake Lock) e emitirá bipes e orientações por voz antes de cada troca de exercício.
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Restaurar Série Padrão TAF PMCE?"
        description="Esta ação irá redefinir a lista de exercícios para os 15 blocos oficiais originais do TAF PMCE."
        confirmLabel="Sim, Restaurar Padrão"
        variant="amber"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
