import React, { useState } from 'react';
import type { Exercise } from '../../types';
import { formatSecondsToMMSS } from '../../utils/formatters';
import { Play, Coffee, Target, Layers, Plus, Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge, Button } from '../atoms';

export interface GroupedExerciseItem {
  exercise: Exercise;
  originalIndex: number;
  startTimeFormatted: string;
}

export interface ExerciseGroupCardProps {
  groupName: string;
  focusNotes?: string;
  items: GroupedExerciseItem[];
  isFirstGroup: boolean;
  isLastGroup: boolean;
  onMoveGroupUp: () => void;
  onMoveGroupDown: () => void;
  onDeleteGroup: () => void;
  onAddSetToGroup: () => void;
  onEditSet: (exercise: Exercise) => void;
  onDeleteSet: (exercise: Exercise) => void;
}

export const ExerciseGroupCard: React.FC<ExerciseGroupCardProps> = ({
  groupName,
  focusNotes,
  items,
  isFirstGroup,
  isLastGroup,
  onMoveGroupUp,
  onMoveGroupDown,
  onDeleteGroup,
  onAddSetToGroup,
  onEditSet,
  onDeleteSet,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const totalSets = items.length;
  const totalDurationSeconds = items.reduce((acc, item) => acc + item.exercise.durationSeconds, 0);
  const firstStartTime = items[0]?.startTimeFormatted || '00:00';

  return (
    <Card className="relative p-4 border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 transition-all space-y-3">
      {/* Group Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-start gap-3">
          {/* Group Icon Badge */}
          <div className="flex flex-col items-center justify-center px-2.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center min-w-[58px] shrink-0">
            <Layers className="w-4 h-4 text-purple-400 mb-0.5" />
            <span className="text-[10px] font-mono font-bold text-purple-300">
              {totalSets}x
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">
                {groupName}
              </h3>
              <Badge variant="purple" icon={<Layers className="w-3 h-3 text-purple-400" />}>
                {totalSets} {totalSets === 1 ? 'Série' : 'Séries Agrupadas'}
              </Badge>
              <Badge variant="zinc">
                Início {firstStartTime} • Total {formatSecondsToMMSS(totalDurationSeconds)}
              </Badge>
            </div>
            {focusNotes && (
              <p className="text-xs text-zinc-400 line-clamp-2">
                {focusNotes}
              </p>
            )}
          </div>
        </div>

        {/* Group Controls (Collapse & Add Set) */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="zinc"
            size="xs"
            icon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
            onClick={onAddSetToGroup}
            title="Adicionar mais uma série a este grupo"
          >
            + Série
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher séries' : 'Expandir séries'}
          >
            {isExpanded ? 'Recolher' : 'Ver Séries'}
          </Button>
        </div>
      </div>

      {/* Expanded Nested Sets List */}
      {isExpanded && (
        <div className="space-y-2 pt-1">
          {items.map((item, idx) => {
            const ex = item.exercise;
            const setNum = idx + 1;
            const workSecs = ex.workDurationSeconds || 60;
            const restSecs = ex.restDurationSeconds || 60;
            const isItemReps = ex.executionType === 'reps' || (ex.targetReps !== undefined && ex.targetReps > 0);

            return (
              <div
                key={ex.id}
                className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                {/* Left: Set number & Timing */}
                <div className="flex items-center gap-2.5">
                  <div className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-center font-mono shrink-0">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Série {setNum}</span>
                    <span className="text-[10px] text-zinc-500 block">#{item.originalIndex + 1}</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-300">
                        Início às {item.startTimeFormatted}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono block">
                      Duração: {formatSecondsToMMSS(ex.durationSeconds)} ({formatSecondsToMMSS(workSecs)} ação + {formatSecondsToMMSS(restSecs)} descanso)
                    </span>
                  </div>
                </div>

                {/* Right: Badges & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  {/* Reps/Time & Rest Badges */}
                  <div className="flex items-center gap-1.5">
                    {isItemReps ? (
                      <Badge variant="purple" icon={<Target className="w-3 h-3 text-purple-400" />}>
                        {ex.targetReps} reps
                      </Badge>
                    ) : (
                      <Badge variant="amber" icon={<Play className="w-3 h-3 fill-current text-amber-400" />}>
                        {formatSecondsToMMSS(workSecs)}
                      </Badge>
                    )}

                    <Badge variant="cyan" icon={<Coffee className="w-3 h-3 text-cyan-400" />}>
                      {formatSecondsToMMSS(restSecs)}
                    </Badge>
                  </div>

                  {/* Actions for this specific set */}
                  <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                    <Button
                      type="button"
                      variant="zinc"
                      size="xs"
                      onClick={() => onEditSet(ex)}
                      title="Editar esta série individualmente"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden xs:inline">Editar</span>
                    </Button>

                    <Button
                      type="button"
                      variant="rose"
                      size="xs"
                      onClick={() => onDeleteSet(ex)}
                      title="Excluir apenas esta série"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Bottom Bar: Move Group & Delete Entire Group */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="zinc"
            size="xs"
            disabled={isFirstGroup}
            onClick={onMoveGroupUp}
          >
            ▲ Subir Grupo
          </Button>
          <Button
            type="button"
            variant="zinc"
            size="xs"
            disabled={isLastGroup}
            onClick={onMoveGroupDown}
          >
            ▼ Descer Grupo
          </Button>
        </div>

        <Button
          type="button"
          variant="rose"
          size="xs"
          onClick={onDeleteGroup}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir Grupo Inteiro ({totalSets}x)</span>
        </Button>
      </div>
    </Card>
  );
};
