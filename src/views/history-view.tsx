import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Trash2, 
  BarChart3, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Check,
  X
} from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatDate, formatTimeHoursMins, formatSecondsToMMSS } from '../utils/formatters';
import { ConfirmModal } from '../components/confirm-modal';
import type { ExerciseEvolutionLog } from '../types';

export const HistoryView: React.FC = () => {
  const navigate = useNavigate();
  const history = useWorkoutStore(state => state.history || []);
  const workouts = useWorkoutStore(state => state.workouts || []);
  const deleteHistoryLog = useWorkoutStore(state => state.deleteHistoryLog);
  const clearHistory = useWorkoutStore(state => state.clearHistory);
  const addManualHistoryLog = useWorkoutStore(state => state.addManualHistoryLog);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Manual Workout Log Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(workouts[0]?.id || '');
  const [durationMins, setDurationMins] = useState('28');
  const [durationSecs, setDurationSecs] = useState('30');
  
  // Selected workout exercises execution status and reps tracking
  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId) || workouts[0];
  const [exerciseStatusMap, setExerciseStatusMap] = useState<Record<string, { completed: boolean; reps: string; timeSecs: string }>>({});

  // Initialize or reset exercise tracking when modal opens or workout changes
  const handleOpenManualModal = () => {
    if (!selectedWorkout) return;
    const initialMap: Record<string, { completed: boolean; reps: string; timeSecs: string }> = {};
    selectedWorkout.exercises.forEach(ex => {
      initialMap[ex.id] = {
        completed: true,
        reps: ex.targetReps ? String(ex.targetReps) : '10',
        timeSecs: String(ex.workDurationSeconds || 60)
      };
    });
    setExerciseStatusMap(initialMap);
    setShowManualModal(true);
  };

  const handleWorkoutChange = (wId: string) => {
    setSelectedWorkoutId(wId);
    const targetW = workouts.find(w => w.id === wId);
    if (!targetW) return;
    const initialMap: Record<string, { completed: boolean; reps: string; timeSecs: string }> = {};
    targetW.exercises.forEach(ex => {
      initialMap[ex.id] = {
        completed: true,
        reps: ex.targetReps ? String(ex.targetReps) : '10',
        timeSecs: String(ex.workDurationSeconds || 60)
      };
    });
    setExerciseStatusMap(initialMap);
  };

  const handleConfirmSingleDelete = () => {
    if (deleteTargetId) {
      deleteHistoryLog(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleConfirmClearAll = () => {
    clearHistory();
    setShowClearAllModal(false);
  };

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkout) return;

    const durSecsVal = (parseInt(durationMins) || 0) * 60 + (parseInt(durationSecs) || 0);
    let completedCount = 0;
    let skippedCount = 0;
    const exerciseStatusesRecord: Record<number, 'completed' | 'skipped'> = {};

    const exerciseLogs: ExerciseEvolutionLog[] = selectedWorkout.exercises.map((ex, idx) => {
      const state = exerciseStatusMap[ex.id] || { completed: true, reps: String(ex.targetReps || 10), timeSecs: String(ex.workDurationSeconds || 60) };
      const status: 'completed' | 'skipped' = state.completed ? 'completed' : 'skipped';
      
      exerciseStatusesRecord[idx] = status;
      if (state.completed) completedCount++;
      else skippedCount++;

      const isReps = ex.executionType === 'reps' || (ex.targetReps !== undefined && ex.targetReps > 0);

      return {
        id: `ex-log-${Date.now()}-${idx}`,
        workoutId: selectedWorkout.id,
        exerciseId: ex.id,
        exerciseName: ex.name,
        category: ex.category || 'outros',
        executionType: isReps ? 'reps' : 'time',
        targetReps: ex.targetReps,
        completedReps: state.completed && isReps ? (parseInt(state.reps) || ex.targetReps || 10) : 0,
        workDurationSeconds: ex.workDurationSeconds || 60,
        realWorkSeconds: state.completed ? (parseInt(state.timeSecs) || ex.workDurationSeconds || 60) : 0,
        status,
        timestamp: new Date().toISOString()
      };
    });

    addManualHistoryLog({
      workoutId: selectedWorkout.id,
      workoutTitle: selectedWorkout.title,
      date: new Date().toISOString(),
      durationSeconds: durSecsVal,
      realDurationSeconds: durSecsVal,
      exercisesCompletedCount: completedCount,
      exercisesSkippedCount: skippedCount,
      totalExercisesCount: selectedWorkout.exercises.length,
      status: 'completed',
      exerciseStatuses: exerciseStatusesRecord,
      exerciseLogs
    });

    setShowManualModal(false);
  };

  const totalSessions = history.length;
  const completedCountTotal = history.filter(h => h.status === 'completed').length;
  const totalSecondsTrained = history.reduce((acc, h) => acc + (h.realDurationSeconds || h.durationSeconds || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 hover:border-amber-500/30 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Relatórios</span>
          </button>
        </div>

        <button
          onClick={handleOpenManualModal}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Treino</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Total Sessões</span>
          <strong className="text-xl font-black text-white font-mono">{totalSessions}</strong>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Concluídas</span>
          <strong className="text-xl font-black text-emerald-400 font-mono">{completedCountTotal}</strong>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Tempo Total</span>
          <strong className="text-xl font-black text-amber-400 font-mono">
            {formatTimeHoursMins(totalSecondsTrained)}
          </strong>
        </div>
      </div>

      {/* Main History Logs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Sessões Registradas ({history.length})
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="text-xs font-bold text-rose-400 hover:underline"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum Treino no Histórico</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Seus treinos finalizados no timer ou registrados manualmente aparecerão aqui com a evolução de repetições e tempos.
            </p>
            <button
              onClick={handleOpenManualModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Treino Manual</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(log => {
              const isExpanded = expandedLogId === log.id;
              const hasExLogs = log.exerciseLogs && log.exerciseLogs.length > 0;

              return (
                <div
                  key={log.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          log.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">{formatDate(log.date)}</span>
                      </div>

                      <h3 className="text-base font-bold text-white font-['Outfit']">{log.workoutTitle}</h3>

                      <div className="flex items-center gap-4 text-xs font-mono pt-0.5">
                        <span className="text-amber-400 font-bold">
                          ⏱ {formatSecondsToMMSS(log.realDurationSeconds || log.durationSeconds)}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          ✓ {log.exercisesCompletedCount}/{log.totalExercisesCount} Exercícios
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasExLogs && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1.5 text-amber-400 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-mono font-bold"
                          title="Ver evolução dos exercícios"
                        >
                          <span>Exercícios</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteTargetId(log.id)}
                        className="p-2 text-zinc-600 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Exercise Evolution Logs */}
                  {isExpanded && hasExLogs && (
                    <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 font-mono text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                        Evolução de Repetições e Tempos Executados
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {log.exerciseLogs?.map(exLog => (
                          <div
                            key={exLog.id}
                            className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-white font-bold block font-sans text-xs">{exLog.exerciseName}</span>
                              <span className="text-[10px] text-zinc-400 uppercase">{exLog.category}</span>
                            </div>

                            <div className="text-right">
                              {exLog.executionType === 'reps' ? (
                                <span className="text-amber-400 font-bold text-xs block">
                                  {exLog.completedReps || 0} reps
                                </span>
                              ) : (
                                <span className="text-cyan-400 font-bold text-xs block">
                                  {formatSecondsToMMSS(exLog.realWorkSeconds || exLog.workDurationSeconds)}
                                </span>
                              )}
                              <span className={`text-[10px] ${exLog.status === 'completed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {exLog.status === 'completed' ? '✓ Concluído' : '✗ Pulado'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR TREINO MANULMENTE */}
      {showManualModal && selectedWorkout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveManualLog}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">Registrar Treino Concluído</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Select Workout */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Selecione o Treino Executado</label>
              <select
                value={selectedWorkoutId}
                onChange={e => handleWorkoutChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold focus:outline-none"
              >
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.exercises.length} exercícios)
                  </option>
                ))}
              </select>
            </div>

            {/* Total Duration Inputs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tempo Total Real Gasto (Minutos : Segundos)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  value={durationMins}
                  onChange={e => setDurationMins(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs font-bold"
                  placeholder="Min"
                />
                <span className="text-zinc-500 font-bold">:</span>
                <input
                  type="number"
                  required
                  value={durationSecs}
                  onChange={e => setDurationSecs(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs font-bold"
                  placeholder="Seg"
                />
              </div>
            </div>

            {/* Exercises Reps & Time Checklist */}
            <div className="space-y-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Exercícios & Repetições Atingidas
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedWorkout.exercises.map(ex => {
                  const state = exerciseStatusMap[ex.id] || { completed: true, reps: String(ex.targetReps || 10), timeSecs: String(ex.workDurationSeconds || 60) };
                  const isReps = ex.executionType === 'reps' || (ex.targetReps !== undefined && ex.targetReps > 0);

                  return (
                    <div
                      key={ex.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        state.completed 
                          ? 'bg-zinc-900 border-zinc-800' 
                          : 'bg-zinc-900/40 border-zinc-800/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setExerciseStatusMap(prev => ({
                              ...prev,
                              [ex.id]: { ...state, completed: !state.completed }
                            }));
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold transition-colors ${
                            state.completed ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {state.completed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                        </button>

                        <div>
                          <span className="font-bold text-white block truncate">{ex.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {isReps ? `Meta: ${ex.targetReps || 10} reps` : `Tempo: ${ex.workDurationSeconds}s`}
                          </span>
                        </div>
                      </div>

                      {state.completed && (
                        <div className="flex items-center gap-1 font-mono shrink-0">
                          {isReps ? (
                            <>
                              <input
                                type="number"
                                value={state.reps}
                                onChange={e => {
                                  const val = e.target.value;
                                  setExerciseStatusMap(prev => ({
                                    ...prev,
                                    [ex.id]: { ...state, reps: val }
                                  }));
                                }}
                                className="w-14 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-bold text-center"
                              />
                              <span className="text-[10px] text-zinc-400">reps</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                value={state.timeSecs}
                                onChange={e => {
                                  const val = e.target.value;
                                  setExerciseStatusMap(prev => ({
                                    ...prev,
                                    [ex.id]: { ...state, timeSecs: val }
                                  }));
                                }}
                                className="w-14 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-cyan-400 font-bold text-center"
                              />
                              <span className="text-[10px] text-zinc-400">seg</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 font-black"
              >
                Salvar Treino
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Single Delete Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Excluir Registro do Histórico"
        description="Tem certeza que deseja excluir esta sessão do histórico?"
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Confirm Clear All Modal */}
      <ConfirmModal
        isOpen={showClearAllModal}
        title="Limpar Todo o Histórico de Treinos"
        description="Tem certeza que deseja apagar todo o histórico de treinos de força? Esta ação não pode ser desfeita."
        confirmLabel="Limpar Tudo"
        variant="danger"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearAllModal(false)}
      />
    </div>
  );
};
