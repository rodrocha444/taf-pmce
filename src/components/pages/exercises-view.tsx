import React, { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import type { ExerciseCatalogItem, ExerciseExecutionType } from '../../types';
import { ConfirmModal } from '../molecules';
import { Button, Input, Select, ModalBase } from '../atoms';
import { EmptyState, FormField } from '../molecules';
import { ExerciseCatalogCard } from '../organisms';
import { formatDate } from '../../utils/formatters';

export const ExercisesView: React.FC = () => {
  const exerciseCatalog = useWorkoutStore(state => state.exerciseCatalog || []);
  const addCatalogExercise = useWorkoutStore(state => state.addCatalogExercise);
  const deleteCatalogExercise = useWorkoutStore(state => state.deleteCatalogExercise);
  const history = useWorkoutStore(state => state.history || []);

  const showCreateExerciseModal = useWorkoutStore(state => state.showCreateExerciseModal);
  const setShowCreateExerciseModal = useWorkoutStore(state => state.setShowCreateExerciseModal);

  React.useEffect(() => {
    if (showCreateExerciseModal) {
      openCreateModal();
    }
  }, [showCreateExerciseModal]);

  const handleCloseModal = () => {
    setShowModal(false);
    setShowCreateExerciseModal(false);
  };
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ExerciseCatalogItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ExerciseCatalogItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [executionType, setExecutionType] = useState<ExerciseExecutionType>('reps');
  const [focusNotes, setFocusNotes] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setExecutionType('reps');
    setFocusNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: ExerciseCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setExecutionType(item.executionType);
    setFocusNotes(item.focusNotes || '');
    setShowModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      useWorkoutStore.setState(state => ({
        exerciseCatalog: (state.exerciseCatalog || []).map(c => 
          c.id === editingItem.id ? {
            ...c,
            name: name.trim(),
            executionType,
            focusNotes: focusNotes.trim()
          } : c
        )
      }));
    } else {
      addCatalogExercise({
        name: name.trim(),
        executionType,
        defaultWorkDurationSeconds: 60,
        defaultRestDurationSeconds: 60,
        focusNotes: focusNotes.trim()
      });
    }

    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    if (deleteTargetItem) {
      deleteCatalogExercise(deleteTargetItem.id);
      setDeleteTargetItem(null);
    }
  };

  // Helper to fetch repetition/time history for an exercise
  const getExerciseLogs = (exName: string) => {
    const logs: { id: string; date: string; value: string; numVal: number }[] = [];

    history.forEach(session => {
      if (session.exerciseLogs) {
        session.exerciseLogs.forEach(exLog => {
          if (exLog.exerciseName.trim().toLowerCase() === exName.trim().toLowerCase()) {
            const isReps = exLog.executionType === 'reps' || (exLog.completedReps && exLog.completedReps > 0);
            const valNum = isReps ? (exLog.completedReps || 0) : (exLog.realWorkSeconds || exLog.workDurationSeconds || 0);

            logs.push({
              id: exLog.id,
              date: session.date,
              value: isReps ? `${valNum} reps` : `${valNum}s`,
              numVal: valNum
            });
          }
        });
      }
    });

    const maxVal = logs.length > 0 ? Math.max(...logs.map(l => l.numVal)) : 0;
    return { logs, maxVal };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Exercises List Cards */}

      {/* Exercises List Cards */}
      {exerciseCatalog.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-amber-400" />}
          title="Biblioteca Vazia"
          description="Você ainda não tem exercícios cadastrados na biblioteca. Clique no botão '+ Criar Exercício' para adicionar seu primeiro exercício!"
          actionLabel="Criar Primeiro Exercício"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exerciseCatalog.map(item => {
            const { logs, maxVal } = getExerciseLogs(item.name);

            return (
              <ExerciseCatalogCard
                key={item.id}
                item={item}
                logs={logs}
                maxVal={maxVal}
                formatDate={formatDate}
                onEdit={() => openEditModal(item)}
                onDelete={() => setDeleteTargetItem(item)}
              />
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <ModalBase isOpen={showModal} onClose={handleCloseModal} maxWidth="md">
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-base font-bold text-white font-['Outfit']">
              {editingItem ? 'Editar Exercício da Biblioteca' : 'Criar Exercício Independente'}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleCloseModal}
            >
              ✕
            </Button>
          </div>

          <FormField label="Nome do Exercício">
            <Input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Flexão de Braço no Solo"
            />
          </FormField>

          <FormField label="Tipo de Execução">
            <Select
              value={executionType}
              onChange={e => setExecutionType(e.target.value as ExerciseExecutionType)}
            >
              <option value="reps">Por Repetições (Contagem de reps)</option>
              <option value="time">Por Tempo (Isometria / Sustentação)</option>
            </Select>
          </FormField>

          <FormField label="Informação / Instruções sobre o Exercício">
            <textarea
              rows={3}
              value={focusNotes}
              onChange={e => setFocusNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
              placeholder="ex: Corpo alinhado, peito rente ao solo na descida e extensão total dos cotovelos."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button type="button" variant="zinc" size="md" fullWidth onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" size="md" fullWidth>
              Salvar no Catálogo
            </Button>
          </div>
        </form>
      </ModalBase>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteTargetItem !== null}
        title="Excluir Exercício da Biblioteca"
        description={`Tem certeza que deseja excluir "${deleteTargetItem?.name}" da biblioteca?`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetItem(null)}
      />
    </div>
  );
};
