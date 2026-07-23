import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Edit3, History, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 header-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo / Title */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-white tracking-tight leading-none font-['Outfit']">
                TAF <span className="text-amber-400">PMCE</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OFFLINE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Auxiliar de Treino 30 Min</p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-1 sm:gap-2">

          <Link
            to="/edit"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isActivePath('/edit')
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Editar Treino"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden md:inline">Editar</span>
          </Link>

          <Link
            to="/history"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isActivePath('/history')
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Histórico de Treinos"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Histórico</span>
          </Link>

          <Link
            to="/settings"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isActivePath('/settings')
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
};
