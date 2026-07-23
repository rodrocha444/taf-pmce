import React from 'react';
import type { ExerciseCatalogItem } from '../../types';
import { Target, Play, Edit2, Trash2 } from 'lucide-react';
import { Card, Badge, Button } from '../atoms';

export interface ExerciseCatalogCardProps {
  item: ExerciseCatalogItem;
  logs: any[];
  maxVal: number;
  formatDate: (dateStr: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ExerciseCatalogCard: React.FC<ExerciseCatalogCardProps> = ({
  item,
  logs,
  maxVal,
  formatDate,
  onEdit,
  onDelete
}) => {
  const isReps = item.executionType === 'reps';

  return (
    <Card className="flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all">
      <div className="space-y-3">
        {/* 1. Header: Exec Type Badge + Name + Actions */}
        <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div>
            <Badge
              variant={isReps ? 'purple' : 'amber'}
              icon={isReps ? <Target className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            >
              {isReps ? 'Por Repetições' : 'Por Tempo (Isometria)'}
            </Badge>

            <h3 className="text-base font-bold text-white mt-1 font-['Outfit']">{item.name}</h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onEdit}
              title="Editar exercício"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onDelete}
              title="Excluir exercício"
              className="text-zinc-500 hover:text-rose-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 2. Informação / Instruções sobre o exercício */}
        {item.focusNotes && (
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Instruções de Execução / Técnica TAF
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {item.focusNotes}
            </p>
          </div>
        )}

        {/* 3. Histórico de Evolução */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Histórico de Evolução {isReps ? '(Repetições)' : '(Tempo Isométrico)'}
            </span>
            {maxVal > 0 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                PR Atual: {maxVal} {isReps ? 'reps' : 's'}
              </span>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/50 text-center">
              <p className="text-[11px] text-zinc-500 italic">Nenhum registro de execução ainda neste exercício.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
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
    </Card>
  );
};
