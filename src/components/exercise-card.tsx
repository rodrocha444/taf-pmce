import React from 'react';
import type { Exercise } from '../types';
import { formatSecondsToMMSS } from '../utils/formatters';
import { Flame, ShieldAlert, Activity, BicepsFlexed, Play, Coffee, Target } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  startTimeFormatted: string;
  isCurrent?: boolean;
  status?: 'completed' | 'skipped';
  onSelect?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  startTimeFormatted,
  isCurrent = false,
  status,
  onSelect,
  showActions = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}) => {
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'barra':
        return <BicepsFlexed className="w-4 h-4 text-amber-400" />;
      case 'abdominal':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'flexao':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'perna':
        return <Flame className="w-4 h-4 text-emerald-400" />;
      case 'isometria':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const workSecs = exercise.workDurationSeconds || 60;
  const restSecs = exercise.restDurationSeconds || 60;

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-2xl p-4 transition-all duration-200 border ${
        isCurrent
          ? 'bg-zinc-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
      } ${onSelect ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Time Stamp & Number Badge */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center min-w-[58px] shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Início</span>
            <span className="text-xs font-mono font-bold text-amber-400">{startTimeFormatted}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">#{index + 1}</span>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                {exercise.name}
              </h3>
              {status === 'completed' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  ✓ Concluído
                </span>
              )}
              {status === 'skipped' && (
                <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                  ⏭ Pulado
                </span>
              )}
            </div>
            {exercise.focusNotes && (
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                {exercise.focusNotes}
              </p>
            )}
          </div>
        </div>

        {/* Reps, Work vs Rest Split Badges */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
          {exercise.executionType === 'reps' || (exercise.targetReps !== undefined && exercise.targetReps > 0) ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-mono font-bold text-purple-300" title="Modo: Por Repetição">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>{exercise.targetReps} reps</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-300" title="Modo: Por Tempo de Execução">
              <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>{formatSecondsToMMSS(workSecs)}</span>
            </div>
          )}

          {/* Rest Duration Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono font-bold text-cyan-400" title="Tempo de Descanso">
            <Coffee className="w-3 h-3 text-cyan-400" />
            <span>{formatSecondsToMMSS(restSecs)}</span>
          </div>

          {exercise.category && (
            <div className="hidden xs:flex items-center gap-1 text-[11px] font-medium text-zinc-400 capitalize pl-1">
              {getCategoryIcon(exercise.category)}
            </div>
          )}
        </div>
      </div>

      {/* Editor Mobile Actions (if enabled) */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isFirst}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-700 active:scale-95 font-medium"
            >
              ▲ Subir
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-700 active:scale-95 font-medium"
            >
              ▼ Descer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold hover:bg-amber-500/20 active:scale-95"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold hover:bg-rose-500/20 active:scale-95"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
