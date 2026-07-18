import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { TechnicalSkillDto } from '@/types/api';

interface SkillSearchPickerProps {
  skills: TechnicalSkillDto[];
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

export function SkillSearchPicker({ skills, selectedSkillIds, onToggle }: SkillSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id));
  const visibleSkills = skills
    .filter((skill) => {
      const term = query.trim().toLowerCase();
      return !term || skill.name.toLowerCase().includes(term) || skill.category.toLowerCase().includes(term);
    })
    .slice(0, 40);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline)] bg-white px-3 py-2 text-left text-sm text-[var(--md3-on-surface)] hover:border-[var(--md3-primary)]"
      >
        <span className="truncate">
          {selectedSkills.length > 0 ? `${selectedSkills.length} skill${selectedSkills.length === 1 ? '' : 's'} selected` : 'Search and select skills'}
        </span>
        <Search className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />
      </button>

      {selectedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => onToggle(skill.id)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2 py-1 text-xs text-[var(--md3-on-surface)]"
            >
              {skill.name}
              <X className="h-3 w-3 text-[var(--md3-on-surface-variant)]" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-11 z-20 rounded-xl border border-[var(--md3-outline-variant)] bg-white p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-[var(--md3-outline)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--md3-primary)]"
              placeholder="Search skills by name or category"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {visibleSkills.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[var(--md3-on-surface-variant)]">No skills found.</p>
            ) : (
              visibleSkills.map((skill) => {
                const selected = selectedSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onToggle(skill.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--md3-surface-variant)] ${
                      selected ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface)]'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{skill.name}</span>
                      <span className="block truncate text-xs text-[var(--md3-on-surface-variant)]">{skill.category}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
