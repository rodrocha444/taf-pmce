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
      className={`rounded-3xl p-5 border transition-all duration-300 backdrop-blur-md ${
        active
          ? 'bg-gradient-to-br from-amber-500/15 via-zinc-900/95 to-zinc-950 border-amber-500/70 shadow-xl shadow-amber-500/20 ring-1 ring-amber-500/40'
          : 'bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5'
      } ${
        hoverable ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
