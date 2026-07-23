import React from 'react';
import type { Exercise } from '../../types';
import { formatSecondsToMMSS } from '../../utils/formatters';
import { Play, Coffee, Target } from 'lucide-react';
import { Card, Badge, Button } from '../atoms';

export interface ExerciseCardProps {
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
  const workSecs = exercise.workDurationSeconds || 60;
  const restSecs = exercise.restDurationSeconds || 60;
  const isRepsMode = exercise.executionType === 'reps' || (exercise.targetReps !== undefined && exercise.targetReps > 0);

  return (
    <Card
      active={isCurrent}
      hoverable={!!onSelect}
      onClick={onSelect}
      className="relative group p-4"
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
                <Badge variant="emerald">✓ Concluído</Badge>
              )}
              {status === 'skipped' && (
                <Badge variant="orange">⏭ Pulado</Badge>
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
          {isRepsMode ? (
            <Badge variant="purple" icon={<Target className="w-3.5 h-3.5 text-purple-400" />} title="Modo: Por Repetição">
              {exercise.targetReps} reps
            </Badge>
          ) : (
            <Badge variant="amber" icon={<Play className="w-3.5 h-3.5 fill-current text-amber-400" />} title="Modo: Por Tempo de Execução">
              {formatSecondsToMMSS(workSecs)}
            </Badge>
          )}

          <Badge variant="cyan" icon={<Coffee className="w-3 h-3 text-cyan-400" />} title="Tempo de Descanso">
            {formatSecondsToMMSS(restSecs)}
          </Badge>
        </div>
      </div>

      {/* Editor Mobile Actions */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="zinc"
              size="xs"
              disabled={isFirst}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            >
              ▲ Subir
            </Button>
            <Button
              type="button"
              variant="zinc"
              size="xs"
              disabled={isLast}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            >
              ▼ Descer
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="amber"
              size="xs"
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="rose"
              size="xs"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            >
              Excluir
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
