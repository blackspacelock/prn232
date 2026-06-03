import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface CreateNodeDialogProps {
  isOpen: boolean;
  title?: string;
  onCancel: () => void;
  onSave: (nodeName: string) => void;
}

export function CreateNodeDialog({ isOpen, title = 'Create Node', onCancel, onSave }: CreateNodeDialogProps) {
  const [nodeName, setNodeName] = useState('New Learning Node');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">Define hierarchy metadata and starter resources.</p>
          </div>
          <button onClick={onCancel} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]" aria-label="Close dialog">
            <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className="md3-field px-4 md:col-span-2"
            placeholder="Node name"
            value={nodeName}
            onChange={(event) => setNodeName(event.target.value)}
          />
          <select className="md3-field px-4">
            <option>Internet Fundamentals</option>
            <option>HTML</option>
            <option>CSS</option>
          </select>
          <input className="md3-field px-4" placeholder="Order" defaultValue="4" />
          <textarea className="md3-field min-h-24 resize-none px-4 py-3 md:col-span-2" placeholder="Description" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <ActionButton icon={X} label="Cancel" variant="text" onClick={onCancel} />
          <ActionButton
            icon={Save}
            label="Save Node"
            variant="primary"
            size="md"
            onClick={() => {
              onSave(nodeName.trim() || 'New Learning Node');
              setNodeName('New Learning Node');
            }}
          />
        </div>
      </div>
    </div>
  );
}
