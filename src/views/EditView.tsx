import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RotateCcw, Save, ArrowLeft, Trash2, Edit2, Play, Coffee } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import type { Exercise } from '../types';
import { formatSecondsToMMSS, getExerciseStartTime, getTotalWorkoutDuration } from '../utils/formatters';

export const EditView: React.FC = () => {
  const navigate = useNavigate();
  const workout = useWorkoutStore(state => state.getActiveWorkout());
  const resetDefaultWorkout = useWorkoutStore(state => state.resetDefaultWorkout);

  const addExerciseToWorkout = useWorkoutStore(state => state.addExerciseToWorkout);
  const updateExerciseInWorkout = useWorkoutStore(state => state.updateExerciseInWorkout);
  const deleteExerciseFromWorkout = useWorkoutStore(state => state.deleteExerciseFromWorkout);
  const reorderExercisesInWorkout = useWorkoutStore(state => state.reorderExercisesInWorkout);

  // Form Modal state for adding/editing
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const [formName, setFormName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [workMinutes, setWorkMinutes] = useState<number>(1);
  const [workSeconds, setWorkSeconds] = useState<number>(0);
  const [restMinutes, setRestMinutes] = useState<number>(1);
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<Exercise['category']>('outros');

  const openAddModal = () => {
    setEditingExercise(null);
    setFormName('');
    setFormNotes('');
    setWorkMinutes(1);
    setWorkSeconds(0);
    setRestMinutes(1);
    setRestSeconds(0);
    setFormCategory('outros');
    setIsAdding(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormNotes(exercise.focusNotes || '');

    const workTotal = exercise.workDurationSeconds || 60;
    setWorkMinutes(Math.floor(workTotal / 60));
    setWorkSeconds(workTotal % 60);

    const restTotal = exercise.restDurationSeconds || 60;
    setRestMinutes(Math.floor(restTotal / 60));
    setRestSeconds(restTotal % 60);

    setFormCategory(exercise.category || 'outros');
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

    if (isAdding) {
      addExerciseToWorkout(workout.id, {
        name: formName.trim(),
        focusNotes: formNotes.trim(),
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs,
        category: formCategory
      });
    } else if (editingExercise) {
      updateExerciseInWorkout(workout.id, {
        ...editingExercise,
        name: formName.trim(),
        focusNotes: formNotes.trim(),
        workDurationSeconds: totalWorkSecs,
        restDurationSeconds: totalRestSecs,
        durationSeconds: totalWorkSecs + totalRestSecs,
        category: formCategory
      });
    }

    closeModal();
  };

  const totalDuration = getTotalWorkoutDuration(workout.exercises);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h1 className="text-xl font-bold text-white font-['Outfit']">Editar Treino TAF</h1>

        <button
          onClick={() => {
            if (confirm('Restaurar o treino TAF PMCE com os 15 exercícios originais de 2 minutos (1 min Execução + 1 min Descanso)?')) {
              resetDefaultWorkout();
            }
          }}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1"
          title="Restaurar Padrão"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Restaurar TAF</span>
        </button>
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
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Exercício</span>
        </button>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        {workout.exercises.map((exercise, idx) => (
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
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    Execução: {formatSecondsToMMSS(exercise.workDurationSeconds || 60)}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
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
                onClick={() => {
                  if (confirm(`Remover "${exercise.name}"?`)) {
                    deleteExerciseFromWorkout(workout.id, exercise.id);
                  }
                }}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold border border-rose-500/20"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal (Add / Edit Exercise) */}
      {(isAdding || editingExercise) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              {isAdding ? 'Adicionar Novo Exercício' : 'Editar Exercício'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nome do Exercício</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Flexão Militar"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
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

              {/* Tempo de Execução */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <label className="block text-amber-400 font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
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
              </div>

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

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Categoria</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as Exercise['category'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 capitalize"
                >
                  <option value="barra">Barra Fixa</option>
                  <option value="abdominal">Abdominal</option>
                  <option value="flexao">Flexão</option>
                  <option value="perna">Pernas / Agachamento</option>
                  <option value="isometria">Isometria / Prancha</option>
                  <option value="outros">Outros</option>
                </select>
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
    </div>
  );
};
