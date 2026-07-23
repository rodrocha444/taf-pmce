import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  active = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-3xl p-5 border transition-all ${
        active
          ? 'bg-zinc-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
          : 'bg-zinc-900/90 border-zinc-800'
      } ${
        hoverable ? 'hover:border-zinc-700 cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
