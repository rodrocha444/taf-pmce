import React, { useEffect } from 'react';

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 overscroll-contain animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full space-y-4 shadow-2xl my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain ${maxWidthStyles[maxWidth]}`}
      >
        {children}
      </div>
    </div>
  );
};
