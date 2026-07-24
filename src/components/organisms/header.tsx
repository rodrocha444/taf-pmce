import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Plus, Settings, Cloud, RefreshCw } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { Button } from '../atoms';
import { getSyncStatus, subscribeSyncStatus, uploadToCloud, getStoredSyncId, type SyncState } from '../../services/cloud-sync';

export const Header: React.FC = () => {
  const location = useLocation();
  const setShowCreateWorkoutModal = useWorkoutStore(state => state.setShowCreateWorkoutModal);
  const setShowCreateExerciseModal = useWorkoutStore(state => state.setShowCreateExerciseModal);
  const setShowManualHistoryModal = useWorkoutStore(state => state.setShowManualHistoryModal);

  const [syncState, setSyncState] = useState<SyncState>(getSyncStatus());

  useEffect(() => {
    return subscribeSyncStatus(state => setSyncState(state));
  }, []);

  const handleManualSync = () => {
    const syncId = getStoredSyncId();
    if (syncId) {
      uploadToCloud(syncId);
    }
  };

  // Hide top header in active player fullscreen mode or edit view
  if (location.pathname === '/player' || location.pathname === '/edit') {
    return null;
  }

  const isWorkoutsPage = location.pathname === '/' || location.pathname === '/workouts';
  const isExercisesPage = location.pathname === '/exercises';
  const isHistoryPage = location.pathname === '/history';
  const isSettingsActive = location.pathname === '/settings';

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 header-safe shadow-lg shadow-black/30">
      {/* Magical Top Ambient Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-80" />

      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo / App Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 group-hover:scale-105 transition-all duration-300">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-tight leading-none font-['Outfit']">
                TAF <span className="text-amber-400">PMCE</span>
              </span>
              
              {/* Cloud Sync Status Icon Only */}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  handleManualSync();
                }}
                className={`p-1 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                  syncState === 'syncing'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    : syncState === 'synced'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                    : syncState === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
                title={
                  syncState === 'synced'
                    ? 'Sincronizado na Nuvem. Clique para atualizar.'
                    : syncState === 'syncing'
                    ? 'Sincronizando com a nuvem...'
                    : 'Clique para sincronizar na nuvem'
                }
              >
                {syncState === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                ) : syncState === 'synced' ? (
                  <Cloud className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Cloud className="w-3 h-3 text-zinc-400" />
                )}
              </span>
            </div>
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
