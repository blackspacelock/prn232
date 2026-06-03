import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormDialog, type FormDialogField } from '../../components/FormDialog';
import { Check, GitBranch, GripVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { appToast } from '../../components/AppToast';

interface RoadmapTemplate {
  name: string;
  role: string;
  nodes: number;
  custom: boolean;
  created: string;
}

const initialRoadmaps: RoadmapTemplate[] = [
  { name: 'Frontend Developer Core', role: 'Frontend Developer', nodes: 24, custom: false, created: 'Feb 2, 2026' },
  { name: 'Backend Developer Core', role: 'Backend Developer', nodes: 26, custom: false, created: 'Feb 7, 2026' },
  { name: 'DevOps Engineer Sprint', role: 'DevOps Engineer', nodes: 21, custom: true, created: 'Mar 4, 2026' },
  { name: 'Full Stack Job Ready', role: 'Full Stack Developer', nodes: 32, custom: true, created: 'Mar 18, 2026' },
  { name: 'Mobile Foundations', role: 'Mobile Developer', nodes: 19, custom: false, created: 'Apr 9, 2026' },
];

const assignedNodes = ['Internet Fundamentals', 'HTML and semantic structure', 'CSS layout systems', 'React components', 'Testing basics'];
const availableNodes = ['TypeScript', 'State management', 'API integration', 'Deployment'];

export function AdminRoadmapTemplatesPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapTemplate[]>(initialRoadmaps);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<RoadmapTemplate | null>(null);
  const [deleteRoadmap, setDeleteRoadmap] = useState<RoadmapTemplate | null>(null);

  const roadmapFields: FormDialogField[] = [
    { name: 'name', label: 'Roadmap Name', defaultValue: editingRoadmap?.name ?? '', colSpan: 2 },
    {
      name: 'role',
      label: 'Career Role',
      type: 'select',
      options: ['Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Full Stack Developer', 'Mobile Developer'],
      defaultValue: editingRoadmap?.role ?? 'Frontend Developer',
    },
    { name: 'nodes', label: 'Nodes', type: 'number', defaultValue: String(editingRoadmap?.nodes ?? 24) },
    { name: 'custom', label: 'Custom roadmap', type: 'checkbox', defaultValue: editingRoadmap?.custom ?? false, colSpan: 2 },
  ];

  return (
    <AppShell breadcrumb="Admin / Roadmap Templates">
      <div className="app-page">
        <PageHeader
          title="Roadmap Templates"
          description="Manage reusable career roadmaps and node assignments."
          actions={
          <AdminActionButton
            icon={Plus}
            label="New Roadmap"
            variant="primary"
            size="md"
            onClick={() => {
              setEditingRoadmap(null);
              setDialogOpen(true);
            }}
          />
          }
        />

        <div className="md3-panel flex flex-wrap gap-3 p-4">
          <select className="md3-field min-w-[200px] px-4">
            <option>Career Role: All</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
          </select>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
            <input className="md3-field w-full pl-12 pr-4" placeholder="Search roadmaps..." />
          </div>
        </div>

        <div className="md3-card overflow-hidden">
          <table className="md3-data-table">
            <thead className="bg-[var(--md3-surface-container)] text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
              <tr>
                {['Roadmap Name', 'Career Role', 'Nodes', 'Custom', 'Created', 'Actions'].map((heading) => (
                  <th key={heading} className="border-b-2 border-[var(--md3-outline-variant)] px-6 py-4 text-left">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roadmaps.map((roadmap, index) => (
                <tr key={roadmap.name} className={`border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)] ${index % 2 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{roadmap.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{roadmap.role}</td>
                  <td className="px-6 py-4 text-sm text-[var(--md3-on-surface)]">{roadmap.nodes}</td>
                  <td className="px-6 py-4">{roadmap.custom ? <Check className="h-5 w-5 text-[var(--md3-success)]" /> : <span className="text-[var(--md3-outline)]">-</span>}</td>
                  <td className="px-6 py-4 text-xs text-[var(--md3-on-surface-variant)]">{roadmap.created}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminActionButton
                        icon={GitBranch}
                        label="Nodes"
                        onClick={() => setSheetOpen(true)}
                      />
                      <AdminActionButton
                        icon={Pencil}
                        label="Edit"
                        onClick={() => {
                          setEditingRoadmap(roadmap);
                          setDialogOpen(true);
                        }}
                      />
                      <AdminActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => setDeleteRoadmap(roadmap)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sheetOpen && (
        <aside className="fixed bottom-0 right-0 top-16 z-40 w-[380px] bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-[var(--md3-outline-variant)] p-6">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">Manage Nodes</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)]">Frontend Developer</p>
            </div>
            <button onClick={() => setSheetOpen(false)} className="rounded-full p-2 hover:bg-[var(--md3-surface-variant)]" aria-label="Close sheet">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-5 p-5">
            <section>
              <p className="mb-3 text-[11px] font-medium uppercase text-[var(--md3-on-surface-variant)]">Assigned Nodes ({assignedNodes.length})</p>
              <div className="space-y-2">
                {assignedNodes.map((node, index) => (
                  <div key={node} className="flex items-center gap-2 rounded-lg bg-[var(--md3-surface-container)] p-3">
                    <GripVertical className="h-4 w-4 text-[var(--md3-outline)]" />
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--md3-surface-variant)] text-xs">{index + 1}</span>
                    <span className="flex-1 text-sm text-[var(--md3-on-surface)]">{node}</span>
                    <X className="h-4 w-4 text-[var(--md3-on-surface-variant)]" />
                  </div>
                ))}
              </div>
            </section>
            <section className="border-t border-[var(--md3-outline-variant)] pt-5">
              <p className="mb-3 text-[11px] font-medium uppercase text-[var(--md3-on-surface-variant)]">Add Nodes</p>
              <input className="mb-3 h-10 w-full rounded border-2 border-[var(--md3-outline)] px-3 outline-none focus:border-[var(--md3-primary)]" placeholder="Search nodes..." />
              <div className="space-y-2">
                {availableNodes.map((node) => (
                  <div key={node} className="flex items-center justify-between rounded-lg p-2 hover:bg-[var(--md3-surface-variant)]">
                    <span className="text-sm">{node}</span>
                    <AdminActionButton
                      icon={Plus}
                      label="Add"
                      onClick={() => appToast.success(`${node} added to roadmap`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      )}

      <ConfirmDialog
        isOpen={deleteRoadmap !== null}
        title="Delete Roadmap?"
        message={`This removes ${deleteRoadmap?.name ?? 'this roadmap template'} from future generation flows.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteRoadmap) {
            setRoadmaps(roadmaps.filter((roadmap) => roadmap !== deleteRoadmap));
          }
          setDeleteRoadmap(null);
          appToast.success('Roadmap deleted');
        }}
        onCancel={() => setDeleteRoadmap(null)}
      />

      <FormDialog
        isOpen={dialogOpen}
        title={editingRoadmap ? 'Edit Roadmap Template' : 'Create Roadmap Template'}
        description="Manage reusable roadmap metadata before assigning nodes."
        fields={roadmapFields}
        onCancel={() => {
          setDialogOpen(false);
          setEditingRoadmap(null);
        }}
        onSubmit={(values) => {
          const nextRoadmap: RoadmapTemplate = {
            name: String(values.name || 'New Roadmap Template'),
            role: String(values.role || 'Frontend Developer'),
            nodes: Number(values.nodes || 24),
            custom: Boolean(values.custom),
            created: editingRoadmap?.created ?? 'Today',
          };

          if (editingRoadmap) {
            setRoadmaps(roadmaps.map((roadmap) => (
              roadmap === editingRoadmap ? nextRoadmap : roadmap
            )));
            appToast.success('Roadmap template updated');
          } else {
            setRoadmaps([nextRoadmap, ...roadmaps]);
            appToast.success('Roadmap template created');
          }

          setDialogOpen(false);
          setEditingRoadmap(null);
        }}
      />
    </AppShell>
  );
}

