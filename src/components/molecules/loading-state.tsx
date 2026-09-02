import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  description?: string;
  cardCount?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  description = 'Sincronizando com o banco Turso...',
  cardCount = 3,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Central Loading Badge */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        <div>
          <p className="text-sm font-bold text-white tracking-tight">{message}</p>
          {description && <p className="text-xs text-zinc-400">{description}</p>}
        </div>
      </div>

      {/* Skeleton Cards */}
      <div className="space-y-3">
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 rounded bg-zinc-800" />
                  <div className="w-20 h-3 rounded bg-zinc-800/60" />
                </div>
              </div>
              <div className="w-16 h-6 rounded-lg bg-zinc-800/80" />
            </div>
            <div className="w-full h-12 rounded-xl bg-zinc-850/50" />
          </div>
        ))}
      </div>
    </div>
  );
};
