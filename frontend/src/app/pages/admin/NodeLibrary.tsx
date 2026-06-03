import { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CreateNodeDialog } from '../../components/CreateNodeDialog';
import { FormDialog, type FormDialogField } from '../../components/FormDialog';
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, GripVertical, Plus, Save, Search, Trash2 } from 'lucide-react';
import { appToast } from '../../components/AppToast';

const tree = [
  { name: 'Internet Fundamentals', active: false, children: ['How does the internet work?', 'HTTP and HTTPS', 'DNS'] },
  { name: 'HTML', active: false, children: [] },
  { name: 'CSS', active: false, children: [] },
];

interface Resource {
  name: string;
  type: string;
  provider: string;
  free: boolean;
}

const initialResources: Resource[] = [
  { name: 'MDN Internet Basics', type: 'Article', provider: 'MDN', free: true },
  { name: 'HTTP Crash Course', type: 'Video', provider: 'freeCodeCamp', free: true },
];

export function AdminNodeLibraryPage() {
  const [selected, setSelected] = useState('How does the internet work?');
  const [createOpen, setCreateOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [deleteNodeOpen, setDeleteNodeOpen] = useState(false);
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null);

  const resourceFields: FormDialogField[] = [
    { name: 'name', label: 'Resource name', colSpan: 2 },
    { name: 'url', label: 'Resource URL', type: 'url', colSpan: 2 },
    { name: 'type', label: 'Type', type: 'select', options: ['Article', 'Video', 'Course', 'Docs'], defaultValue: 'Article' },
    { name: 'provider', label: 'Provider', defaultValue: 'MDN' },
    { name: 'free', label: 'Free resource', type: 'checkbox', defaultValue: true, colSpan: 2 },
  ];

  return (
    <AppShell breadcrumb="Admin / Node Library" className="app-main--flush">
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="fixed bottom-0 left-56 top-16 w-[340px] border-r border-[var(--md3-outline-variant)] bg-white">
          <div className="border-b border-[var(--md3-outline-variant)] p-5">
            <h1 className="mb-3 text-base font-medium text-[var(--md3-on-surface)]">Node Library</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
              <input className="md3-field h-9 w-full pl-9 pr-3 text-sm" placeholder="Search nodes..." />
            </div>
          </div>
          <div className="space-y-1 p-2">
            {tree.map((root) => (
              <div key={root.name}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--md3-surface-variant)]">
                  {root.children.length ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {root.name}
                </button>
                {root.children.map((child) => (
                  <button
                    key={child}
                    onClick={() => setSelected(child)}
                    className={`ml-6 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected === child ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]' : 'hover:bg-[var(--md3-surface-variant)]'}`}
                  >
                    {child}
                    <span className="flex gap-1 opacity-50">
                      <GripVertical className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <AdminActionButton
            icon={Plus}
            label="Add node"
            variant="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 shadow-lg"
            aria-label="Add node"
          />
        </aside>

        <section className="ml-[340px] flex-1 p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--md3-on-surface)]">{selected}</h1>
              <p className="text-sm text-[var(--md3-on-surface-variant)]">Edit hierarchy, description, and resources for this learning node.</p>
            </div>
            <AdminActionButton
              icon={Trash2}
              label="Delete"
              variant="danger"
              size="md"
              onClick={() => setDeleteNodeOpen(true)}
            />
          </div>

          <div className="md3-card mb-6 grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <input className="md3-field px-4" defaultValue={selected} />
            <select className="md3-field px-4">
              <option>Internet Fundamentals</option>
            </select>
            <input className="md3-field px-4" defaultValue="1" />
            <textarea className="md3-field min-h-28 px-4 py-3 md:col-span-2" defaultValue="Understand the request/response model, protocols, DNS, and browser-server communication." />
            <div className="md:col-span-2 flex justify-end">
              <AdminActionButton
                icon={Save}
                label="Save Node"
                variant="primary"
                size="md"
                onClick={() => appToast.success('Node saved')}
              />
            </div>
          </div>

          <div className="md3-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Learning Resources ({resources.length})</h2>
              <AdminActionButton
                icon={BookOpen}
                label="Add Resource"
                onClick={() => setResourceDialogOpen(true)}
                size="md"
              />
            </div>
            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.name} className="flex items-center gap-3 rounded-lg bg-[var(--md3-surface-container)] p-3">
                  <ExternalLink className="h-4 w-4 text-[var(--md3-on-surface-variant)]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--md3-on-surface)]">{resource.name}</p>
                    <p className="text-xs text-[var(--md3-on-surface-variant)]">{resource.provider}</p>
                  </div>
                  <span className="rounded bg-[var(--md3-surface-variant)] px-2 py-1 font-mono text-xs">{resource.type}</span>
                  <span className="rounded-lg bg-[var(--md3-success-container)] px-2 py-1 text-xs font-medium text-[var(--md3-success)]">{resource.free ? 'Free' : 'Paid'}</span>
                  <AdminActionButton
                    icon={Trash2}
                    label="Delete"
                    variant="danger"
                    onClick={() => setDeleteResource(resource)}
                    size="sm"
                    aria-label={`Delete ${resource.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <CreateNodeDialog
        isOpen={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSave={(nodeName) => {
          setSelected(nodeName);
          setCreateOpen(false);
          appToast.success('Node saved');
        }}
      />

      <FormDialog
        isOpen={resourceDialogOpen}
        title="Add Learning Resource"
        description={`Attach a resource to ${selected}.`}
        fields={resourceFields}
        onCancel={() => setResourceDialogOpen(false)}
        onSubmit={(values) => {
          setResources([
            {
              name: String(values.name || 'New Learning Resource'),
              type: String(values.type || 'Article'),
              provider: String(values.provider || 'Unknown'),
              free: Boolean(values.free),
            },
            ...resources,
          ]);
          setResourceDialogOpen(false);
          appToast.success('Resource added');
        }}
      />

      <ConfirmDialog
        isOpen={deleteNodeOpen}
        title="Delete Node?"
        message={`This removes ${selected} from the node library.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          setDeleteNodeOpen(false);
          appToast.success('Node deleted');
        }}
        onCancel={() => setDeleteNodeOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteResource !== null}
        title="Delete Resource?"
        message={`This removes ${deleteResource?.name ?? 'this resource'} from the selected node.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteResource) {
            setResources(resources.filter((resource) => resource !== deleteResource));
          }
          setDeleteResource(null);
          appToast.success('Resource deleted');
        }}
        onCancel={() => setDeleteResource(null)}
      />
    </AppShell>
  );
}

