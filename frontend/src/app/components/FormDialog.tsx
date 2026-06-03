import type { FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { ActionButton } from './ActionButton';

export type FormDialogField = {
  name: string;
  label: string;
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
  fields: FormDialogField[];
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, string | boolean>) => void;
}

export function FormDialog({
  isOpen,
  title,
  description,
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
      <form onSubmit={handleSubmit} className="w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const colSpan = field.colSpan === 2 ? 'md:col-span-2' : '';

            if (field.type === 'textarea') {
              return (
                <label key={field.name} className={`block ${colSpan}`}>
                  <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">
                    {field.label}
                  </span>
                  <textarea
                    name={field.name}
                    className="md3-field min-h-24 w-full resize-none px-4 py-3"
                    placeholder={field.placeholder}
                    defaultValue={String(field.defaultValue ?? '')}
                  />
                </label>
              );
            }

            if (field.type === 'select') {
              return (
                <label key={field.name} className={`block ${colSpan}`}>
                  <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">
                    {field.label}
                  </span>
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
              );
            }

            if (field.type === 'checkbox') {
              return (
                <label
                  key={field.name}
                  className={`flex h-14 items-center gap-3 rounded border border-[var(--md3-outline)] px-4 ${colSpan}`}
                >
                  <input
                    name={field.name}
                    type="checkbox"
                    defaultChecked={Boolean(field.defaultValue)}
                  />
                  <span className="text-sm font-medium text-[var(--md3-on-surface)]">{field.label}</span>
                </label>
              );
            }

            return (
              <label key={field.name} className={`block ${colSpan}`}>
                <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">
                  {field.label}
                </span>
                <input
                  name={field.name}
                  className="md3-field w-full px-4"
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  defaultValue={String(field.defaultValue ?? '')}
                />
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <ActionButton type="button" icon={X} label="Cancel" variant="text" onClick={onCancel} />
          <ActionButton type="submit" icon={Check} label={submitLabel} variant="primary" size="md" />
        </div>
      </form>
    </div>
  );
}
