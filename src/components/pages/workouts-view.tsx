import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Edit, AlertCircle } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { useWorkouts, useSaveWorkout, useDeleteWorkout } from '../../hooks';
import { useHistory } from '../../hooks';
import { ConfirmModal, LoadingState } from '../molecules';
import { Button, Input, ModalBase } from '../atoms';
import { EmptyState, FormField } from '../molecules';
import { WorkoutCard } from '../organisms';
import type { Workout } from '../../types';

export const WorkoutsView: React.FC = () => {
  const navigate = useNavigate();

  // Server state
  const { data: workouts = [], isLoading: isLoadingWorkouts } = useWorkouts();
  const { data: history = [] } = useHistory();
  const saveWorkout = useSaveWorkout();
  const deleteWorkout = useDeleteWorkout();

  // Ephemeral store
  const activeWorkoutId = useWorkoutStore(state => state.activeWorkoutId);
  const setActiveWorkoutId = useWorkoutStore(state => state.setActiveWorkoutId);
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const showCreateWorkoutModal = useWorkoutStore(state => state.showCreateWorkoutModal);
  const setShowCreateWorkoutModal = useWorkoutStore(state => state.setShowCreateWorkoutModal);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingDetailsWorkout, setEditingDetailsWorkout] = useState<Workout | null>(null);
  const [deleteWorkoutTarget, setDeleteWorkoutTarget] = useState<Workout | null>(null);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setErrorMessage(null);
    setShowCreateModal(true);
  };

  React.useEffect(() => {
    if (showCreateWorkoutModal) {
      handleOpenCreateModal();
    }
  }, [showCreateWorkoutModal]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setShowCreateWorkoutModal(false);
    setErrorMessage(null);
  };

  const handleSaveNewWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setErrorMessage(null);

    const now = new Date().toISOString();
    const newWorkout: Workout = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      exercises: [],
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveWorkout.mutateAsync(newWorkout);
      setActiveWorkoutId(newWorkout.id);
      handleCloseCreateModal();
      navigate('/edit');
    } catch (err: any) {
      console.error('[WorkoutsView] Error creating workout:', err);
      setErrorMessage(err?.message || 'Erro ao conectar ao Turso. Verifique sua conexão.');
    }
  };

  const handleOpenEditDetailsModal = (w: Workout) => {
    setEditingDetailsWorkout(w);
    setFormTitle(w.title);
    setFormDescription(w.description || '');
    setErrorMessage(null);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetailsWorkout || !formTitle.trim()) return;
    setErrorMessage(null);

    try {
      await saveWorkout.mutateAsync({
        ...editingDetailsWorkout,
        title: formTitle.trim(),
        description: formDescription.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingDetailsWorkout(null);
    } catch (err: any) {
      console.error('[WorkoutsView] Error updating workout details:', err);
      setErrorMessage(err?.message || 'Erro ao salvar alterações no Turso.');
    }
  };

  const handleStartWorkout = (w: Workout) => {
    setActiveWorkoutId(w.id);
    startWorkout(w);
    navigate('/player');
  };

  const handleEditWorkoutExercises = (w: Workout) => {
    setActiveWorkoutId(w.id);
    navigate('/edit');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {isLoadingWorkouts ? (
        <LoadingState
          message="Carregando treinos..."
          description="Sincronizando com o banco Turso..."
          cardCount={2}
        />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-10 h-10 text-amber-400" />}
          title="Nenhum Treino Cadastrado"
          description="Você ainda não tem treinos criados. Clique no botão '+ Criar Treino' para cadastrar seu treino personalizado!"
          actionLabel="Criar Primeiro Treino"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workouts.map(w => {
            const isActive = w.id === activeWorkoutId;
            const completionsCount = history.filter(h => h.workoutId === w.id && h.status === 'completed').length;

            return (
              <WorkoutCard
                key={w.id}
                workout={w}
                isActive={isActive}
                completionsCount={completionsCount}
                onSelect={() => setActiveWorkoutId(w.id)}
                onEditDetails={() => handleOpenEditDetailsModal(w)}
                onEditExercises={() => handleEditWorkoutExercises(w)}
                onDelete={() => setDeleteWorkoutTarget(w)}
                onStart={() => handleStartWorkout(w)}
              />
            );
          })}
        </div>
      )}

      {/* Create New Workout Modal */}
      <ModalBase isOpen={showCreateModal} onClose={handleCloseCreateModal} maxWidth="md">
        <form onSubmit={handleSaveNewWorkout} className="space-y-4">
          <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <span>Criar Novo Treino</span>
          </h3>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <FormField label="Título do Treino">
              <Input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Treino Superiores & Core"
                className="font-bold text-sm"
              />
            </FormField>

            <FormField label="Descrição do Treino (Opcional)">
              <textarea
                rows={3}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Ex: Série personalizada focada no edital do TAF"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs resize-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="zinc"
              size="md"
              fullWidth
              onClick={handleCloseCreateModal}
              disabled={saveWorkout.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="amber"
              size="md"
              fullWidth
              isLoading={saveWorkout.isPending}
              loadingText="Criando Treino..."
              icon={<Plus className="w-4 h-4 stroke-[3]" />}
            >
              Criar Treino
            </Button>
          </div>
        </form>
      </ModalBase>

      {/* Edit Workout Details Modal */}
      <ModalBase isOpen={!!editingDetailsWorkout} onClose={() => setEditingDetailsWorkout(null)} maxWidth="md">
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Edit className="w-5 h-5 text-amber-400" />
            <span>Editar Detalhes do Treino</span>
          </h3>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <FormField label="Título do Treino">
              <Input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="font-bold text-sm"
              />
            </FormField>

            <FormField label="Descrição do Treino">
              <textarea
                rows={3}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-xs resize-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="zinc"
              size="md"
              fullWidth
              onClick={() => setEditingDetailsWorkout(null)}
              disabled={saveWorkout.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="amber"
              size="md"
              fullWidth
              isLoading={saveWorkout.isPending}
              loadingText="Salvando..."
            >
              Salvar
            </Button>
          </div>
        </form>
      </ModalBase>

      {/* Delete Workout Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteWorkoutTarget}
        title="Excluir Treino?"
        description={`Tem certeza que deseja apagar o treino "${deleteWorkoutTarget?.title}"? Esta ação removerá a série permanentemente.`}
        confirmLabel="Sim, Excluir"
        variant="danger"
        isLoading={deleteWorkout.isPending}
        onConfirm={async () => {
          if (deleteWorkoutTarget) {
            await deleteWorkout.mutateAsync(deleteWorkoutTarget.id);
            setDeleteWorkoutTarget(null);
          }
        }}
        onCancel={() => setDeleteWorkoutTarget(null)}
      />
    </div>
  );
};
