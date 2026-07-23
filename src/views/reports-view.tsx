import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Zap, 
  Clock, 
  Calendar, 
  ArrowLeft,
  Dumbbell
} from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatTimeHoursMins, formatDate } from '../utils/formatters';
import type { ExerciseEvolutionLog } from '../types';

export const ReportsView: React.FC = () => {
  const navigate = useNavigate();
  const history = useWorkoutStore(state => state.history || []);
  const runningHistory = useWorkoutStore(state => state.runningHistory || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const completedWorkouts = history.filter(h => h.status === 'completed');
  const totalWorkoutSeconds = completedWorkouts.reduce((acc, h) => acc + (h.realDurationSeconds || h.durationSeconds || 0), 0);

  const totalRunningKm = runningHistory.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
  const totalRunningSeconds = runningHistory.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);

  // Aggregate all exercise evolution logs from history
  const allExerciseLogs: ExerciseEvolutionLog[] = [];
  history.forEach(log => {
    if (log.exerciseLogs && log.exerciseLogs.length > 0) {
      allExerciseLogs.push(...log.exerciseLogs);
    }
  });

  // Group evolution logs by Exercise Name
  const exerciseGroups: Record<string, ExerciseEvolutionLog[]> = {};
  allExerciseLogs.forEach(exLog => {
    const key = exLog.exerciseName.trim();
    if (!exerciseGroups[key]) {
      exerciseGroups[key] = [];
    }
    exerciseGroups[key].push(exLog);
  });

  // Categories list
  const categories = ['todos', 'barra', 'abdominal', 'flexao', 'perna', 'isometria', 'outros'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h1 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <span>Relatórios de Desempenho</span>
        </h1>

        <div className="w-16" />
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Workouts Completed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Séries Concluídas</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{completedWorkouts.length}</div>
          <p className="text-[10px] text-zinc-500">Treinos de força finalizados</p>
        </div>

        {/* Total Time Trained */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Tempo de Treino</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatTimeHoursMins(totalWorkoutSeconds + totalRunningSeconds)}
          </div>
          <p className="text-[10px] text-zinc-500">Acumulado total no app</p>
        </div>

        {/* Total Running Km */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Distância Corrida</span>
            <Zap className="w-4 h-4 text-amber-400 fill-current" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalRunningKm.toFixed(1)} <span className="text-xs font-normal text-zinc-400">km</span>
          </div>
          <p className="text-[10px] text-zinc-500">{runningHistory.length} corridas registradas</p>
        </div>

        {/* Consistency */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Evolução TAF</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {Object.keys(exerciseGroups).length > 0 ? `${Object.keys(exerciseGroups).length} Exercícios` : '100%'}
          </div>
          <p className="text-[10px] text-zinc-500">Métricas ativas no sistema</p>
        </div>
      </div>

      {/* EXERCISE REPETITION EVOLUTION SECTION */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">Histórico de Evolução por Exercício</h2>
              <p className="text-xs text-zinc-400">Acompanhe seu progresso de repetições e tempos alcançados</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {Object.keys(exerciseGroups).length === 0 ? (
          <div className="bg-zinc-950 p-6 rounded-2xl text-center space-y-2 border border-zinc-800/80">
            <Dumbbell className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhuma Evolução Registrada</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Ao concluir seus treinos no timer ou registrar manualmente, o histórico de repetições por exercício aparecerá aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(exerciseGroups)
              .filter(([_, logs]) => {
                if (selectedCategory === 'todos') return true;
                return logs.some(l => l.category === selectedCategory);
              })
              .map(([exName, logs]) => {
                const isReps = logs.some(l => l.executionType === 'reps' || (l.completedReps && l.completedReps > 0));
                
                // Calculate Personal Best (PR)
                const prValue = isReps
                  ? Math.max(...logs.map(l => l.completedReps || 0))
                  : Math.max(...logs.map(l => l.realWorkSeconds || l.workDurationSeconds || 0));

                const lastLog = logs[logs.length - 1];

                return (
                  <div
                    key={exName}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800/60 pb-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                          {lastLog.category || 'exercício'}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1 font-['Outfit']">{exName}</h3>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1 text-right">
                        <span className="text-[9px] text-amber-400 font-bold uppercase block">Recorde (PR)</span>
                        <strong className="text-sm font-black text-amber-400 font-mono">
                          {isReps ? `${prValue} reps` : `${prValue}s`}
                        </strong>
                      </div>
                    </div>

                    {/* Progress History Entries */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                        Histórico de Execuções ({logs.length})
                      </span>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {logs.map((logItem, idx) => {
                          const val = isReps ? (logItem.completedReps || 0) : (logItem.realWorkSeconds || logItem.workDurationSeconds);
                          const maxVal = Math.max(prValue, 1);
                          const percentage = Math.min(100, Math.round((val / maxVal) * 100));

                          return (
                            <div key={logItem.id || idx} className="space-y-1 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60 text-xs font-mono">
                              <div className="flex items-center justify-between text-zinc-300">
                                <span className="text-[10px] text-zinc-500">{formatDate(logItem.timestamp)}</span>
                                <span className="font-bold text-amber-400">
                                  {isReps ? `${val} reps` : `${val}s`} {val === prValue && '🏆 (PR)'}
                                </span>
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Progress Summary Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400 font-['Outfit'] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Resumo de Atividades</span>
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Base Local</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Treino de Força & Séries</h3>
            <p className="text-xs text-zinc-300">
              Você realizou <strong className="text-white">{completedWorkouts.length} sessões</strong> completas de exercícios TAF (Barra, Abdominal, Flexão, Perna e Isometria).
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Desempenho de Corrida</h3>
            <p className="text-xs text-zinc-300">
              Foram <strong className="text-white">{runningHistory.length} sessões de corrida</strong> registradas com um total de <strong className="text-amber-400">{totalRunningKm.toFixed(2)} km</strong> percorridos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
