import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormDialog, type FormDialogField } from '../../components/FormDialog';
import { Calendar, Filter, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { appToast } from '../../components/AppToast';

interface Trend {
  skill: string;
  region: string;
  score: number;
  source: string;
  date: string;
}

const initialTrends: Trend[] = [
  { skill: 'React', region: 'Vietnam', score: 98, source: 'LinkedIn', date: 'Jun 3, 2026' },
  { skill: 'Python', region: 'Vietnam', score: 90, source: 'TopCV', date: 'Jun 3, 2026' },
  { skill: 'Node.js', region: 'Vietnam', score: 88, source: 'TopCV', date: 'Jun 2, 2026' },
  { skill: 'TypeScript', region: 'Vietnam', score: 85, source: 'LinkedIn', date: 'Jun 2, 2026' },
  { skill: 'Docker', region: 'Vietnam', score: 82, source: 'LinkedIn', date: 'Jun 1, 2026' },
  { skill: 'Kubernetes', region: 'Vietnam', score: 78, source: 'TopCV', date: 'Jun 1, 2026' },
];

export function AdminJobTrendsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trends, setTrends] = useState<Trend[]>(initialTrends);
  const [editingTrend, setEditingTrend] = useState<Trend | null>(null);
  const [deleteTrend, setDeleteTrend] = useState<Trend | null>(null);

  const trendFields: FormDialogField[] = [
    { name: 'skill', label: 'Tech Skill', defaultValue: editingTrend?.skill ?? '' },
    { name: 'source', label: 'Source', defaultValue: editingTrend?.source ?? 'LinkedIn' },
    { name: 'region', label: 'Region', defaultValue: editingTrend?.region ?? 'Vietnam' },
    { name: 'score', label: 'Trend Score', type: 'number', defaultValue: String(editingTrend?.score ?? 80) },
    { name: 'date', label: 'Snapshot Date', defaultValue: editingTrend?.date ?? 'Jun 3, 2026' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  ];

  return (
    <AppShell breadcrumb="Admin / Job Trends">
      <div className="app-page">
        <PageHeader
          title="Job Trends"
          description="Manage market demand data used by recommendations."
          actions={
          <AdminActionButton
            icon={Plus}
            label="New Trend"
            variant="primary"
            size="md"
            onClick={() => {
              setEditingTrend(null);
              setDialogOpen(true);
            }}
          />
          }
        />

        <div className="md3-panel flex flex-wrap gap-3 p-4">
          <select className="md3-field min-w-[180px] px-4"><option>Vietnam</option><option>Global</option></select>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
            <input className="md3-field w-[220px] pl-12 pr-4" placeholder="Skill keyword" />
          </div>
          {['From date', 'To date'].map((label) => (
            <div key={label} className="relative">
              <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
              <input className="md3-field w-[150px] pl-12 pr-4" placeholder={label} />
            </div>
          ))}
          <AdminActionButton icon={Filter} label="Apply" variant="primary" size="md" />
          <AdminActionButton icon={RotateCcw} label="Reset" variant="neutral" size="md" />
        </div>

        <div className="md3-card overflow-hidden">
          <table className="md3-data-table">
            <thead className="bg-[var(--md3-surface-container)] text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
              <tr>
                {['Tech Skill', 'Region', 'Score', 'Source', 'Snapshot Date', 'Actions'].map((heading) => (
                  <th key={heading} className="border-b-2 border-[var(--md3-outline-variant)] px-6 py-4 text-left">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trends.map((trend, index) => (
                <tr key={trend.skill} className={`border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)] ${index === 0 ? 'border-l-4 border-l-[var(--md3-primary)]' : ''} ${index % 2 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{trend.skill}</td>
                  <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{trend.region}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{trend.score}</p>
                    <div className="mt-1 h-1 w-[60px] rounded-full bg-[var(--md3-outline-variant)]"><div className="h-full rounded-full bg-[var(--md3-primary)]" style={{ width: `${trend.score}%` }} /></div>
                  </td>
                  <td className="px-6 py-4"><span className="rounded bg-[var(--md3-primary-container)] px-2 py-1 font-mono text-xs text-[var(--md3-primary)]">{trend.source}</span></td>
                  <td className="px-6 py-4 text-xs text-[var(--md3-on-surface-variant)]">{trend.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                    <AdminActionButton
                      icon={Pencil}
                      label="Edit"
                      onClick={() => {
                        setEditingTrend(trend);
                        setDialogOpen(true);
                      }}
                    />
                    <AdminActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="danger"
                      onClick={() => setDeleteTrend(trend)}
                    />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormDialog
        isOpen={dialogOpen}
        title={editingTrend ? 'Edit Job Trend' : 'Create Job Trend'}
        description="Record a market demand signal."
        fields={trendFields}
        onCancel={() => {
          setDialogOpen(false);
          setEditingTrend(null);
        }}
        onSubmit={(values) => {
          const nextTrend: Trend = {
            skill: String(values.skill || 'New Skill'),
            source: String(values.source || 'LinkedIn'),
            region: String(values.region || 'Vietnam'),
            score: Number(values.score || 80),
            date: String(values.date || 'Today'),
          };

          if (editingTrend) {
            setTrends(trends.map((trend) => (
              trend === editingTrend ? nextTrend : trend
            )));
            appToast.success('Trend updated');
          } else {
            setTrends([nextTrend, ...trends]);
            appToast.success('Trend created');
          }

          setDialogOpen(false);
          setEditingTrend(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteTrend !== null}
        title="Delete Job Trend?"
        message={`This removes ${deleteTrend?.skill ?? 'this trend'} from market recommendations.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTrend) {
            setTrends(trends.filter((trend) => trend !== deleteTrend));
            appToast.success('Trend deleted');
          }
          setDeleteTrend(null);
        }}
        onCancel={() => setDeleteTrend(null)}
      />
    </AppShell>
  );
}

