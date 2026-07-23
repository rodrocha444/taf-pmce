import React from 'react';

export interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: 'amber' | 'cyan' | 'purple' | 'emerald';
}

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  icon,
  accentColor = 'amber'
}) => {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400'
  };

  return (
    <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{label}</span>
        <span className={`text-sm font-bold font-mono ${colorMap[accentColor]}`}>{value}</span>
      </div>
      {icon && <span className="opacity-80">{icon}</span>}
    </div>
  );
};
