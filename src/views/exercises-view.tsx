import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft, 
  BookOpen
} from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import type { ExerciseCatalogItem, ExerciseExecutionType } from '../types';
import { ConfirmModal } from '../components/confirm-modal';

export const ExercisesView: React.FC = () => {
  const navigate = useNavigate();
  const exerciseCatalog = useWorkoutStore(state => state.exerciseCatalog || []);
  const addCatalogExercise = useWorkoutStore(state => state.addCatalogExercise);
  const deleteCatalogExercise = useWorkoutStore(state => state.deleteCatalogExercise);

  // Modals state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ExerciseCatalogItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ExerciseCatalogItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [executionType, setExecutionType] = useState<ExerciseExecutionType>('reps');
  const [defaultTargetReps, setDefaultTargetReps] = useState<number | ''>(20);
  const [workMins, setWorkMins] = useState(1);
  const [workSecs, setWorkSecs] = useState(0);
  const [restMins, setRestMins] = useState(1);
  const [restSecs, setRestSecs] = useState(0);
  const [focusNotes, setFocusNotes] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setExecutionType('reps');
    setDefaultTargetReps(20);
    setWorkMins(1);
    setWorkSecs(0);
    setRestMins(1);
    setRestSecs(0);
    setFocusNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: ExerciseCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setExecutionType(item.executionType);
    setDefaultTargetReps(item.defaultTargetReps ?? 20);

    const workTotal = item.defaultWorkDurationSeconds || 60;
    setWorkMins(Math.floor(workTotal / 60));
    setWorkSecs(workTotal % 60);

    const restTotal = item.defaultRestDurationSeconds || 60;
    setRestMins(Math.floor(restTotal / 60));
    setRestSecs(restTotal % 60);

    setFocusNotes(item.focusNotes || '');
    setShowModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalWorkSecs = Math.max(5, workMins * 60 + workSecs);
    const totalRestSecs = Math.max(0, restMins * 60 + restSecs);
    const isReps = executionType === 'reps';
    const repsVal = isReps && typeof defaultTargetReps === 'number' ? Math.max(1, defaultTargetReps) : undefined;

    if (editingItem) {
      // update item in catalog state
      useWorkoutStore.setState(state => ({
        exerciseCatalog: (state.exerciseCatalog || []).map(c => 
          c.id === editingItem.id ? {
            ...c,
            name: name.trim(),
            executionType,
            defaultTargetReps: repsVal,
            defaultWorkDurationSeconds: totalWorkSecs,
            defaultRestDurationSeconds: totalRestSecs,
            focusNotes: focusNotes.trim()
          } : c
        )
      }));
    } else {
      addCatalogExercise({
        name: name.trim(),
        executionType,
        defaultTargetReps: repsVal,
        defaultWorkDurationSeconds: totalWorkSecs,
        defaultRestDurationSeconds: totalRestSecs,
        focusNotes: focusNotes.trim()
      });
    }

    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetItem) {
      deleteCatalogExercise(deleteTargetItem.id);
      setDeleteTargetItem(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/workouts')}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Treinos</span>
        </button>

        <h1 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>Biblioteca de Exercícios</span>
        </h1>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Criar Exercício</span>
        </button>
      </div>

      {/* Exercises List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exerciseCatalog.map(item => {
          const isReps = item.executionType === 'reps' || (item.defaultTargetReps !== undefined && item.defaultTargetReps > 0);

          return (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3.5 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">{item.name}</h3>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Editar exercício"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!item.isDefault && (
                      <button
                        onClick={() => setDeleteTargetItem(item)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Excluir exercício"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Properties Badge */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/80 text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-sans uppercase block">Execução</span>
                    <strong className="text-amber-400 font-bold">
                      {isReps ? `${item.defaultTargetReps || 10} reps` : `${item.defaultWorkDurationSeconds}s`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[9px] text-zinc-500 font-sans uppercase block">Tempo</span>
                    <strong className="text-white font-bold">{item.defaultWorkDurationSeconds}s</strong>
                  </div>

                  <div>
                    <span className="text-[9px] text-zinc-500 font-sans uppercase block">Descanso</span>
                    <strong className="text-cyan-400 font-bold">{item.defaultRestDurationSeconds}s</strong>
                  </div>
                </div>

                {item.focusNotes && (
                  <p className="text-xs text-zinc-400 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40">
                    💡 {item.focusNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">
                {editingItem ? 'Editar Exercício da Biblioteca' : 'Criar Exercício Independente'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Nome do Exercício</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                placeholder="ex: Flexão 90º com Apoio"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tipo de Execução</label>
              <select
                value={executionType}
                onChange={e => setExecutionType(e.target.value as ExerciseExecutionType)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold focus:outline-none"
              >
                <option value="reps">Por Repetições</option>
                <option value="time">Por Tempo (Isometria)</option>
              </select>
            </div>

            {executionType === 'reps' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Meta Padrão de Repetições</label>
                <input
                  type="number"
                  min="1"
                  value={defaultTargetReps}
                  onChange={e => setDefaultTargetReps(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-mono font-bold"
                  placeholder="20"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Tempo de Execução Padrão</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={workMins}
                    onChange={e => setWorkMins(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="1"
                  />
                  <span className="text-zinc-500 font-bold">:</span>
                  <input
                    type="number"
                    value={workSecs}
                    onChange={e => setWorkSecs(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Tempo de Descanso Padrão</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={restMins}
                    onChange={e => setRestMins(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="1"
                  />
                  <span className="text-zinc-500 font-bold">:</span>
                  <input
                    type="number"
                    value={restSecs}
                    onChange={e => setRestSecs(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Instruções / Dicas de Execução TAF</label>
              <textarea
                rows={2}
                value={focusNotes}
                onChange={e => setFocusNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none"
                placeholder="ex: Manter cotovelos rente ao corpo na descida"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 font-black"
              >
                Salvar no Catálogo
              </button>
            </div>
          </form>
        </div>
      )}

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
