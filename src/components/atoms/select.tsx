import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  accentColor?: 'amber' | 'cyan' | 'purple';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  children,
  className = '',
  accentColor = 'amber',
  ...props
}, ref) => {
  const accentBorder: Record<string, string> = {
    amber: 'focus:border-amber-500 text-amber-400',
    cyan: 'focus:border-cyan-500 text-cyan-400',
    purple: 'focus:border-purple-500 text-purple-400'
  };

  return (
    <select
      ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold focus:outline-none transition-colors cursor-pointer ${accentBorder[accentColor]} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
