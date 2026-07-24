import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { History, BarChart3, Dumbbell, Play, Zap, BookOpen } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const activeSession = useWorkoutStore(state => state.activeSession);

  // Hide bottom nav in active player fullscreen mode or edit view
  if (location.pathname === '/player' || location.pathname === '/edit') {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/workouts') {
      return location.pathname === '/' || location.pathname === '/workouts';
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Active Workout Floating Banner (returns to active session from any screen) */}
      {activeSession && (
        <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto">
          <Link
            to="/player"
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-zinc-950 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-between gap-3 animate-pulse-subtle border border-amber-300 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-zinc-950 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-xs leading-none">Treino em Andamento!</h4>
                <p className="text-[10px] font-bold font-mono opacity-90 mt-0.5">
                  Exercício #{activeSession.currentExerciseIndex + 1} em execução
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-zinc-950 text-amber-400 font-black text-[11px] shrink-0">
              Retornar →
            </span>
          </Link>
        </div>
      )}

      {/* Clean Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2 flex items-center justify-around max-w-xl mx-auto bottom-nav-safe text-center shadow-2xl shadow-black">
        <Link
          to="/workouts"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold transition-all duration-300 relative ${
            isActive('/workouts') 
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105' 
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>Treinos</span>
        </Link>

        <Link
          to="/exercises"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold transition-all duration-300 relative ${
            isActive('/exercises') 
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105' 
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>Exercícios</span>
        </Link>

        <Link
          to="/running"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold transition-all duration-300 relative ${
            isActive('/running') 
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105' 
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] fill-current" />
          <span>Corrida</span>
        </Link>

        <Link
          to="/history"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold transition-all duration-300 relative ${
            isActive('/history') 
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105' 
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>Histórico</span>
        </Link>

        <Link
          to="/reports"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold transition-all duration-300 relative ${
            isActive('/reports') 
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105' 
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>Relatórios</span>
        </Link>
      </nav>
    </>
  );
};
