import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Play, Coffee, Target, Layers, Copy } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { useWorkouts, useSaveWorkout, useExerciseCatalog } from '../../hooks';
import type { Exercise, Workout } from '../../types';
import { getExerciseStartTime, formatSecondsToMMSS } from '../../utils/formatters';
import { ConfirmModal } from '../molecules';
import { Button, Input, Select, ModalBase } from '../atoms';
import { EmptyState, FormField } from '../molecules';
import { ExerciseCard, ExerciseGroupCard, type GroupedExerciseItem } from '../organisms';

interface SetConfig {
  reps: number | '';
  workMinutes: number;
  workSeconds: number;
  restMinutes: number;
  restSeconds: number;
}

interface ExerciseGroupData {
  key: string;
  isGroup: boolean; // true if items.length > 1
  groupName: string;
  focusNotes?: string;
  executionType?: 'reps' | 'time';
  catalogId?: string;
  items: GroupedExerciseItem[];
}

export const EditView: React.FC = () => {
  const navigate = useNavigate();

  // Server state
  const { data: workouts = [] } = useWorkouts();
  const { data: exerciseCatalog = [] } = useExerciseCatalog();
  const saveWorkout = useSaveWorkout();

  // Ephemeral store — apenas activeWorkoutId
  const activeWorkoutId = useWorkoutStore(state => state.activeWorkoutId);

  // Resolve workout ativo
  const workout: Workout = workouts.find(w => w.id === activeWorkoutId) ?? workouts[0] ?? {
    id: '', title: 'Sem treino', description: '', exercises: [], createdAt: '', updatedAt: ''
  };

  // ── Ações de exercícios (modificam o workout e persistem via saveWorkout) ──

  const addExerciseToWorkout = (workoutId: string, exerciseData: Omit<Exercise, 'id' | 'durationSeconds'>) => {
    if (!workout || workout.id !== workoutId) return;
    const workSecs = exerciseData.workDurationSeconds || 60;
    const restSecs = exerciseData.restDurationSeconds || 60;
    const newExercise: Exercise = {
      ...exerciseData,
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      workDurationSeconds: workSecs,
      restDurationSeconds: restSecs,
      durationSeconds: workSecs + restSecs
    };
    saveWorkout.mutate({
      ...workout,
      exercises: [...workout.exercises, newExercise],
      updatedAt: new Date().toISOString()
    });
  };

  const addExerciseSetsToWorkout = (
    workoutId: string,
    baseExercise: Omit<Exercise, 'id' | 'durationSeconds' | 'setNumber' | 'totalSets' | 'setId' | 'workDurationSeconds' | 'restDurationSeconds'> & { workDurationSeconds?: number; restDurationSeconds?: number },
    sets: { targetReps?: number; workDurationSeconds?: number; restDurationSeconds?: number }[]
  ) => {
    if (!workout || workout.id !== workoutId || !sets.length) return;
    const setId = `set-grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const totalSets = sets.length;
    const newExercises: Exercise[] = sets.map((s, idx) => {
      const workSecs = s.workDurationSeconds ?? baseExercise.workDurationSeconds ?? 60;
      const restSecs = s.restDurationSeconds ?? baseExercise.restDurationSeconds ?? 60;
      return {
        ...baseExercise,
        id: `ex-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        targetReps: s.targetReps !== undefined ? s.targetReps : baseExercise.targetReps,
        workDurationSeconds: workSecs,
        restDurationSeconds: restSecs,
        durationSeconds: workSecs + restSecs,
        setNumber: idx + 1,
        totalSets,
        setId
      };
    });
    saveWorkout.mutate({
      ...workout,
      exercises: [...workout.exercises, ...newExercises],
      updatedAt: new Date().toISOString()
    });
  };

  const updateExerciseInWorkout = (workoutId: string, updatedExercise: Exercise) => {
    if (!workout || workout.id !== workoutId) return;
    const workSecs = updatedExercise.workDurationSeconds || 60;
    const restSecs = updatedExercise.restDurationSeconds || 60;
    const finalExercise: Exercise = {
      ...updatedExercise,
      workDurationSeconds: workSecs,
      restDurationSeconds: restSecs,
      durationSeconds: workSecs + restSecs
    };
    saveWorkout.mutate({
      ...workout,
      exercises: workout.exercises.map(e => e.id === finalExercise.id ? finalExercise : e),
      updatedAt: new Date().toISOString()
    });
  };

  const deleteExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    if (!workout || workout.id !== workoutId) return;
    saveWorkout.mutate({
      ...workout,
      exercises: workout.exercises.filter(e => e.id !== exerciseId),
      updatedAt: new Date().toISOString()
    });
  };

  const reorderExercisesInWorkout = (workoutId: string, startIndex: number, endIndex: number) => {
    if (!workout || workout.id !== workoutId) return;
    const list = [...workout.exercises];
    const [removed] = list.splice(startIndex, 1);
    list.splice(endIndex, 0, removed);
    saveWorkout.mutate({
      ...workout,
      exercises: list,
      updatedAt: new Date().toISOString()
    });
  };

  // ── Agrupamento Inteligente de Exercícios por Série ──

  const exerciseGroups = useMemo(() => {
    const groups: ExerciseGroupData[] = [];
    const exercises = workout.exercises;

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const startTimeFormatted = getExerciseStartTime(exercises, i);
      const item: GroupedExerciseItem = {
        exercise: ex,
        originalIndex: i,
        startTimeFormatted
      };

      const lastGroup = groups[groups.length - 1];

      // Determina se este exercício faz parte do grupo anterior
      const belongsToLastGroup =
        lastGroup &&
        ((ex.setId && lastGroup.items[0].exercise.setId && ex.setId === lastGroup.items[0].exercise.setId) ||
          (ex.name.trim().toLowerCase() === lastGroup.groupName.trim().toLowerCase() &&
            ex.executionType === lastGroup.executionType &&
            (ex.totalSets !== undefined || ex.setNumber !== undefined || lastGroup.items[0].exercise.totalSets !== undefined)));

      if (belongsToLastGroup) {
        lastGroup.items.push(item);
        lastGroup.isGroup = true;
      } else {
        groups.push({
          key: ex.setId || `grp-${ex.id}-${i}`,
          isGroup: false,
          groupName: ex.name,
          focusNotes: ex.focusNotes,
          executionType: ex.executionType,
          catalogId: ex.catalogId,
          items: [item]
        });
      }
    }

    return groups;
  }, [workout.exercises]);

  // ── Ações em Grupos de Séries ──

  const handleMoveGroupUp = (groupIdx: number) => {
    if (groupIdx <= 0) return;
    const newGroups = [...exerciseGroups];
    const [movedGroup] = newGroups.splice(groupIdx, 1);
    newGroups.splice(groupIdx - 1, 0, movedGroup);

    const flattened = newGroups.flatMap(g => g.items.map(item => item.exercise));
    saveWorkout.mutate({
      ...workout,
      exercises: flattened,
      updatedAt: new Date().toISOString()
    });
  };

  const handleMoveGroupDown = (groupIdx: number) => {
    if (groupIdx >= exerciseGroups.length - 1) return;
    const newGroups = [...exerciseGroups];
    const [movedGroup] = newGroups.splice(groupIdx, 1);
    newGroups.splice(groupIdx + 1, 0, movedGroup);

    const flattened = newGroups.flatMap(g => g.items.map(item => item.exercise));
    saveWorkout.mutate({
      ...workout,
      exercises: flattened,
      updatedAt: new Date().toISOString()
    });
  };

  const [deleteGroupTarget, setDeleteGroupTarget] = useState<ExerciseGroupData | null>(null);

  const confirmDeleteGroup = () => {
    if (!deleteGroupTarget) return;
    const idsToDelete = new Set(deleteGroupTarget.items.map(i => i.exercise.id));
    saveWorkout.mutate({
      ...workout,
      exercises: workout.exercises.filter(e => !idsToDelete.has(e.id)),
      updatedAt: new Date().toISOString()
    });
    setDeleteGroupTarget(null);
  };

  const handleAddSetToGroup = (group: ExerciseGroupData) => {
    const lastItem = group.items[group.items.length - 1].exercise;
    const newTotalSets = group.items.length + 1;
    const setId = group.items[0].exercise.setId || `set-grp-${Date.now()}`;

    const newExercise: Exercise = {
      ...lastItem,
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      setNumber: newTotalSets,
      totalSets: newTotalSets,
      setId
    };

    // Atualiza os exercícios existentes do grupo para terem o novo total de séries e setId
    const updatedExercises = workout.exercises.map(e => {
      const inGroup = group.items.some(i => i.exercise.id === e.id);
      if (inGroup) {
        return { ...e, totalSets: newTotalSets, setId };
      }
      return e;
    });

    // Insere logo após o último item deste grupo
    const lastIdx = group.items[group.items.length - 1].originalIndex;
    updatedExercises.splice(lastIdx + 1, 0, newExercise);

    saveWorkout.mutate({
      ...workout,
      exercises: updatedExercises,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteSetFromGroup = (exercise: Exercise, group: ExerciseGroupData) => {
    const remainingItems = group.items.filter(i => i.exercise.id !== exercise.id);
    const newTotalSets = remainingItems.length;

    const updatedExercises = workout.exercises
      .filter(e => e.id !== exercise.id)
      .map(e => {
        const remainingIdx = remainingItems.findIndex(i => i.exercise.id === e.id);
        if (remainingIdx !== -1) {
          return {
            ...e,
            setNumber: remainingIdx + 1,
            totalSets: newTotalSets > 1 ? newTotalSets : undefined,
            setId: newTotalSets > 1 ? e.setId : undefined
          };
        }
        return e;
      });

    saveWorkout.mutate({
      ...workout,
      exercises: updatedExercises,
      updatedAt: new Date().toISOString()
    });
  };

  // ── Form Modal state for adding/editing ──

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<Exercise | null>(null);

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formExecutionType, setFormExecutionType] = useState<'reps' | 'time'>('reps');

  // Single set fallback / Series state
  const [setsCount, setSetsCount] = useState<number>(1);
  const [seriesList, setSeriesList] = useState<SetConfig[]>([
    { reps: 10, workMinutes: 1, workSeconds: 0, restMinutes: 1, restSeconds: 0 }
  ]);

  const [formTargetReps, setFormTargetReps] = useState<number | ''>(10);
  const [workMinutes, setWorkMinutes] = useState<number>(1);
  const [workSeconds, setWorkSeconds] = useState<number>(0);
  const [restMinutes, setRestMinutes] = useState<number>(1);
  const [restSeconds, setRestSeconds] = useState<number>(0);

  const handleSetsCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    setSetsCount(validCount);

    setSeriesList(prev => {
      const baseReps = prev[0]?.reps ?? (typeof formTargetReps === 'number' ? formTargetReps : 10);
      const baseWorkMin = prev[0]?.workMinutes ?? workMinutes;
      const baseWorkSec = prev[0]?.workSeconds ?? workSeconds;
      const baseRestMin = prev[0]?.restMinutes ?? restMinutes;
      const baseRestSec = prev[0]?.restSeconds ?? restSeconds;

      const updated: SetConfig[] = [];
      for (let i = 0; i < validCount; i++) {
        if (prev[i]) {
          updated.push({ ...prev[i] });
        } else {
          updated.push({
            reps: baseReps,
            workMinutes: baseWorkMin,
            workSeconds: baseWorkSec,
            restMinutes: baseRestMin,
            restSeconds: baseRestSec
          });
        }
      }
      return updated;
    });
  };

  const updateSeriesItem = (index: number, updates: Partial<SetConfig>) => {
    setSeriesList(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updates };
      }
      return copy;
    });
  };

  const replicateFirstSetToAll = () => {
    if (!seriesList[0]) return;
    const first = seriesList[0];
    setSeriesList(prev => prev.map(() => ({ ...first })));
  };

  const handleSelectCatalogItem = (catId: string) => {
    setSelectedCatalogId(catId);
    const catItem = exerciseCatalog.find(c => c.id === catId);
    if (catItem) {
      setFormName(catItem.name);
      setFormNotes(catItem.focusNotes || '');
      setFormExecutionType(catItem.executionType);
      const isReps = catItem.executionType === 'reps';
      const targetRepsVal = isReps ? (catItem.defaultTargetReps || 10) : 10;
      setFormTargetReps(targetRepsVal);

      const workSecs = catItem.defaultWorkDurationSeconds || 60;
      const restSecs = catItem.defaultRestDurationSeconds || 60;
      const workMin = Math.floor(workSecs / 60);
      const workSec = workSecs % 60;
      const restMin = Math.floor(restSecs / 60);
      const restSec = restSecs % 60;

      setWorkMinutes(workMin);
      setWorkSeconds(workSec);
      setRestMinutes(restMin);
      setRestSeconds(restSec);

      // Atualiza primeira série
      setSeriesList(prev =>
        prev.map(s => ({
          ...s,
          reps: targetRepsVal,
          workMinutes: workMin,
          workSeconds: workSec,
          restMinutes: restMin,
          restSeconds: restSec
        }))
      );
    }
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
    setSetsCount(1);
    setSeriesList([
      { reps: 10, workMinutes: 1, workSeconds: 0, restMinutes: 1, restSeconds: 0 }
    ]);
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

    setSetsCount(1);
    setIsAdding(false);
  };

  const closeModal = () => {
    setEditingExercise(null);
    setIsAdding(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const isReps = formExecutionType === 'reps';

    if (isAdding) {
      if (setsCount > 1) {
        // Multi-set mode with independent repetitions and times
        const setsData = seriesList.map(s => {
          const workSecs = Math.max(5, s.workMinutes * 60 + s.workSeconds);
          const restSecs = Math.max(0, s.restMinutes * 60 + s.restSeconds);
          const repsVal = isReps && typeof s.reps === 'number' ? Math.max(1, s.reps) : undefined;
          return {
            targetReps: repsVal,
            workDurationSeconds: workSecs,
            restDurationSeconds: restSecs
          };
        });

        addExerciseSetsToWorkout(
          workout.id,
          {
            name: formName.trim(),
            focusNotes: formNotes.trim(),
            executionType: formExecutionType,
            catalogId: selectedCatalogId || undefined
          },
          setsData
        );
      } else {
        // Single set mode
        const totalWorkSecs = Math.max(5, workMinutes * 60 + workSeconds);
        const totalRestSecs = Math.max(0, restMinutes * 60 + restSeconds);
        const repsVal = isReps && typeof formTargetReps === 'number' ? Math.max(1, formTargetReps) : undefined;

        addExerciseToWorkout(workout.id, {
          name: formName.trim(),
          focusNotes: formNotes.trim(),
          executionType: formExecutionType,
          targetReps: repsVal,
          workDurationSeconds: totalWorkSecs,
          restDurationSeconds: totalRestSecs,
          catalogId: selectedCatalogId || undefined
        });
      }
    } else if (editingExercise) {
      const totalWorkSecs = Math.max(5, workMinutes * 60 + workSeconds);
      const totalRestSecs = Math.max(0, restMinutes * 60 + restSeconds);
      const repsVal = isReps && typeof formTargetReps === 'number' ? Math.max(1, formTargetReps) : undefined;

      updateExerciseInWorkout(workout.id, {
        ...editingExercise,
        name: formName.trim(),
        focusNotes: formNotes.trim(),
        executionType: formExecutionType,
        targetReps: repsVal,
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs,
        durationSeconds: totalWorkSecs + totalRestSecs,
        catalogId: selectedCatalogId || editingExercise.catalogId
      });
    }

    closeModal();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
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

      {/* Exercises List (Grouped by series when > 1 sets) */}
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
          exerciseGroups.map((group, groupIdx) => {
            // Se for um grupo com mais de 1 série, renderiza agrupado
            if (group.isGroup && group.items.length > 1) {
              return (
                <ExerciseGroupCard
                  key={group.key}
                  groupName={group.groupName}
                  focusNotes={group.focusNotes}
                  items={group.items}
                  isFirstGroup={groupIdx === 0}
                  isLastGroup={groupIdx === exerciseGroups.length - 1}
                  onMoveGroupUp={() => handleMoveGroupUp(groupIdx)}
                  onMoveGroupDown={() => handleMoveGroupDown(groupIdx)}
                  onDeleteGroup={() => setDeleteGroupTarget(group)}
                  onAddSetToGroup={() => handleAddSetToGroup(group)}
                  onEditSet={(ex) => openEditModal(ex)}
                  onDeleteSet={(ex) => handleDeleteSetFromGroup(ex, group)}
                />
              );
            }

            // Exercício individual isolado (1 série)
            const single = group.items[0];
            return (
              <ExerciseCard
                key={single.exercise.id}
                exercise={single.exercise}
                index={single.originalIndex}
                startTimeFormatted={single.startTimeFormatted}
                showActions
                isFirst={single.originalIndex === 0}
                isLast={single.originalIndex === workout.exercises.length - 1}
                onMoveUp={() => reorderExercisesInWorkout(workout.id, single.originalIndex, single.originalIndex - 1)}
                onMoveDown={() => reorderExercisesInWorkout(workout.id, single.originalIndex, single.originalIndex + 1)}
                onEdit={() => openEditModal(single.exercise)}
                onDelete={() => setDeleteExerciseTarget(single.exercise)}
              />
            );
          })
        )}
      </div>

      {/* Form Modal (Add / Edit Exercise) */}
      <ModalBase isOpen={isAdding || editingExercise !== null} onClose={closeModal} maxWidth="md">
        <form onSubmit={handleSaveModal} className="space-y-4">
          <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center justify-between">
            <span>
              {isAdding
                ? 'Adicionar Exercício'
                : editingExercise?.setNumber && editingExercise?.totalSets
                ? `Editar Exercício (Série ${editingExercise.setNumber} de ${editingExercise.totalSets})`
                : 'Editar Exercício'}
            </span>
          </h3>

          <div className="space-y-4">
            {/* Escolha da Biblioteca Oficial */}
            <FormField label="Exercício da Biblioteca (Preenchimento Rápido)">
              <Select
                value={selectedCatalogId}
                onChange={e => handleSelectCatalogItem(e.target.value)}
              >
                <option value="">-- Exercício Livre / Personalizado --</option>
                {exerciseCatalog.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.executionType === 'reps' ? `${c.defaultTargetReps || 10} reps` : `${c.defaultWorkDurationSeconds}s`})
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

            {/* Configuração de Séries (Ao Adicionar Novo Exercício) */}
            {isAdding && (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Quantidade de Séries
                    </span>
                  </div>

                  {/* Contador de Séries */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSetsCountChange(setsCount - 1)}
                      disabled={setsCount <= 1}
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-amber-400 font-mono">
                      {setsCount} {setsCount === 1 ? 'série' : 'séries'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetsCountChange(setsCount + 1)}
                      disabled={setsCount >= 10}
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {setsCount > 1 && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2">
                    <span>Configure cada série de forma independente:</span>
                    <button
                      type="button"
                      onClick={replicateFirstSetToAll}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar repetições e tempos da Série 1 para todas as outras"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Série 1 p/ todas</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Single Set Form (Editing or 1 Set Mode) */}
            {(!isAdding || setsCount === 1) && (
              <div className="space-y-4">
                {formExecutionType === 'reps' ? (
                  <FormField label="Meta de Repetições">
                    <Input
                      type="number"
                      min="1"
                      required
                      value={formTargetReps}
                      onChange={e => setFormTargetReps(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                      placeholder="Ex: 30"
                      accentColor="purple"
                      className="font-bold text-sm"
                    />
                  </FormField>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tempo Execução (Minutos)">
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        required
                        value={workMinutes}
                        onChange={e => setWorkMinutes(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </FormField>
                    <FormField label="Tempo Execução (Segundos)">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        required
                        value={workSeconds}
                        onChange={e => setWorkSeconds(parseInt(e.target.value) || 0)}
                        placeholder="30"
                      />
                    </FormField>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Descanso (Minutos)">
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      required
                      value={restMinutes}
                      onChange={e => setRestMinutes(parseInt(e.target.value) || 0)}
                      placeholder="1"
                      accentColor="cyan"
                    />
                  </FormField>
                  <FormField label="Descanso (Segundos)">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={restSeconds}
                      onChange={e => setRestSeconds(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      accentColor="cyan"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Multi-Series Independent Configuration Cards */}
            {isAdding && setsCount > 1 && (
              <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-2.5">
                  {seriesList.slice(0, setsCount).map((setCfg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2.5 shadow-inner"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
                          SÉRIE {idx + 1} de {setsCount}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Duração: {formatSecondsToMMSS(
                            (formExecutionType === 'reps' ? 60 : (setCfg.workMinutes * 60 + setCfg.workSeconds)) +
                            (setCfg.restMinutes * 60 + setCfg.restSeconds)
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formExecutionType === 'reps' ? (
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                            <label className="block text-[11px] text-purple-300 font-bold flex items-center gap-1">
                              <Target className="w-3 h-3 text-purple-400" />
                              <span>Meta de Repetições</span>
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={setCfg.reps}
                              onChange={e => updateSeriesItem(idx, { reps: e.target.value === '' ? '' : parseInt(e.target.value) || 1 })}
                              placeholder="Ex: 30"
                              accentColor="purple"
                              className="font-bold text-xs"
                            />
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                            <label className="block text-[11px] text-amber-300 font-bold flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current text-amber-400" />
                              <span>Tempo de Execução</span>
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <Input
                                type="number"
                                min="0"
                                max="60"
                                value={setCfg.workMinutes}
                                onChange={e => updateSeriesItem(idx, { workMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="Min"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={setCfg.workSeconds}
                                onChange={e => updateSeriesItem(idx, { workSeconds: parseInt(e.target.value) || 0 })}
                                placeholder="Seg"
                              />
                            </div>
                          </div>
                        )}

                        {/* Descanso da Série */}
                        <div className="p-2 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-1">
                          <label className="block text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            <span>Descanso pós-série</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input
                              type="number"
                              min="0"
                              max="60"
                              value={setCfg.restMinutes}
                              onChange={e => updateSeriesItem(idx, { restMinutes: parseInt(e.target.value) || 0 })}
                              placeholder="Min"
                              accentColor="cyan"
                            />
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={setCfg.restSeconds}
                              onChange={e => updateSeriesItem(idx, { restSeconds: parseInt(e.target.value) || 0 })}
                              placeholder="Seg"
                              accentColor="cyan"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
            <Button type="button" variant="zinc" size="md" fullWidth onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" size="md" fullWidth icon={<Save className="w-4 h-4" />}>
              {isAdding && setsCount > 1 ? `Salvar ${setsCount} Séries` : 'Salvar'}
            </Button>
          </div>
        </form>
      </ModalBase>

      {/* Delete Single Exercise Confirmation Modal */}
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

      {/* Delete Entire Group Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteGroupTarget}
        title={`Excluir Grupo de ${deleteGroupTarget?.items.length} Séries?`}
        description={`Tem certeza que deseja remover todas as ${deleteGroupTarget?.items.length} séries de "${deleteGroupTarget?.groupName}" do seu treino?`}
        confirmLabel="Sim, Excluir Grupo"
        variant="danger"
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeleteGroupTarget(null)}
      />
    </div>
  );
};
