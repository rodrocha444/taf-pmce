import React from 'react';

export type BadgeVariant = 'amber' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'orange' | 'zinc';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'zinc',
  icon,
  className = '',
  title
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    zinc: 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300'
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
