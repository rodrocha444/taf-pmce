import React from 'react';
import { Card, Button } from '../atoms';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <Card className="p-8 text-center space-y-3 bg-zinc-900/80">
      <div className="w-10 h-10 text-amber-400 mx-auto opacity-80 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white font-['Outfit']">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="amber"
          size="md"
          icon={actionIcon}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
