import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Save, X } from 'lucide-react';
import { AdminActionButton } from '../AdminActionButton';

interface AdminFormDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  submitIcon?: LucideIcon;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

interface AdminFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export function AdminField({ label, description, required = false, children }: AdminFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-[var(--md3-on-surface)]">
        {label}
        {required && <span className="ml-1 text-[var(--md3-error)]">*</span>}
      </span>
      {description && <span className="block text-xs leading-5 text-[var(--md3-on-surface-variant)]">{description}</span>}
      {children}
    </label>
  );
}

export function AdminFormDialog({
  isOpen,
  title,
  description,
  children,
  submitLabel = 'Save',
  submitIcon = Save,
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
  onCancel,
}: AdminFormDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[720px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--md3-outline-variant)] px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--md3-outline-variant)] px-6 py-4">
          <AdminActionButton icon={X} label="Cancel" variant="tonal" onClick={onCancel} />
          <AdminActionButton
            icon={submitIcon}
            label={isSubmitting ? 'Saving...' : submitLabel}
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
