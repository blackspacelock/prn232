import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormDialog, type FormDialogField } from '../components/FormDialog';
import { ActionAnchor, ActionButton, ActionLink } from '../components/ActionButton';
import { ExternalLink, Link as LinkIcon, Lock, Trash2, Check, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { appToast } from '../components/AppToast';

interface Repository {
  id: number;
  name: string;
  isPrivate: boolean;
  description: string;
  aiSummary: string;
  technologies: string[];
}

const initialRepositories: Repository[] = [
  {
    id: 1,
    name: 'E-commerce Platform',
    isPrivate: false,
    description: 'Full-stack e-commerce application with React, Node.js, and PostgreSQL',
    aiSummary: 'Demonstrates full-stack development skills with modern architecture. Strong focus on scalable backend design and responsive UI. Good test coverage.',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    id: 2,
    name: 'Task Management API',
    isPrivate: false,
    description: 'RESTful API for task management with authentication and real-time updates',
    aiSummary: 'Shows proficiency in API design, authentication patterns, and WebSocket implementation. Clean code structure with comprehensive documentation.',
    technologies: ['Express', 'MongoDB', 'Socket.io', 'JWT'],
  },
  {
    id: 3,
    name: 'ML Model Deployment',
    isPrivate: true,
    description: 'Machine learning model serving with FastAPI and containerization',
    aiSummary: 'Highlights DevOps skills and ML model deployment experience. Production-ready setup with CI/CD pipeline.',
    technologies: ['Python', 'FastAPI', 'Docker', 'Kubernetes'],
  },
  {
    id: 4,
    name: 'Real-time Chat App',
    isPrivate: false,
    description: 'Real-time messaging application with group chat and file sharing',
    aiSummary: 'Demonstrates real-time communication implementation and state management. Good user experience design.',
    technologies: ['React', 'Firebase', 'TypeScript'],
  },
];

const aiInsights: Array<{
  type: 'success' | 'info' | 'warning';
  icon: React.ElementType;
  message: string;
}> = [
  {
    type: 'success',
    icon: Check,
    message: 'Strong full-stack portfolio with 4 diverse projects covering frontend, backend, and DevOps',
  },
  {
    type: 'info',
    icon: Info,
    message: 'Consider adding a mobile development project to diversify your skill set',
  },
  {
    type: 'warning',
    icon: AlertTriangle,
    message: 'Projects could benefit from more detailed README files and live demo links',
  },
];

export function PortfolioPage() {
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);

  const repoFields: FormDialogField[] = [
    { name: 'url', label: 'GitHub Repository URL', type: 'url', colSpan: 2 },
    { name: 'name', label: 'Display Name' },
    { name: 'technologies', label: 'Technologies', placeholder: 'React, Node.js, PostgreSQL' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'private', label: 'Private repository', type: 'checkbox', defaultValue: false, colSpan: 2 },
  ];

  return (
    <AppShell breadcrumb="Portfolio">
      <div className="app-page">
        <PageHeader
          title="E-Portfolio"
          description="Showcase your projects and let AI summarize your work."
          actions={
            <ActionLink
              icon={ExternalLink}
              label="View Public Portfolio"
              to="/portfolio/nguyenthanh"
              variant="neutral"
              size="md"
            />
          }
        />

        {/* Link Repository Section */}
        <div className="md3-card p-6">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-2">Link a Repository</h2>
          <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
            Add GitHub projects to build your portfolio.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[300px] relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              <input
                type="url"
                placeholder="GitHub repository URL"
                className="md3-field w-full pl-12 pr-4"
              />
            </div>

            <input
              type="text"
              placeholder="Display name"
              className="md3-field w-[200px] px-4"
            />

            <label className="flex items-center gap-2 px-4 h-14 bg-white border-2 border-[var(--md3-outline)] rounded cursor-pointer hover:bg-[var(--md3-surface-variant)] transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-2 border-[var(--md3-outline)]" />
              <span className="text-sm font-medium text-[var(--md3-on-surface)]">Private</span>
            </label>

            <ActionButton
              icon={LinkIcon}
              label="Link Repo"
              variant="primary"
              size="lg"
              onClick={() => setRepoDialogOpen(true)}
              className="h-14"
            />
          </div>
        </div>

        {/* Repositories Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)]">
            Your Repositories ({repositories.length})
          </h2>
          <select className="md3-field h-10 px-4">
            <option>Sort by: Latest</option>
            <option>Sort by: Name</option>
            <option>Sort by: Stars</option>
          </select>
        </div>

        {/* Repositories Grid */}
        <div className="desktop-grid-2">
          {repositories.map((repo) => (
            <RepositoryCard key={repo.id} {...repo} onDelete={() => setDeleteRepo(repo)} />
          ))}
        </div>

        {/* AI Portfolio Analysis */}
        <div className="md3-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">AI Portfolio Analysis</h2>
            <ActionButton
              icon={Sparkles}
              label="Regenerate"
              onClick={() => appToast.success('Portfolio analysis regenerated')}
            />
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      </div>

      <FormDialog
        isOpen={repoDialogOpen}
        title="Link GitHub Repository"
        description="Add a project to your e-portfolio."
        fields={repoFields}
        submitLabel="Link Repo"
        onCancel={() => setRepoDialogOpen(false)}
        onSubmit={(values) => {
          const technologies = String(values.technologies || 'React')
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean);

          setRepositories([
            {
              id: repositories.length + 1,
              name: String(values.name || 'New Repository'),
              isPrivate: Boolean(values.private),
              description: String(values.description || 'Linked GitHub repository'),
              aiSummary: 'New repository linked. Run portfolio analysis to generate a project summary.',
              technologies,
            },
            ...repositories,
          ]);
          setRepoDialogOpen(false);
          appToast.success('Repository linked');
        }}
      />

      <ConfirmDialog
        isOpen={deleteRepo !== null}
        title="Remove Repository?"
        message={`This removes ${deleteRepo?.name ?? 'this repository'} from your portfolio.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (deleteRepo) {
            setRepositories(repositories.filter((repo) => repo !== deleteRepo));
          }
          setDeleteRepo(null);
          appToast.success('Repository removed');
        }}
        onCancel={() => setDeleteRepo(null)}
      />
    </AppShell>
  );
}

function RepositoryCard({ name, isPrivate, description, aiSummary, technologies, onDelete }: {
  name: string;
  isPrivate: boolean;
  description: string;
  aiSummary: string;
  technologies: string[];
  onDelete: () => void;
}) {
  return (
    <div className="md3-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-[var(--md3-on-surface)]">{name}</h3>
          {isPrivate && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[var(--md3-surface-variant)] rounded text-xs">
              <Lock className="w-3 h-3 text-[var(--md3-on-surface-variant)]" />
              <span className="text-[var(--md3-on-surface-variant)]">Private</span>
            </div>
          )}
        </div>
        <ActionButton
          icon={Trash2}
          label="Remove"
          variant="danger"
          onClick={onDelete}
          aria-label={`Remove ${name}`}
        />
      </div>

      <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4 line-clamp-2">
        {description}
      </p>

      {/* AI Summary */}
      <div className="bg-[var(--md3-surface-container)] rounded-lg p-3 mb-4">
        <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-2">
          AI Summary
        </p>
        <p className="text-xs text-[var(--md3-on-surface-variant)] italic leading-relaxed">
          {aiSummary}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--md3-outline-variant)]">
        <div className="flex flex-wrap gap-1.5">
          {technologies.map((tech, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-[var(--md3-surface-variant)] border border-[var(--md3-outline)] rounded text-xs font-mono text-[var(--md3-on-surface-variant)]"
            >
              {tech}
            </span>
          ))}
        </div>
        <ActionAnchor
          icon={ExternalLink}
          label="Open on GitHub"
          href="#"
          variant="text"
        />
      </div>
    </div>
  );
}

function InsightCard({ type, icon: Icon, message }: {
  type: 'success' | 'info' | 'warning';
  icon: React.ElementType;
  message: string;
}) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return { bg: 'var(--md3-success-container)', border: 'var(--md3-success)', iconColor: 'var(--md3-success)' };
      case 'info':
        return { bg: 'var(--md3-primary-container)', border: 'var(--md3-primary)', iconColor: 'var(--md3-primary)' };
      case 'warning':
        return { bg: 'var(--md3-warning-container)', border: 'var(--md3-warning)', iconColor: 'var(--md3-warning)' };
    }
  };

  const styles = getStyles();

  return (
    <div
      className="rounded-lg p-4 border-l-4"
      style={{ backgroundColor: styles.bg, borderLeftColor: styles.border }}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: styles.iconColor }} />
        <p className="text-sm text-[var(--md3-on-surface)] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

