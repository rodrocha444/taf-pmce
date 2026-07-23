import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: 'amber' | 'cyan' | 'purple';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  accentColor = 'amber',
  ...props
}, ref) => {
  const accentBorder: Record<string, string> = {
    amber: 'focus:border-amber-500',
    cyan: 'focus:border-cyan-500',
    purple: 'focus:border-purple-500'
  };

  return (
    <input
      ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none transition-colors text-xs ${accentBorder[accentColor]} ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
