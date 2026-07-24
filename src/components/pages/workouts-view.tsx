import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Edit } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { ConfirmModal } from '../molecules';
import { Button, Input, ModalBase } from '../atoms';
import { EmptyState, FormField } from '../molecules';
import { WorkoutCard } from '../organisms';
import type { Workout } from '../../types';

export const WorkoutsView: React.FC = () => {
  const navigate = useNavigate();
  const workouts = useWorkoutStore(state => state.workouts);
  const activeWorkoutId = useWorkoutStore(state => state.activeWorkoutId);
  const setActiveWorkoutId = useWorkoutStore(state => state.setActiveWorkoutId);
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const createWorkout = useWorkoutStore(state => state.createWorkout);
  const deleteWorkout = useWorkoutStore(state => state.deleteWorkout);
  const updateWorkoutDetails = useWorkoutStore(state => state.updateWorkoutDetails);
  const history = useWorkoutStore(state => state.history);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingDetailsWorkout, setEditingDetailsWorkout] = useState<Workout | null>(null);
  const [deleteWorkoutTarget, setDeleteWorkoutTarget] = useState<Workout | null>(null);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setShowCreateModal(true);
  };

  const showCreateWorkoutModal = useWorkoutStore(state => state.showCreateWorkoutModal);
  const setShowCreateWorkoutModal = useWorkoutStore(state => state.setShowCreateWorkoutModal);

  React.useEffect(() => {
    if (showCreateWorkoutModal) {
      handleOpenCreateModal();
    }
  }, [showCreateWorkoutModal]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setShowCreateWorkoutModal(false);
  };

  const handleSaveNewWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    createWorkout(formTitle, formDescription);
    handleCloseCreateModal();
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
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Workouts Grid */}
      {workouts.length === 0 ? (
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
            <Button type="button" variant="zinc" size="md" fullWidth onClick={handleCloseCreateModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" size="md" fullWidth>
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
            <Button type="button" variant="zinc" size="md" fullWidth onClick={() => setEditingDetailsWorkout(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" size="md" fullWidth>
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
        onConfirm={() => {
          if (deleteWorkoutTarget) {
            deleteWorkout(deleteWorkoutTarget.id);
            setDeleteWorkoutTarget(null);
          }
        }}
        onCancel={() => setDeleteWorkoutTarget(null)}
      />
    </div>
  );
};
