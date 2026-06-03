import { AppShell, PageHeader } from '../../components/AppShell';
import { AlertTriangle, Check, Code, MessageSquare, Rocket } from 'lucide-react';

const buttonVariants = [
  { label: 'Filled', className: 'bg-[var(--md3-primary)] text-white' },
  { label: 'Tonal', className: 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]' },
  { label: 'Outlined', className: 'border-2 border-[var(--md3-outline)] text-[var(--md3-primary)]' },
  { label: 'Text', className: 'text-[var(--md3-primary)]' },
  { label: 'Danger', className: 'bg-[var(--md3-error)] text-white' },
];

const chips = [
  ['Not Started', 'bg-[var(--md3-status-not-started-fill)] text-[var(--md3-status-not-started-text)]'],
  ['In Progress', 'bg-[var(--md3-status-in-progress-fill)] text-[var(--md3-status-in-progress-text)]'],
  ['Paused', 'bg-[var(--md3-status-paused-fill)] text-[var(--md3-status-paused-text)]'],
  ['Skipped', 'bg-[var(--md3-status-skipped-fill)] text-[var(--md3-status-skipped-text)]'],
  ['Done', 'bg-[var(--md3-status-completed-fill)] text-[var(--md3-status-completed-text)]'],
];

export function UIReferencePage() {
  return (
    <AppShell breadcrumb="UI Reference">
      <div className="app-page">
        <PageHeader
          title="UI States Reference"
          description="Shared components and states for implementation handoff."
        />

        <section className="desktop-grid-3">
          <EmptyState icon={Rocket} title="No roadmaps yet" action="Generate Roadmap" />
          <EmptyState icon={MessageSquare} title="Start a conversation" action="New Session" />
          <EmptyState icon={Code} title="No repositories yet" action="Link Repository" />
        </section>

        <section className="md3-card p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Skeleton Loaders</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-[var(--md3-outline)] p-5">
                <div className="mb-4 h-4 w-2/3 rounded bg-[var(--md3-surface-variant)]" />
                <div className="mb-3 h-9 w-1/3 rounded bg-[var(--md3-surface-variant)]" />
                <div className="h-2 w-full rounded bg-[var(--md3-surface-variant)]" />
              </div>
            ))}
          </div>
        </section>

        <section className="md3-card p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Text Fields</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {['Default', 'Focused', 'Filled', 'Disabled', 'Error', 'Hover'].map((label) => (
              <label key={label} className="block">
                <span className={`mb-1 block text-xs font-medium ${label === 'Error' ? 'text-[var(--md3-error)]' : 'text-[var(--md3-on-surface-variant)]'}`}>{label}</span>
                <input disabled={label === 'Disabled'} defaultValue={label === 'Filled' ? 'nguyen@fpt.edu.vn' : ''} className={`h-14 w-full rounded border-2 bg-white px-4 outline-none disabled:bg-[var(--md3-surface-variant)] ${label === 'Error' ? 'border-[var(--md3-error)]' : 'border-[var(--md3-outline)] focus:border-[var(--md3-primary)]'}`} placeholder="Email address" />
              </label>
            ))}
          </div>
        </section>

        <section className="md3-card p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            {buttonVariants.map((button) => (
              <button key={button.label} className={`rounded-full px-5 py-2.5 font-medium ${button.className}`}>{button.label}</button>
            ))}
            <button disabled className="rounded-full bg-[var(--md3-surface-variant)] px-5 py-2.5 font-medium text-[var(--md3-outline)]">Disabled</button>
          </div>
        </section>

        <section className="md3-card p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Status Chips</h2>
          <div className="flex flex-wrap gap-3">
            {chips.map(([label, className]) => (
              <span key={label} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${className}`}>{label}</span>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Edit Career Role</h2>
            <input className="mb-4 h-14 w-full rounded border-2 border-[var(--md3-outline)] px-4 outline-none focus:border-[var(--md3-primary)]" defaultValue="Backend Developer" />
            <textarea className="mb-5 min-h-24 w-full rounded border-2 border-[var(--md3-outline)] px-4 py-3 outline-none focus:border-[var(--md3-primary)]" defaultValue="Develop server-side services and APIs." />
            <div className="flex justify-end gap-3"><button className="rounded-full px-5 py-2.5 text-[var(--md3-primary)]">Cancel</button><button className="rounded-full bg-[var(--md3-primary)] px-5 py-2.5 text-white">Save</button></div>
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Delete Roadmap?</h2>
            <div className="mb-5 flex gap-3 rounded-lg bg-[var(--md3-error-container)] p-4 text-[var(--md3-error)]">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">This action removes the roadmap from the active template library.</p>
            </div>
            <div className="flex justify-end gap-3"><button className="rounded-full px-5 py-2.5 text-[var(--md3-primary)]">Cancel</button><button className="rounded-full bg-[var(--md3-error)] px-5 py-2.5 text-white">Delete</button></div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EmptyState({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action: string }) {
  return (
    <div className="rounded-xl border border-[var(--md3-outline)] bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--md3-surface-variant)]">
        <Icon className="h-8 w-8 text-[var(--md3-outline)]" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
      <p className="mb-5 text-sm text-[var(--md3-on-surface-variant)]">No data is available for this section.</p>
      <button className="inline-flex items-center gap-2 rounded-full bg-[var(--md3-primary)] px-5 py-2.5 font-medium text-white">
        <Check className="h-4 w-4" />
        {action}
      </button>
    </div>
  );
}
