import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Edit3, History, Settings } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const activeSession = useWorkoutStore(state => state.activeSession);

  // Hide bottom nav in active player fullscreen mode for maximum immersive experience, or show compact bar
  if (location.pathname === '/player') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-4 py-2 flex items-center justify-around max-w-lg mx-auto md:hidden">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          isActive('/') ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Início</span>
      </Link>

      <Link
        to="/edit"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          isActive('/edit') ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Edit3 className="w-5 h-5" />
        <span>Editar</span>
      </Link>

      {/* Floating Center Workout Player Action */}
      <Link
        to="/player"
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/30 active:scale-95 transition-all -mt-5 border-2 border-zinc-950 ${
          activeSession ? 'animate-pulse-subtle' : ''
        }`}
      >
        <Play className="w-6 h-6 fill-current ml-0.5" />
      </Link>

      <Link
        to="/history"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          isActive('/history') ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <History className="w-5 h-5" />
        <span>Histórico</span>
      </Link>

      <Link
        to="/settings"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          isActive('/settings') ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Ajustes</span>
      </Link>
    </nav>
  );
};
