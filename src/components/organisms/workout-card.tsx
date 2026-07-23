import React from 'react';
import type { Workout } from '../../types';
import { formatTimeHoursMins, getTotalWorkoutDuration } from '../../utils/formatters';
import { Dumbbell, Clock, Flame, CheckCircle2, Edit, Edit3, Trash2, Play } from 'lucide-react';
import { Card, Badge, Button } from '../atoms';

export interface WorkoutCardProps {
  workout: Workout;
  isActive: boolean;
  completionsCount: number;
  onSelect: () => void;
  onEditDetails: () => void;
  onEditExercises: () => void;
  onDelete: () => void;
  onStart: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  isActive,
  completionsCount,
  onSelect,
  onEditDetails,
  onEditExercises,
  onDelete,
  onStart
}) => {
  const totalDuration = getTotalWorkoutDuration(workout.exercises);

  return (
    <Card
      active={isActive}
      className="flex flex-col justify-between space-y-4 relative"
    >
      <div className="space-y-3">
        {/* Top Badges & Edit details/Delete */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="amber">★ Ativo</Badge>
            )}
            <Badge variant="purple">Personalizado</Badge>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onEditDetails}
              title="Editar título e descrição"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onDelete}
              title="Excluir treino"
              className="text-zinc-400 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white font-['Outfit'] line-clamp-1">{workout.title}</h3>
          {workout.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{workout.description}</p>
          )}
        </div>

        {/* Workout Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800/80">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <Dumbbell className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Blocos</span>
            <span className="text-xs font-bold text-white font-mono">{workout.exercises.length} ex</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <Clock className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Duração</span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {formatTimeHoursMins(totalDuration)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <Flame className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Treinos</span>
            <span className="text-xs font-bold text-white font-mono flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {completionsCount}x
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {!isActive ? (
          <Button
            type="button"
            variant="zinc"
            size="sm"
            onClick={onSelect}
          >
            Selecionar
          </Button>
        ) : (
          <span className="text-[11px] font-bold text-amber-400 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
            Treino Ativo
          </span>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="zinc"
            size="sm"
            onClick={onEditExercises}
            icon={<Edit3 className="w-3.5 h-3.5 text-amber-400" />}
          >
            Exercícios
          </Button>

          <Button
            type="button"
            variant="amber"
            size="sm"
            onClick={onStart}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Iniciar
          </Button>
        </div>
      </div>
    </Card>
  );
};
