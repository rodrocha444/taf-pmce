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
    amber: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 font-bold',
    zinc: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold',
    rose: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold',
    purple: 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 font-bold',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 font-medium'
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
      className={`inline-flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
