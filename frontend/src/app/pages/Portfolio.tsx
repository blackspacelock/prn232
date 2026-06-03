import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { EmptyState } from '../components/EmptyState';
import { ExternalLink, Lock, Trash2, Plus, Sparkles } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { GET_GITHUB_REPOS_BY_PROFILE, GET_PORTFOLIO_ANALYSIS } from '@/graphql/queries';
import type { CreateGitHubRepositoryDto } from '@/types/api';

interface GitHubRepo { id: string; repositoryName: string; repoUrl: string; description?: string; isPrivate: boolean; createdAt: string }
interface PortfolioAnalysis { overallSummary: string; strengths: string[]; recommendations: string[] }

export function PortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRepo, setNewRepo] = useState({ repositoryUrl: '', description: '' });

  const { data: reposData, loading: reposLoading, error: reposError, refetch } = useQuery(GET_GITHUB_REPOS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: analysisData, loading: analysisLoading } = useQuery(GET_PORTFOLIO_ANALYSIS, {
    variables: { profileId },
    skip: !profileId,
  });

  const repos: GitHubRepo[] = (reposData as any)?.gitHubRepositoriesByProfile ?? [];
  const analysis: PortfolioAnalysis | null = (analysisData as any)?.portfolioAnalysis ?? null;

  const addRepoMutation = useMutation({
    mutationFn: (dto: CreateGitHubRepositoryDto) =>
      apiClient.post('/api/github-repositories', dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_GITHUB_REPOS_BY_PROFILE] });
      setShowAddForm(false);
      setNewRepo({ repositoryUrl: '', description: '' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add repository.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const deleteRepoMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/github-repositories/${id}`),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_GITHUB_REPOS_BY_PROFILE] });
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete repository.';
      setSnackbar({ open: true, message: msg });
      setDeleteId(null);
    },
  });

  return (
    <AppShell breadcrumb="Portfolio">
      <div className="app-page">
        <PageHeader
          title="E-Portfolio & GitHub"
          description="Showcase your projects and get AI-powered insights."
          actions={<ActionButton icon={Plus} label="Add Repository" variant="primary" size="md" onClick={() => setShowAddForm(true)} />}
        />

        {showAddForm && (
          <div className="md3-card p-6">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Add GitHub Repository</h3>
            <div className="space-y-3">
              <input
                type="url"
                value={newRepo.repositoryUrl}
                onChange={(e) => setNewRepo({ ...newRepo, repositoryUrl: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="md3-field w-full px-4"
              />
              <input
                type="text"
                value={newRepo.description}
                onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                placeholder="Description (optional)"
                className="md3-field w-full px-4"
              />
              <div className="flex gap-3">
                <ActionButton
                  icon={Plus}
                  label={addRepoMutation.isPending ? 'Adding...' : 'Add Repository'}
                  variant="primary"
                  disabled={!newRepo.repositoryUrl || addRepoMutation.isPending}
                  onClick={() => addRepoMutation.mutate({ profileId, repositoryUrl: newRepo.repositoryUrl, description: newRepo.description || undefined })}
                />
                <ActionButton icon={Trash2} label="Cancel" variant="text" onClick={() => setShowAddForm(false)} />
              </div>
            </div>
          </div>
        )}

        {reposLoading ? (
          <div className="desktop-grid-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : reposError ? (
          <EmptyState icon={Plus} title="Failed to load repositories" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : repos.length === 0 ? (
          <EmptyState icon={Plus} title="No repositories yet" description="Add your GitHub repositories to showcase your work." actionLabel="Add Repository" onAction={() => setShowAddForm(true)} />
        ) : (
          <div className="desktop-grid-2">
            {repos.map((repo) => (
              <div key={repo.id} className="md3-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {repo.isPrivate && <Lock className="w-4 h-4 text-[var(--md3-on-surface-variant)]" />}
                    <h3 className="text-base font-medium text-[var(--md3-on-surface)]">{repo.repositoryName || repo.repoUrl}</h3>
                  </div>
                  <div className="flex gap-1">
                    <a href={repo.repoUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full">
                      <ExternalLink className="w-4 h-4 text-[var(--md3-on-surface-variant)]" />
                    </a>
                    <button onClick={() => setDeleteId(repo.id)} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--md3-error-container)] rounded-full">
                      <Trash2 className="w-4 h-4 text-[var(--md3-error)]" />
                    </button>
                  </div>
                </div>
                {repo.description && <p className="text-sm text-[var(--md3-on-surface-variant)]">{repo.description}</p>}
                <p className="text-xs text-[var(--md3-on-surface-variant)] mt-2">{new Date(repo.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {!analysisLoading && analysis && (
          <div className="md3-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[var(--md3-primary)]" />
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">AI Portfolio Analysis</h2>
            </div>
            <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">{analysis.overallSummary}</p>
            {analysis.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[var(--md3-on-surface)] mb-2">Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s) => (
                    <span key={s} className="px-2 py-1 bg-[var(--md3-success-container)] text-[var(--md3-success)] rounded text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface)] mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {analysis.recommendations.map((r) => (
                    <li key={r} className="text-sm text-[var(--md3-on-surface-variant)] flex items-start gap-2">
                      <span className="text-[var(--md3-primary)] mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteId !== null}
          title="Remove Repository?"
          message="This repository will be removed from your portfolio."
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => { if (deleteId) deleteRepoMutation.mutate(deleteId); }}
          onCancel={() => setDeleteId(null)}
        />

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
