import { AppShell, PageHeader } from '../../components/AppShell';
import { Check } from 'lucide-react';

const statuses = [
  { label: 'Not Started', value: 0, fill: '#F1F3F4', text: '#5F6368', stroke: '#DADCE0' },
  { label: 'In Progress', value: 1, fill: '#E8F0FE', text: '#1A73E8', stroke: '#4285F4' },
  { label: 'Paused', value: 2, fill: '#FEF7E0', text: '#E37400', stroke: '#FBBC04' },
  { label: 'Skipped', value: 3, fill: '#F3E8FD', text: '#7B1FA2', stroke: '#AB47BC' },
  { label: 'Done', value: 4, fill: '#E6F4EA', text: '#1E8E3E', stroke: '#34A853' },
];

const states = [
  { label: 'Default', status: statuses[0], note: 'Notes disabled until a progress state is selected.', button: 'Save progress', disabled: true },
  { label: 'Changed', status: statuses[1], note: 'Studying React components, props, and state this week.', button: 'Save progress', disabled: false },
  { label: 'Saved', status: statuses[1], note: 'Progress updated and reflected in the roadmap header.', button: 'Saved', disabled: false },
];

export function NodeProgressReferencePage() {
  return (
    <AppShell breadcrumb="Node Progress Reference" showProgress={{ current: 19, total: 24, percentage: 79 }}>
      <div className="app-page">
        <PageHeader
          title="Node Progress - Interaction States"
          description="Three states of the node detail drawer and its canvas node styling."
        />

        <div className="desktop-grid-3">
          {states.map((state) => (
            <section key={state.label} className="md3-card p-6">
              <p className="mb-4 text-[11px] font-medium uppercase text-[var(--md3-primary)]">{state.label}</p>
              <div className="mb-5 rounded-xl border-2 p-4" style={{ backgroundColor: state.status.fill, borderColor: state.status.stroke }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-[var(--md3-on-surface)]">React</h2>
                    <p className="font-mono text-[11px]" style={{ color: state.status.text }}>frontend.core.react</p>
                  </div>
                  {state.status.value !== 0 && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: state.status.stroke }} />}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--md3-outline)] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-[var(--md3-on-surface)]">React</h3>
                  <span className="rounded-lg px-2 py-1 text-xs font-medium" style={{ backgroundColor: state.status.fill, color: state.status.text }}>{state.status.label}</span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {statuses.slice(0, 4).map((status) => (
                    <button
                      key={status.label}
                      className="rounded-full border px-3 py-2 text-xs font-medium"
                      style={{
                        backgroundColor: status.label === state.status.label ? status.fill : 'white',
                        borderColor: status.label === state.status.label ? status.stroke : '#DADCE0',
                        color: status.label === state.status.label ? status.text : '#5F6368',
                      }}
                    >
                      {status.label === state.status.label && <Check className="mr-1 inline h-3 w-3" />}
                      {status.label}
                    </button>
                  ))}
                </div>
                <textarea className="mb-4 min-h-24 w-full resize-none rounded border-2 border-[var(--md3-outline)] px-4 py-3 text-sm outline-none focus:border-[var(--md3-primary)]" disabled={state.disabled} value={state.note} readOnly />
                <button disabled={state.disabled} className="w-full rounded-full bg-[var(--md3-primary)] py-2.5 font-medium text-white disabled:bg-[var(--md3-surface-variant)] disabled:text-[var(--md3-outline)]">
                  {state.button}
                </button>
              </div>
            </section>
          ))}
        </div>

        <section className="md3-card p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--md3-on-surface)]">Status Reference</h2>
          <table className="md3-data-table">
            <thead className="bg-[var(--md3-surface-container)] text-left text-sm font-medium text-[var(--md3-on-surface-variant)]">
              <tr><th className="p-3">Status</th><th className="p-3">Int</th><th className="p-3">Fill</th><th className="p-3">Text</th><th className="p-3">Stroke</th></tr>
            </thead>
            <tbody>
              {statuses.map((status) => (
                <tr key={status.label} className="border-b border-[var(--md3-outline-variant)]">
                  <td className="p-3 text-sm font-medium">{status.label}</td>
                  <td className="p-3 font-mono text-sm">{status.value}</td>
                  <td className="p-3"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: status.fill }} />{status.fill}</td>
                  <td className="p-3">{status.text}</td>
                  <td className="p-3">{status.stroke}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
