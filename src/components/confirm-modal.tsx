import React from 'react';
import { CheckCircle2, SkipForward, Trash2, RotateCcw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'emerald' | 'amber';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-6 h-6" />,
          btn: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/30'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <RotateCcw className="w-6 h-6" />,
          btn: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/30'
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          icon: <SkipForward className="w-6 h-6" />,
          btn: 'bg-orange-500 hover:bg-orange-400 text-zinc-950 shadow-orange-500/30'
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <Trash2 className="w-6 h-6" />,
          btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-zinc-400">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 active:scale-95 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-3 rounded-xl font-bold text-xs active:scale-95 shadow-lg transition-all cursor-pointer ${styles.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
