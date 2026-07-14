import type { FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { ActionButton } from './ActionButton';

export type FormDialogField = {
  name: string;
  label: string;
  description?: string;
  type?: 'text' | 'number' | 'date' | 'url' | 'textarea' | 'select' | 'checkbox';
  options?: string[];
  placeholder?: string;
  defaultValue?: string | boolean;
  colSpan?: 1 | 2;
};

interface FormDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  notice?: string;
  fields: FormDialogField[];
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, string | boolean>) => void;
}

export function FormDialog({
  isOpen,
  title,
  description,
  notice,
  fields,
  submitLabel = 'Save',
  onCancel,
  onSubmit,
}: FormDialogProps) {
  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextValues = fields.reduce<Record<string, string | boolean>>((values, field) => {
      values[field.name] = field.type === 'checkbox'
        ? formData.get(field.name) === 'on'
        : String(formData.get(field.name) ?? '');
      return values;
    }, {});

    onSubmit(nextValues);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[560px] flex-col rounded-[28px] bg-white shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Header — always visible */}
        <div className="shrink-0 px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
            )}
            {notice && (
              <p className="mt-3 rounded-lg bg-[var(--md3-primary-container)] px-3 py-2 text-sm text-[var(--md3-on-primary-container)]">
                {notice}
              </p>
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

        {/* Scrollable fields area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const colSpan = field.colSpan === 2 ? 'md:col-span-2' : '';

            if (field.type === 'textarea') {
              return (
                <div key={field.name} className={`block ${colSpan}`}>
                  <label className="block space-y-1.5">
                    <span className="block text-sm font-semibold text-[var(--md3-on-surface)]">{field.label}</span>
                    {field.description && <span className="block text-xs leading-5 text-[var(--md3-on-surface-variant)]">{field.description}</span>}
                    <textarea
                      name={field.name}
                      className="md3-field min-h-24 w-full resize-none px-4 py-3"
                      placeholder={field.placeholder}
                      defaultValue={String(field.defaultValue ?? '')}
                    />
                  </label>
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.name} className={`block ${colSpan}`}>
                  <label className="block space-y-1.5">
                    <span className="block text-sm font-semibold text-[var(--md3-on-surface)]">{field.label}</span>
                    {field.description && <span className="block text-xs leading-5 text-[var(--md3-on-surface-variant)]">{field.description}</span>}
                    <select
                      name={field.name}
                      className="md3-field w-full px-4"
                      defaultValue={String(field.defaultValue ?? field.options?.[0] ?? '')}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            }

            if (field.type === 'checkbox') {
              return (
                <div key={field.name} className={`block ${colSpan}`}>
                  {field.description && <span className="mb-2 block text-xs leading-5 text-[var(--md3-on-surface-variant)]">{field.description}</span>}
                  <label className="flex h-14 items-center gap-3 rounded border border-[var(--md3-outline)] px-4">
                    <input
                      name={field.name}
                      type="checkbox"
                      defaultChecked={Boolean(field.defaultValue)}
                    />
                    <span className="text-sm font-medium text-[var(--md3-on-surface)]">{field.label}</span>
                  </label>
                </div>
              );
            }

            return (
              <div key={field.name} className={`block ${colSpan}`}>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-semibold text-[var(--md3-on-surface)]">{field.label}</span>
                  {field.description && <span className="block text-xs leading-5 text-[var(--md3-on-surface-variant)]">{field.description}</span>}
                  <input
                    name={field.name}
                    className="md3-field w-full px-4"
                    type={field.type ?? 'text'}
                    placeholder={field.placeholder}
                    defaultValue={String(field.defaultValue ?? '')}
                  />
                </label>
              </div>
            );
          })}
        </div>
        </div>

        {/* Footer — always visible */}
        <div className="shrink-0 px-6 pb-6 pt-4 flex justify-end gap-3">
          <ActionButton type="button" icon={X} label="Cancel" variant="text" onClick={onCancel} />
          <ActionButton type="submit" icon={Check} label={submitLabel} variant="primary" size="md" />
        </div>
      </form>
    </div>
  );
}
