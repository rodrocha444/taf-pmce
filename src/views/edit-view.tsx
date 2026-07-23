import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Trash2, Edit2, Play, Coffee, Target, BookOpen } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import type { Exercise } from '../types';
import { formatSecondsToMMSS, getExerciseStartTime, getTotalWorkoutDuration } from '../utils/formatters';
import { ConfirmModal } from '../components/confirm-modal';

export const EditView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const workouts = useWorkoutStore(state => state.workouts);
  const exerciseCatalog = useWorkoutStore(state => state.exerciseCatalog || []);
  const setActiveWorkoutId = useWorkoutStore(state => state.setActiveWorkoutId);
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

  React.useEffect(() => {
    if (isAdding || editingExercise) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding, editingExercise]);

  const totalDuration = getTotalWorkoutDuration(workout.exercises);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={workout.id}
            onChange={e => setActiveWorkoutId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
          >
            {workouts.map(w => (
              <option key={w.id} value={w.id}>
                {w.title} ({w.exercises.length} ex)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Info Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{workout.title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Duração Total Atual: <strong className="text-amber-400 font-mono">{formatSecondsToMMSS(totalDuration)}</strong> ({workout.exercises.length} exercícios)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Exercício</span>
        </button>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        {workout.exercises.map((exercise, idx) => {
          const isRepsMode = exercise.executionType === 'reps' || (exercise.targetReps !== undefined && exercise.targetReps > 0);

          return (
            <div
              key={exercise.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Badge showing timestamp start */}
                <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs font-bold text-amber-400 shrink-0 text-center">
                  <span className="block text-[9px] text-zinc-400 uppercase font-sans">Início</span>
                  {getExerciseStartTime(workout.exercises, idx)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">#{idx + 1}</span>
                    <h3 className="text-sm font-bold text-white">{exercise.name}</h3>
                  </div>
                  {exercise.focusNotes && (
                    <p className="text-xs text-zinc-400 mt-0.5">{exercise.focusNotes}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {isRepsMode ? (
                      <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-lg border border-purple-500/30 flex items-center gap-1 font-bold">
                        <Target className="w-3 h-3 text-purple-400" />
                        {exercise.targetReps} reps
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1 font-bold">
                        <Play className="w-3 h-3 fill-current text-amber-400" />
                        Execução: {formatSecondsToMMSS(exercise.workDurationSeconds || 60)}
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      Descanso: {formatSecondsToMMSS(exercise.restDurationSeconds || 60)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 w-full sm:w-auto justify-end">
                <button
                  disabled={idx === 0}
                  onClick={() => reorderExercisesInWorkout(workout.id, idx, idx - 1)}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-20 text-xs font-bold"
                  title="Subir"
                >
                  ▲
                </button>
                <button
                  disabled={idx === workout.exercises.length - 1}
                  onClick={() => reorderExercisesInWorkout(workout.id, idx, idx + 1)}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-20 text-xs font-bold"
                  title="Descer"
                >
                  ▼
                </button>

                <button
                  onClick={() => openEditModal(exercise)}
                  className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 border border-amber-500/20"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Editar</span>
                </button>

                <button
                  onClick={() => setDeleteExerciseTarget(exercise)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold border border-rose-500/20"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal (Add / Edit Exercise) */}
      {(isAdding || editingExercise) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 overscroll-contain">
          <form
            onSubmit={handleSaveModal}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {isAdding ? 'Adicionar Novo Exercício' : 'Editar Exercício'}
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Seletor Único de Exercício da Biblioteca */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    Exercício
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/exercises')}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Biblioteca</span>
                  </button>
                </div>

                <select
                  required
                  value={selectedCatalogId}
                  onChange={e => handleSelectCatalogItem(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Selecionar Exercício da Biblioteca --</option>
                  {exerciseCatalog.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Foco / Observação (Ex: Cotovelos para trás)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ex: Foco TAF - Manter tronco firme"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Seletor de Tipo de Execução: Repetição vs Tempo */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">Modo do Exercício</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setFormExecutionType('reps')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formExecutionType === 'reps'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Por Repetição</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormExecutionType('time')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formExecutionType === 'time'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Por Tempo</span>
                  </button>
                </div>
              </div>

              {/* Input Condicional baseado no Modo Escolhido */}
              {formExecutionType === 'reps' ? (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <label className="block text-purple-300 font-bold flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Quantidade de Repetições (Reps)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={formTargetReps}
                    onChange={e => setFormTargetReps(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="Ex: 30"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-bold text-sm"
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
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={workMinutes}
                        onChange={e => setWorkMinutes(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={workSeconds}
                        onChange={e => setWorkSeconds(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-300/80">O cronômetro fará a contagem regressiva deste tempo de execução (isometria, prancha, corridas).</p>
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
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={restMinutes}
                      onChange={e => setRestMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Segundos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={restSeconds}
                      onChange={e => setRestSeconds(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>


            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20 flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
