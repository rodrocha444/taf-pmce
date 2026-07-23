import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Play, Coffee, Target, BookOpen } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import type { Exercise } from '../../types';
import { getExerciseStartTime } from '../../utils/formatters';
import { ConfirmModal } from '../molecules';
import { Button, Input, Select, ModalBase } from '../atoms';
import { EmptyState, FormField } from '../molecules';
import { ExerciseCard } from '../organisms';

export const EditView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const exerciseCatalog = useWorkoutStore(state => state.exerciseCatalog || []);
  const addExerciseToWorkout = useWorkoutStore(state => state.addExerciseToWorkout);
  const updateExerciseInWorkout = useWorkoutStore(state => state.updateExerciseInWorkout);
  const deleteExerciseFromWorkout = useWorkoutStore(state => state.deleteExerciseFromWorkout);
  const reorderExercisesInWorkout = useWorkoutStore(state => state.reorderExercisesInWorkout);

  // Form Modal state for adding/editing
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<Exercise | null>(null);

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formExecutionType, setFormExecutionType] = useState<'reps' | 'time'>('reps');
  const [formTargetReps, setFormTargetReps] = useState<number | ''>(10);
  const [workMinutes, setWorkMinutes] = useState<number>(1);
  const [workSeconds, setWorkSeconds] = useState<number>(0);
  const [restMinutes, setRestMinutes] = useState<number>(1);
  const [restSeconds, setRestSeconds] = useState<number>(0);

  const handleSelectCatalogItem = (catId: string) => {
    setSelectedCatalogId(catId);
    const catItem = exerciseCatalog.find(c => c.id === catId);
    if (!catItem) return;

    setFormName(catItem.name);
    setFormNotes(catItem.focusNotes || '');
    setFormExecutionType(catItem.executionType);
    setFormTargetReps(catItem.defaultTargetReps ?? 10);

    const workTotal = catItem.defaultWorkDurationSeconds || 60;
    setWorkMinutes(Math.floor(workTotal / 60));
    setWorkSeconds(workTotal % 60);

    const restTotal = catItem.defaultRestDurationSeconds || 60;
    setRestMinutes(Math.floor(restTotal / 60));
    setRestSeconds(restTotal % 60);
  };

  const openAddModal = () => {
    setEditingExercise(null);
    setSelectedCatalogId('');
    setFormName('');
    setFormNotes('');
    setFormExecutionType('reps');
    setFormTargetReps(10);
    setWorkMinutes(1);
    setWorkSeconds(0);
    setRestMinutes(1);
    setRestSeconds(0);
    setIsAdding(true);

    if (exerciseCatalog.length > 0) {
      handleSelectCatalogItem(exerciseCatalog[0].id);
    }
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormNotes(exercise.focusNotes || '');

    const matchingCat = exerciseCatalog.find(c => c.id === exercise.catalogId || c.name.trim().toLowerCase() === exercise.name.trim().toLowerCase());
    setSelectedCatalogId(matchingCat ? matchingCat.id : '');

    const isReps = exercise.executionType === 'reps' || (exercise.targetReps !== undefined && exercise.targetReps > 0);
    setFormExecutionType(isReps ? 'reps' : 'time');
    setFormTargetReps(exercise.targetReps ?? 10);

    const workTotal = exercise.workDurationSeconds || 60;
    setWorkMinutes(Math.floor(workTotal / 60));
    setWorkSeconds(workTotal % 60);

    const restTotal = exercise.restDurationSeconds || 60;
    setRestMinutes(Math.floor(restTotal / 60));
    setRestSeconds(restTotal % 60);

    setIsAdding(false);
  };

  const closeModal = () => {
    setEditingExercise(null);
    setIsAdding(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const totalWorkSecs = Math.max(5, workMinutes * 60 + workSeconds);
    const totalRestSecs = Math.max(0, restMinutes * 60 + restSeconds);
    const isReps = formExecutionType === 'reps';
    const repsVal = isReps && typeof formTargetReps === 'number' ? Math.max(1, formTargetReps) : undefined;

    if (isAdding) {
      addExerciseToWorkout(workout.id, {
        name: formName.trim(),
        focusNotes: formNotes.trim(),
        executionType: formExecutionType,
        targetReps: repsVal,
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs
      });
    } else if (editingExercise) {
      updateExerciseInWorkout(workout.id, {
        ...editingExercise,
        name: formName.trim(),
        focusNotes: formNotes.trim(),
        executionType: formExecutionType,
        targetReps: repsVal,
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs,
        durationSeconds: totalWorkSecs + totalRestSecs
      });
    }

    closeModal();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header: Voltar | Nome do Treino | Novo Exercício */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <Button
          variant="zinc"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/workouts')}
        >
          Voltar
        </Button>

        <div className="text-center px-2 min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">Editando Treino</span>
          <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit'] truncate">
            {workout.title}
          </h2>
        </div>

        <Button
          variant="amber"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Novo Exercício
        </Button>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        {workout.exercises.length === 0 ? (
          <EmptyState
            icon={<Plus className="w-10 h-10 text-amber-400" />}
            title="Nenhum Exercício no Treino"
            description="Este treino ainda não possui exercícios. Clique em '+ Novo Exercício' para adicionar o primeiro!"
            actionLabel="Novo Exercício"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={openAddModal}
          />
        ) : (
          workout.exercises.map((exercise, idx) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={idx}
              startTimeFormatted={getExerciseStartTime(workout.exercises, idx)}
              showActions
              isFirst={idx === 0}
              isLast={idx === workout.exercises.length - 1}
              onMoveUp={() => reorderExercisesInWorkout(workout.id, idx, idx - 1)}
              onMoveDown={() => reorderExercisesInWorkout(workout.id, idx, idx + 1)}
              onEdit={() => openEditModal(exercise)}
              onDelete={() => setDeleteExerciseTarget(exercise)}
            />
          ))
        )}
      </div>

      {/* Form Modal (Add / Edit Exercise) */}
      <ModalBase isOpen={isAdding || editingExercise !== null} onClose={closeModal} maxWidth="md">
        <form onSubmit={handleSaveModal} className="space-y-4">
          <h3 className="text-lg font-bold text-white font-['Outfit']">
            {isAdding ? 'Adicionar Novo Exercício' : 'Editar Exercício'}
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Seletor Único de Exercício da Biblioteca */}
            <FormField
              label="Exercício"
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/exercises')}
                  className="text-amber-400 hover:underline"
                >
                  Biblioteca
                </Button>
              }
            >
              <Select
                required
                value={selectedCatalogId}
                onChange={e => handleSelectCatalogItem(e.target.value)}
              >
                <option value="">-- Selecionar Exercício da Biblioteca --</option>
                {exerciseCatalog.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Foco / Observação (Ex: Cotovelos para trás)">
              <Input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Ex: Foco TAF - Manter tronco firme"
              />
            </FormField>

            {/* Seletor de Tipo de Execução: Repetição vs Tempo */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">Modo do Exercício</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
                <Button
                  type="button"
                  variant={formExecutionType === 'reps' ? 'purple' : 'ghost'}
                  size="sm"
                  icon={<Target className="w-4 h-4" />}
                  onClick={() => setFormExecutionType('reps')}
                  fullWidth
                >
                  Por Repetição
                </Button>

                <Button
                  type="button"
                  variant={formExecutionType === 'time' ? 'amber' : 'ghost'}
                  size="sm"
                  icon={<Play className="w-4 h-4 fill-current" />}
                  onClick={() => setFormExecutionType('time')}
                  fullWidth
                >
                  Por Tempo
                </Button>
              </div>
            </div>

            {/* Input Condicional baseado no Modo Escolhido */}
            {formExecutionType === 'reps' ? (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <label className="block text-purple-300 font-bold flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Quantidade de Repetições (Reps)</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  required
                  value={formTargetReps}
                  onChange={e => setFormTargetReps(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  placeholder="Ex: 30"
                  accentColor="purple"
                  className="font-bold text-sm"
                />
                <p className="text-[11px] text-purple-300/80">O atleta tentará realizar esta quantidade exata de repetições durante o bloco.</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label className="block text-amber-300 font-bold flex items-center gap-1.5">
                  <Play className="w-4 h-4 fill-current text-amber-400" />
                  <span>Tempo de Execução (Work)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Minutos</label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={workMinutes}
                      onChange={e => setWorkMinutes(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={workSeconds}
                      onChange={e => setWorkSeconds(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-300/80">O cronômetro fará a contagem regressiva deste tempo de execução.</p>
              </div>
            )}

            {/* Tempo de Descanso */}
            <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
              <label className="block text-cyan-400 font-bold flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5" />
                <span>Tempo de Descanso (Rest)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Minutos</label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={restMinutes}
                    onChange={e => setRestMinutes(parseInt(e.target.value) || 0)}
                    accentColor="cyan"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={restSeconds}
                    onChange={e => setRestSeconds(parseInt(e.target.value) || 0)}
                    accentColor="cyan"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="zinc" size="md" fullWidth onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" size="md" fullWidth icon={<Save className="w-4 h-4" />}>
              Salvar
            </Button>
          </div>
        </form>
      </ModalBase>

      {/* Delete Exercise Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteExerciseTarget}
        title="Excluir Exercício?"
        description={`Tem certeza que deseja remover "${deleteExerciseTarget?.name}" da sua série de treino?`}
        confirmLabel="Sim, Remover"
        variant="danger"
        onConfirm={() => {
          if (deleteExerciseTarget) {
            deleteExerciseFromWorkout(workout.id, deleteExerciseTarget.id);
            setDeleteExerciseTarget(null);
          }
        }}
        onCancel={() => setDeleteExerciseTarget(null)}
      />
    </div>
  );
};
