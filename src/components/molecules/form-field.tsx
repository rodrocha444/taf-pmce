import React from 'react';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  hint,
  action
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-300">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
};
