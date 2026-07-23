import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Award, CheckCircle2, XCircle, ArrowLeft, Calendar, Clock, Trash2 } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { formatDate, formatTimeHoursMins } from '../utils/formatters';
import { ConfirmModal } from '../components/confirm-modal';

export const HistoryView: React.FC = () => {
  const navigate = useNavigate();
  const history = useWorkoutStore(state => state.history);
  const deleteHistoryLog = useWorkoutStore(state => state.deleteHistoryLog);
  const clearHistory = useWorkoutStore(state => state.clearHistory);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);

  const totalSessions = history.length;
  const completedCount = history.filter(h => h.status === 'completed').length;
  const totalSecondsTrained = history.reduce((acc, h) => acc + h.durationSeconds, 0);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h1 className="text-xl font-bold text-white font-['Outfit']">Histórico de Treinos</h1>

        {history.length > 0 ? (
          <button
            onClick={() => setShowClearAllModal(true)}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Limpar todo o histórico"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden xs:inline">Limpar</span>
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-1">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{completedCount}</span>
          <p className="text-[11px] text-zinc-400 uppercase font-bold">Concluídos</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{totalSessions}</span>
          <p className="text-[11px] text-zinc-400 uppercase font-bold">Total Iniciados</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-white font-mono">{formatTimeHoursMins(totalSecondsTrained)}</span>
          <p className="text-[11px] text-zinc-400 uppercase font-bold">Tempo Praticado</p>
        </div>
      </div>

      {/* History Log List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider px-1">Registros de Treino</h2>

        {history.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
            <History className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-300">Nenhum treino no histórico ainda</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Ao concluir um treino de 30 minutos ou encerrá-lo, seus registros aparecerão nesta tela.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
            >
              Iniciar Treino
            </button>
          </div>
        ) : (
          history.map(log => (
            <div
              key={log.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 group hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${log.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                  {log.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>

                <div className="truncate">
                  <h3 className="text-sm font-bold text-white truncate">{log.workoutTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {formatDate(log.date)}
                    </span>
                    <span>•</span>
                    <span>
                      {log.exercisesCompletedCount || 0} concluído(s)
                      {log.exercisesSkippedCount ? `, ${log.exercisesSkippedCount} pulado(s)` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 block">
                    {formatTimeHoursMins(log.realDurationSeconds || log.durationSeconds)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${log.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                    {log.status === 'completed' ? 'Concluído' : 'Interrompido'}
                  </span>
                </div>

                {/* Individual Delete Button */}
                <button
                  onClick={() => setDeleteTargetId(log.id)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 active:scale-95 transition-all"
                  title="Excluir este registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Modal: Delete Single Log */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Excluir Registro?"
        description="Tem certeza que deseja apagar este registro de treino do histórico?"
        confirmLabel="Sim, Excluir"
        variant="danger"
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Custom Modal: Clear All History */}
      <ConfirmModal
        isOpen={showClearAllModal}
        title="Limpar Todo o Histórico?"
        description="Esta ação apagar de forma definitiva TODOS os treinos registrados no seu histórico."
        confirmLabel="Sim, Apagar Tudo"
        variant="danger"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearAllModal(false)}
      />
    </div>
  );
};
