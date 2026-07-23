import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Trophy, Zap, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatTimeHoursMins } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const navigate = useNavigate();
  const history = useWorkoutStore(state => state.history || []);
  const runningHistory = useWorkoutStore(state => state.runningHistory || []);

  const completedWorkouts = history.filter(h => h.status === 'completed');
  const totalWorkoutSeconds = completedWorkouts.reduce((acc, h) => acc + (h.realDurationSeconds || h.durationSeconds || 0), 0);

  const totalRunningKm = runningHistory.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
  const totalRunningSeconds = runningHistory.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);

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
          <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
          <p className="text-[10px] text-zinc-500">Treinos com progresso</p>
        </div>
      </div>

      {/* Progress Summary Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider flex items-center gap-2">
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
