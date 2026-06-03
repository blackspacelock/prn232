import { AlertTriangle, Check, Trash2, X } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative mx-4 w-full max-w-[560px] rounded-[28px] bg-white p-6"
        style={{ boxShadow: '0 6px 12px rgba(0,0,0,0.14)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
          </button>
        </div>

        {variant === 'danger' && (
          <div className="bg-[var(--md3-error-container)] border-l-4 border-[var(--md3-error)] rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--md3-error)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--md3-on-surface)] leading-relaxed">
                This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        <p className="text-sm text-[var(--md3-on-surface-variant)] mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <ActionButton
            icon={X}
            label={cancelLabel}
            variant="text"
            onClick={onCancel}
          />
          <ActionButton
            icon={variant === 'danger' ? Trash2 : Check}
            label={confirmLabel}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
