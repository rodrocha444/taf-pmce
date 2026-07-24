import React, { useState, useEffect } from 'react';
import { CheckCircle2, SkipForward, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { ModalBase, Button } from '../atoms';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'emerald' | 'amber';
  countdownSeconds?: number;
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
  countdownSeconds,
  onConfirm,
  onCancel
}) => {
  const [countdown, setCountdown] = useState<number>(countdownSeconds || 0);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownSeconds || 0);
      return;
    }

    if (countdownSeconds && countdownSeconds > 0) {
      setCountdown(countdownSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [isOpen, countdownSeconds]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-6 h-6" />,
          btnVariant: 'emerald' as const
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <RotateCcw className="w-6 h-6" />,
          btnVariant: 'amber' as const
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          icon: <SkipForward className="w-6 h-6" />,
          btnVariant: 'amber' as const
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: countdown > 0 ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <Trash2 className="w-6 h-6" />,
          btnVariant: 'rose' as const
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} maxWidth="sm">
      <div className="text-center space-y-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white font-['Outfit']">{title}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
        </div>

        {countdown > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-medium flex items-center justify-center gap-2 animate-pulse">
            <span>⏳</span>
            <span>Aguarde <strong>{countdown}s</strong> para habilitar a confirmação.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="zinc"
            size="md"
            fullWidth
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={styles.btnVariant}
            size="md"
            fullWidth
            disabled={countdown > 0}
            onClick={onConfirm}
          >
            {countdown > 0 ? `${confirmLabel} (${countdown}s)` : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
};
