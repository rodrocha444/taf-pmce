import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Play, Target, Copy } from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { useWorkouts, useSaveWorkout, useExerciseCatalog } from '../../hooks';
import type { Exercise, Workout } from '../../types';
import { getExerciseStartTime, formatSecondsToMMSS } from '../../utils/formatters';
import { ConfirmModal } from '../molecules';
import { Button, Input, Select, Badge } from '../atoms';
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
    { reps: '', workMinutes: 1, workSeconds: 0, restMinutes: 1, restSeconds: 0 }
  ]);

  const [formTargetReps, setFormTargetReps] = useState<number | ''>('');
  const [workMinutes, setWorkMinutes] = useState<number>(1);
  const [workSeconds, setWorkSeconds] = useState<number>(0);
  const [restMinutes, setRestMinutes] = useState<number>(1);
  const [restSeconds, setRestSeconds] = useState<number>(0);

  const handleSetsCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    setSetsCount(validCount);

    setSeriesList(prev => {
      const baseReps = prev[0]?.reps ?? (typeof formTargetReps === 'number' ? formTargetReps : '');
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
    if (!catId) {
      setFormName('');
      setFormNotes('');
      return;
    }
    const catItem = exerciseCatalog.find(c => c.id === catId);
    if (catItem) {
      setFormName(catItem.name);
      setFormNotes(catItem.focusNotes || '');
      setFormExecutionType(catItem.executionType);
      const isReps = catItem.executionType === 'reps';
      const targetRepsVal = isReps ? (catItem.defaultTargetReps ?? '') : '';
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
    setFormTargetReps('');
    setWorkMinutes(1);
    setWorkSeconds(0);
    setRestMinutes(1);
    setRestSeconds(0);
    setSetsCount(1);
    setSeriesList([
      { reps: '', workMinutes: 1, workSeconds: 0, restMinutes: 1, restSeconds: 0 }
    ]);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormNotes(exercise.focusNotes || '');

    const matchingCat = exerciseCatalog.find(c => c.id === exercise.catalogId || c.name.trim().toLowerCase() === exercise.name.trim().toLowerCase());
    setSelectedCatalogId(matchingCat ? matchingCat.id : '');

    const isReps = exercise.executionType === 'reps' || (exercise.targetReps !== undefined && exercise.targetReps > 0);
    setFormExecutionType(isReps ? 'reps' : 'time');
    setFormTargetReps(exercise.targetReps ?? '');

    const workTotal = exercise.workDurationSeconds || 60;
    const workMin = Math.floor(workTotal / 60);
    const workSec = workTotal % 60;
    const restTotal = exercise.restDurationSeconds || 60;
    const restMin = Math.floor(restTotal / 60);
    const restSec = restTotal % 60;

    setWorkMinutes(workMin);
    setWorkSeconds(workSec);
    setRestMinutes(restMin);
    setRestSeconds(restSec);

    setSetsCount(1);
    setSeriesList([
      { reps: exercise.targetReps ?? '', workMinutes: workMin, workSeconds: workSec, restMinutes: restMin, restSeconds: restSec }
    ]);
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const closeModal = () => {
    setEditingExercise(null);
    setIsAdding(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogId) return;

    const catItem = exerciseCatalog.find(c => c.id === selectedCatalogId);
    const exerciseName = formName.trim() || catItem?.name;
    if (!exerciseName) return;

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
            name: exerciseName,
            focusNotes: formNotes.trim() || catItem?.focusNotes || '',
            executionType: formExecutionType,
            catalogId: selectedCatalogId
          },
          setsData
        );
      } else {
        // Single set mode
        const totalWorkSecs = Math.max(5, workMinutes * 60 + workSeconds);
        const totalRestSecs = Math.max(0, restMinutes * 60 + restSeconds);
        const repsVal = isReps && typeof formTargetReps === 'number' ? Math.max(1, formTargetReps) : undefined;

        addExerciseToWorkout(workout.id, {
          name: exerciseName,
          focusNotes: formNotes.trim() || catItem?.focusNotes || '',
          executionType: formExecutionType,
          targetReps: repsVal,
          workDurationSeconds: totalWorkSecs,
          restDurationSeconds: totalRestSecs,
          catalogId: selectedCatalogId
        });
      }
    } else if (editingExercise) {
      const totalWorkSecs = Math.max(5, workMinutes * 60 + workSeconds);
      const totalRestSecs = Math.max(0, restMinutes * 60 + restSeconds);
      const repsVal = isReps && typeof formTargetReps === 'number' ? Math.max(1, formTargetReps) : undefined;

      updateExerciseInWorkout(workout.id, {
        ...editingExercise,
        name: exerciseName,
        focusNotes: formNotes.trim() || catItem?.focusNotes || '',
        executionType: formExecutionType,
        targetReps: repsVal,
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs,
        durationSeconds: totalWorkSecs + totalRestSecs,
        catalogId: selectedCatalogId
      });
    }

    closeModal();
  };

  // Tela de Criação / Edição de Exercício como Página Dedicada
  if (isAdding || editingExercise !== null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Top Header: Voltar | Título da tela | Salvar */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <Button
            type="button"
            variant="zinc"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={closeModal}
          >
            Voltar
          </Button>

          <div className="text-center px-2 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block font-mono">
              {isAdding ? 'Novo Exercício' : 'Editando Exercício'}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit'] truncate">
              {isAdding
                ? workout.title
                : editingExercise?.setNumber && editingExercise?.totalSets
                ? `${editingExercise.name} (Série ${editingExercise.setNumber}/${editingExercise.totalSets})`
                : editingExercise?.name || workout.title}
            </h2>
          </div>

          <Button
            type="submit"
            form="exercise-form"
            variant="amber"
            size="md"
            icon={<Save className="w-4 h-4" />}
            isLoading={saveWorkout.isPending}
            loadingText="Salvando..."
            disabled={!selectedCatalogId}
          >
            {isAdding && setsCount > 1 ? `Salvar (${setsCount})` : 'Salvar'}
          </Button>
        </div>

        <form id="exercise-form" onSubmit={handleSaveModal} className="space-y-6">
          {/* Seção 1: Seleção do Exercício da Biblioteca */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-[10px]">1</span>
              <span>Exercício da Biblioteca</span>
            </h3>

            <FormField label="Selecione o Exercício *">
              <Select
                required
                value={selectedCatalogId}
                onChange={e => handleSelectCatalogItem(e.target.value)}
              >
                <option value="" disabled>-- Selecione um Exercício da Biblioteca --</option>
                {exerciseCatalog.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            {selectedCatalogId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Modo de Execução:</span>
                <Badge
                  variant={formExecutionType === 'reps' ? 'purple' : 'amber'}
                  icon={formExecutionType === 'reps' ? <Target className="w-3.5 h-3.5 text-purple-400" /> : <Play className="w-3.5 h-3.5 fill-current text-amber-400" />}
                >
                  {formExecutionType === 'reps' ? 'Por Repetições' : 'Por Tempo (Isometria)'}
                </Badge>
              </div>
            )}

            <FormField label="Foco / Observação (Opcional)">
              <Input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Ex: Foco TAF - Cotovelos alinhados e tronco firme"
              />
            </FormField>
          </div>

          <div className="border-t border-zinc-800/80" />

          {/* Seção 2: Séries e Descanso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                <span>Séries & Tempos</span>
              </h3>

              {isAdding && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Total de séries:</span>
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSetsCountChange(setsCount - 1)}
                      disabled={setsCount <= 1}
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-amber-400 font-mono">
                      {setsCount}
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
              )}
            </div>

            {/* Single Set Form (Editing or 1 Set Mode) */}
            {(!isAdding || setsCount === 1) && (
              <div className="space-y-4">
                {formExecutionType === 'reps' ? (
                  <FormField label="Meta de Repetições (Opcional)">
                    <Input
                      type="number"
                      min="1"
                      value={formTargetReps}
                      onChange={e => setFormTargetReps(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                      placeholder="Ex: 30 (opcional)"
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
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 px-3 py-2 rounded-xl border border-zinc-800/80">
                  <span>Configure cada série individualmente:</span>
                  <button
                    type="button"
                    onClick={replicateFirstSetToAll}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Copiar repetições e tempos da Série 1 para todas as outras"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Série 1 p/ todas</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seriesList.slice(0, setsCount).map((setCfg, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
                          SÉRIE {idx + 1} de {setsCount}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Duração: {formatSecondsToMMSS(
                            (formExecutionType === 'reps' ? 60 : (setCfg.workMinutes * 60 + setCfg.workSeconds)) +
                            (setCfg.restMinutes * 60 + setCfg.restSeconds)
                          )}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {formExecutionType === 'reps' ? (
                          <FormField label="Meta de Repetições (Opcional)">
                            <Input
                              type="number"
                              min="1"
                              value={setCfg.reps}
                              onChange={e => updateSeriesItem(idx, { reps: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                              placeholder="Ex: 30 (opcional)"
                              accentColor="purple"
                              className="font-bold text-xs"
                            />
                          </FormField>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <FormField label="Tempo (Min)">
                              <Input
                                type="number"
                                min="0"
                                max="60"
                                value={setCfg.workMinutes}
                                onChange={e => updateSeriesItem(idx, { workMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="Min"
                              />
                            </FormField>
                            <FormField label="Tempo (Seg)">
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={setCfg.workSeconds}
                                onChange={e => updateSeriesItem(idx, { workSeconds: parseInt(e.target.value) || 0 })}
                                placeholder="Seg"
                              />
                            </FormField>
                          </div>
                        )}

                        {/* Descanso da Série */}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Descanso (Min)">
                            <Input
                              type="number"
                              min="0"
                              max="60"
                              value={setCfg.restMinutes}
                              onChange={e => updateSeriesItem(idx, { restMinutes: parseInt(e.target.value) || 0 })}
                              placeholder="Min"
                              accentColor="cyan"
                            />
                          </FormField>
                          <FormField label="Descanso (Seg)">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={setCfg.restSeconds}
                              onChange={e => updateSeriesItem(idx, { restSeconds: parseInt(e.target.value) || 0 })}
                              placeholder="Seg"
                              accentColor="cyan"
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="zinc"
              size="lg"
              fullWidth
              onClick={closeModal}
              disabled={saveWorkout.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="amber"
              size="lg"
              fullWidth
              isLoading={saveWorkout.isPending}
              loadingText="Salvando..."
              icon={<Save className="w-4 h-4" />}
            >
              {isAdding && setsCount > 1 ? `Salvar ${setsCount} Séries` : 'Salvar Exercício'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

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

      {/* Delete Single Exercise Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteExerciseTarget}
        title="Excluir Exercício?"
        description={`Tem certeza que deseja remover "${deleteExerciseTarget?.name}" da sua série de treino?`}
        confirmLabel="Sim, Remover"
        variant="danger"
        isLoading={saveWorkout.isPending}
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
        isLoading={saveWorkout.isPending}
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeleteGroupTarget(null)}
      />
    </div>
  );
};
