import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Play, Edit3, Trash2, RotateCcw, Clock, ShieldCheck, CheckCircle2, Flame, Edit } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatTimeHoursMins, getTotalWorkoutDuration } from '../utils/formatters';
import { ConfirmModal } from '../components/confirm-modal';
import type { Workout } from '../types';

export const WorkoutsView: React.FC = () => {
  const navigate = useNavigate();
  const workouts = useWorkoutStore(state => state.workouts);
  const activeWorkoutId = useWorkoutStore(state => state.activeWorkoutId);
  const setActiveWorkoutId = useWorkoutStore(state => state.setActiveWorkoutId);
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const createWorkout = useWorkoutStore(state => state.createWorkout);
  const deleteWorkout = useWorkoutStore(state => state.deleteWorkout);
  const updateWorkoutDetails = useWorkoutStore(state => state.updateWorkoutDetails);
  const resetDefaultWorkout = useWorkoutStore(state => state.resetDefaultWorkout);
  const history = useWorkoutStore(state => state.history);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingDetailsWorkout, setEditingDetailsWorkout] = useState<Workout | null>(null);
  const [deleteWorkoutTarget, setDeleteWorkoutTarget] = useState<Workout | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setShowCreateModal(true);
  };

  const handleSaveNewWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    createWorkout(formTitle, formDescription);
    setShowCreateModal(false);
    navigate('/edit');
  };

  const handleOpenEditDetailsModal = (w: Workout) => {
    setEditingDetailsWorkout(w);
    setFormTitle(w.title);
    setFormDescription(w.description || '');
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetailsWorkout || !formTitle.trim()) return;
    updateWorkoutDetails(editingDetailsWorkout.id, formTitle, formDescription);
    setEditingDetailsWorkout(null);
  };

  const handleStartWorkout = (w: Workout) => {
    setActiveWorkoutId(w.id);
    startWorkout(w.id);
    navigate('/player');
  };

  const handleEditWorkoutExercises = (w: Workout) => {
    setActiveWorkoutId(w.id);
    navigate('/edit');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <span>Meus Treinos</span>
          </h1>
          <p className="text-xs text-zinc-400">{workouts.length} {workouts.length === 1 ? 'treino salvo' : 'treinos salvos no aplicativo'}</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Treino</span>
        </button>
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workouts.map(w => {
          const isActive = w.id === activeWorkoutId;
          const totalDuration = getTotalWorkoutDuration(w.exercises);
          const completionsCount = history.filter(h => h.workoutId === w.id && h.status === 'completed').length;

          return (
            <div
              key={w.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 relative ${
                isActive
                  ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-amber-500/80 ring-1 ring-amber-500/40 shadow-xl shadow-amber-500/5'
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="space-y-3">
                {/* Badges Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isActive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                        ★ Ativo
                      </span>
                    )}
                    {w.isDefault ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Oficial TAF PMCE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold">
                        Personalizado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDetailsModal(w)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                      title="Editar título e descrição"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {!w.isDefault && (
                      <button
                        onClick={() => setDeleteWorkoutTarget(w)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Excluir treino"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] line-clamp-1">{w.title}</h3>
                  {w.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{w.description}</p>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeHoursMins(totalDuration)}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-rose-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {w.exercises.length} blocos
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {completionsCount} treinos
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                {!isActive ? (
                  <button
                    onClick={() => setActiveWorkoutId(w.id)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all active:scale-95"
                  >
                    Selecionar
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    Treino Ativo
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditWorkoutExercises(w)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1 border border-zinc-700 active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exercícios</span>
                  </button>

                  <button
                    onClick={() => handleStartWorkout(w)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Default TAF Action Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white">Série Oficial TAF PMCE</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Deseja restaurar a série original de 15 exercícios oficiais?</p>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center gap-1 border border-zinc-700 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar TAF</span>
        </button>
      </div>

      {/* Create New Workout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewWorkout}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Criar Novo Treino</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Título do Treino</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ex: Treino Superiores & Core"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descrição do Treino (Opcional)</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Ex: Série personalizada focada no edital do TAF"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20"
              >
                Criar Treino
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Workout Details Modal */}
      {editingDetailsWorkout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDetails}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-400" />
              <span>Editar Detalhes do Treino</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Título do Treino</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descrição do Treino</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingDetailsWorkout(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Workout Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteWorkoutTarget}
        title="Excluir Treino?"
        description={`Tem certeza que deseja apagar o treino "${deleteWorkoutTarget?.title}"? Esta ação removerá a série permanentemente.`}
        confirmLabel="Sim, Excluir"
        variant="danger"
        onConfirm={() => {
          if (deleteWorkoutTarget) {
            deleteWorkout(deleteWorkoutTarget.id);
            setDeleteWorkoutTarget(null);
          }
        }}
        onCancel={() => setDeleteWorkoutTarget(null)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Restaurar Série Padrão TAF PMCE?"
        description="Esta ação irá redefinir a lista de exercícios para os 15 blocos oficiais originais do TAF PMCE."
        confirmLabel="Sim, Restaurar Padrão"
        variant="amber"
        onConfirm={() => {
          resetDefaultWorkout();
          setShowResetModal(false);
        }}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
