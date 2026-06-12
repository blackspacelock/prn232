import { Edit3, ExternalLink, Lock, Trash2 } from 'lucide-react';
import type { GitHubRepositoryDto } from '@/types/api';

interface RepoCardProps {
  repo: GitHubRepositoryDto;
  /** 'outlined' (12px radius, bordered) for owner views; 'public' (16px radius, elevated) for the public portfolio */
  variant?: 'outlined' | 'public';
  aiSummary?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RepoCard({ repo, variant = 'outlined', aiSummary, onEdit, onDelete }: RepoCardProps) {
  const containerClass = variant === 'public' ? 'rounded-2xl bg-white p-5' : 'md3-outlined-card p-5';
  const containerStyle = variant === 'public' ? { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.10)' } : undefined;

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {repo.isPrivate && <Lock className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />}
          <h3 className="truncate text-base font-medium text-[var(--md3-on-surface)]">
            {repo.repositoryName || repo.repoUrl}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${repo.repositoryName || 'repository'} on GitHub`}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
          >
            <ExternalLink className="h-4 w-4 text-[var(--md3-on-surface-variant)]" />
          </a>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${repo.repositoryName || 'repository'}`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
            >
              <Edit3 className="h-4 w-4 text-[var(--md3-on-surface-variant)]" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Remove ${repo.repositoryName || 'repository'}`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-error-container)]"
            >
              <Trash2 className="h-4 w-4 text-[var(--md3-error)]" />
            </button>
          )}
        </div>
      </div>

      {repo.description && (
        <p className="mt-2 text-sm text-[var(--md3-on-surface-variant)]">{repo.description}</p>
      )}

      {aiSummary && (
        <p className="mt-3 rounded-lg bg-[var(--md3-primary-container)] px-3 py-2 text-xs text-[var(--md3-on-primary-container)]">
          <span className="font-medium">AI Summary: </span>
          {aiSummary}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {repo.isPrivate && (
          <span
            className="rounded-lg px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: 'var(--md3-surface-variant)', color: 'var(--md3-on-surface-variant)' }}
          >
            Private
          </span>
        )}
        {repo.createdAt && (
          <p className="text-xs text-[var(--md3-on-surface-variant)]">{new Date(repo.createdAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
