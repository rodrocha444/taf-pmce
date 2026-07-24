import React from 'react';

export type ButtonVariant = 'amber' | 'zinc' | 'rose' | 'purple' | 'emerald' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'amber',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    amber: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]',
    zinc: 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 font-bold shadow-md hover:scale-[1.02]',
    rose: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold shadow-md shadow-rose-500/10 hover:scale-[1.02]',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 font-black hover:scale-[1.02]',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold shadow-md shadow-emerald-500/10 hover:scale-[1.02]',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 font-semibold'
  };

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-[11px] rounded-lg gap-1',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs rounded-xl gap-1.5',
    lg: 'px-5 py-3 text-sm rounded-2xl gap-2'
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
