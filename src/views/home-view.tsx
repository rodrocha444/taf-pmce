import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Edit3, Clock, ShieldCheck, Flame, CheckCircle2, ChevronRight, Dumbbell, Info } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { ExerciseCard } from '../components/exercise-card';
import { getExerciseStartTime, formatTimeHoursMins, getTotalWorkoutDuration } from '../utils/formatters';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const workouts = useWorkoutStore(state => state.workouts);
  const setActiveWorkoutId = useWorkoutStore(state => state.setActiveWorkoutId);

  const activeSession = useWorkoutStore(state => state.activeSession);
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const history = useWorkoutStore(state => state.history);

  const totalDuration = getTotalWorkoutDuration(workout.exercises);
  const completedCount = history.filter(h => h.status === 'completed' && h.workoutId === workout.id).length;

  const handleStart = () => {
    if (!activeSession) {
      startWorkout(workout.id);
    }
    navigate('/player');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-28">
      {/* Subtle App Branding Bar */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight leading-none font-['Outfit']">
              TAF <span className="text-amber-400">PMCE</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">Auxiliar de Treino 30 Min</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          OFFLINE
        </span>
      </div>
      {/* Active Session Running Alert Banner */}
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
            className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/30 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            Abrir Player
          </button>
        </div>
      )}

      {/* Discrete Workout Picker Header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Treino Ativo:</span>
          {workouts.length > 1 ? (
            <select
              value={workout.id}
              onChange={e => setActiveWorkoutId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-xl focus:outline-none cursor-pointer"
            >
              {workouts.map(w => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-amber-400">{workout.title}</span>
          )}
        </div>

        <Link
          to="/workouts"
          className="text-xs font-bold text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          <span>Gerenciar Treinos ({workouts.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Simplified Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{workout.isDefault ? 'Série Oficial TAF PMCE' : 'Treino Personalizado'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-['Outfit']">
            {workout.title}
          </h1>

          {workout.description && (
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              {workout.description}
            </p>
          )}

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/70 px-3.5 py-2 rounded-xl border border-zinc-800">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Duração: <strong className="text-white font-mono">{formatTimeHoursMins(totalDuration)}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/70 px-3.5 py-2 rounded-xl border border-zinc-800">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Exercícios: <strong className="text-white font-mono">{workout.exercises.length} Blocos</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950/70 px-3.5 py-2 rounded-xl border border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Séries Concluídas: <strong className="text-white font-mono">{completedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Primary Call-to-Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleStart}
            className="w-full sm:flex-1 py-5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-lg shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-7 h-7 fill-current" />
            <span>INICIAR TREINO</span>
          </button>

          <Link
            to="/edit"
            className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm transition-all flex items-center justify-center gap-2 border border-zinc-700 active:scale-95 shrink-0"
          >
            <Edit3 className="w-5 h-5 text-amber-400" />
            <span>Editar Exercícios</span>
          </Link>
        </div>
      </div>

      {/* Clean Timeline Exercise Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit']">Exercícios do Treino</h2>
            <p className="text-xs text-zinc-400">Sequência oficial dos blocos</p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            {workout.exercises.length} Exercícios
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
                {formatTimeHoursMins(totalDuration)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Fim da série! 🎉</h4>
                <p className="text-xs text-emerald-400 font-medium">Treino concluído com sucesso</p>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Discrete Tip Footer */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <p>
          Tela acesa automática e bipes sonoros ativos durante a execução.
        </p>
      </div>
    </div>
  );
};
