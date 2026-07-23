import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft, 
  BookOpen,
  Target,
  Play,
  TrendingUp
} from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import type { ExerciseCatalogItem, ExerciseExecutionType } from '../types';
import { ConfirmModal } from '../components/confirm-modal';
import { formatDate } from '../utils/formatters';

export const ExercisesView: React.FC = () => {
  const navigate = useNavigate();
  const exerciseCatalog = useWorkoutStore(state => state.exerciseCatalog || []);
  const addCatalogExercise = useWorkoutStore(state => state.addCatalogExercise);
  const deleteCatalogExercise = useWorkoutStore(state => state.deleteCatalogExercise);
  const history = useWorkoutStore(state => state.history || []);

  // Modals state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ExerciseCatalogItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ExerciseCatalogItem | null>(null);

  // Form State (Nome, Tipo de Execução, Informação sobre o exercício)
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

    setShowModal(false);
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

      {/* Exercises List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exerciseCatalog.map(item => {
          const { logs, maxVal } = getExerciseLogs(item.name);
          const isReps = item.executionType === 'reps';

          return (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* 1. Nome do Exercício + Tipo de Execução + Ações */}
                <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isReps 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isReps ? <Target className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                        {isReps ? 'Por Repetições' : 'Por Tempo (Isometria)'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1 font-['Outfit']">{item.name}</h3>
                  </div>

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

                {/* 2. Informação / Instruções sobre o exercício */}
                {item.focusNotes && (
                  <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                      Informação sobre o Exercício
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {item.focusNotes}
                    </p>
                  </div>
                )}

                {/* 3. Histórico de Repetições / Tempo */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Histórico de Evolução</span>
                    </span>

                    {maxVal > 0 && (
                      <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Recorde: {isReps ? `${maxVal} reps` : `${maxVal}s`} 🏆
                      </span>
                    )}
                  </div>

                  {logs.length === 0 ? (
                    <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/50 text-center">
                      <p className="text-[11px] text-zinc-500">Nenhum histórico registrado para este exercício.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {logs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono"
                        >
                          <span className="text-zinc-400 text-[11px]">{formatDate(log.date)}</span>
                          <span className="font-bold text-amber-400">
                            {log.value} {log.numVal === maxVal && '🏆'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL (Mantém apenas Nome, Tipo de Execução e Informações) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl"
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

            {/* 1. Nome do Exercício */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Nome do Exercício</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                placeholder="ex: Flexão de Braço no Solo"
              />
            </div>

            {/* 2. Tipo de Execução */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tipo de Execução</label>
              <select
                value={executionType}
                onChange={e => setExecutionType(e.target.value as ExerciseExecutionType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold focus:outline-none"
              >
                <option value="reps">Por Repetições (Contagem de reps)</option>
                <option value="time">Por Tempo (Isometria / Sustentação)</option>
              </select>
            </div>

            {/* 3. Informações / Instruções sobre o exercício */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Informação / Instruções sobre o Exercício</label>
              <textarea
                rows={3}
                value={focusNotes}
                onChange={e => setFocusNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="ex: Corpo alinhado, peito rente ao solo na descida e extensão total dos cotovelos."
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
