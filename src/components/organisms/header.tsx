import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Plus, Settings } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { Button } from '../atoms';

export const Header: React.FC = () => {
  const location = useLocation();
  const setShowCreateWorkoutModal = useWorkoutStore(state => state.setShowCreateWorkoutModal);
  const setShowCreateExerciseModal = useWorkoutStore(state => state.setShowCreateExerciseModal);
  const setShowManualHistoryModal = useWorkoutStore(state => state.setShowManualHistoryModal);

  // Hide top header in active player fullscreen mode or edit view
  if (location.pathname === '/player' || location.pathname === '/edit') {
    return null;
  }

  const isWorkoutsPage = location.pathname === '/' || location.pathname === '/workouts';
  const isExercisesPage = location.pathname === '/exercises';
  const isHistoryPage = location.pathname === '/history';
  const isSettingsActive = location.pathname === '/settings';

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 header-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo / App Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-tight leading-none font-['Outfit']">
                TAF <span className="text-amber-400">PMCE</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PWA
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">Treinamento e Preparação TAF</p>
          </div>
        </Link>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Button: + Criar Treino (Exclusivo na página de treinos) */}
          {isWorkoutsPage && (
            <Button
              variant="amber"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateWorkoutModal(true)}
            >
              <span>Criar Treino</span>
            </Button>
          )}

          {/* Button: + Criar Exercício (Exclusivo na página de exercícios) */}
          {isExercisesPage && (
            <Button
              variant="amber"
              size="md"
              icon={<Plus className="w-4 h-4 stroke-[3]" />}
              onClick={() => setShowCreateExerciseModal(true)}
            >
              <span>Criar Exercício</span>
            </Button>
          )}

          {/* Button: + Registrar Treino (Exclusivo na página de histórico) */}
          {isHistoryPage && (
            <Button
              variant="amber"
              size="md"
              icon={<Plus className="w-4 h-4 stroke-[3]" />}
              onClick={() => setShowManualHistoryModal(true)}
            >
              <span>Registrar Treino</span>
            </Button>
          )}

          {/* Button: Configurações */}
          <Link
            to="/settings"
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isSettingsActive
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
            title="Configurações do aplicativo"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
