import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { EmptyState } from '../components/EmptyState';
import { RepoCard } from '../components/RepoCard';
import { FormDialog, type FormDialogField } from '../components/FormDialog';
import { LoadingDialog } from '../components/LoadingDialog';
import { AdminListToolbar, AdminPagination, AdminFilterSelect, useAdminList, type AdminSortOption } from '../components/admin/AdminListControls';
import { ExternalLink, Plus, Share2, Sparkles } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { useAuthStore } from '@/store/authStore';
import { GET_GITHUB_REPOS_BY_PROFILE, GET_PORTFOLIO_ANALYSIS } from '@/graphql/queries';
import type { AddGitHubRepoDto, GitHubRepositoryDto, PortfolioAnalysisDto, UpdateGitHubRepoDto } from '@/types/api';

type RepoSort = 'name' | 'createdAt';

const SORT_OPTIONS: AdminSortOption<RepoSort>[] = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Date Added' },
];

const VISIBILITY_OPTIONS = [
  { value: '', label: 'All Repos' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const ADD_REPO_FIELDS: FormDialogField[] = [
  {
    name: 'repoUrl',
    label: 'Repository URL',
    description: 'Paste the full GitHub URL (e.g. https://github.com/username/repo). The repository name is derived automatically.',
    type: 'url',
    placeholder: 'https://github.com/username/repo',
    colSpan: 2,
  },
  {
    name: 'description',
    label: 'Description (optional)',
    description: 'A short summary of what this project does. AI analysis can update this automatically from the README.',
    type: 'textarea',
    placeholder: 'What does this project do?',
    colSpan: 2,
  },
  {
    name: 'isPrivate',
    label: 'Private repository',
    description: 'Mark as private if the repository is not publicly visible on GitHub.',
    type: 'checkbox',
    colSpan: 2,
  },
];

const AI_DESCRIPTION_NOTICE = 'When you run AI analysis, SECompass reads this repository README and may generate or update the repository description automatically.';

function extractRepoName(url: string): string {
  try {
    const parts = url.replace(/\/$/, '').split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url;
  }
}

export function PortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRepo, setEditRepo] = useState<GitHubRepositoryDto | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' });
  const [showAddForm, setShowAddForm] = useState(false);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RepoSort>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [visibilityFilter, setVisibilityFilter] = useState('');

  const { data: reposData, loading: reposLoading, error: reposError, refetch } = useQuery(GET_GITHUB_REPOS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: analysisData, loading: analysisLoading, refetch: refetchAnalysis } = useQuery(GET_PORTFOLIO_ANALYSIS, {
    variables: { profileId },
    skip: !profileId,
  });

  const allRepos: GitHubRepositoryDto[] = (reposData as { gitHubRepositoriesByProfile?: GitHubRepositoryDto[] })?.gitHubRepositoriesByProfile ?? [];
  const analysis: PortfolioAnalysisDto | null = (analysisData as { portfolioAnalysis?: PortfolioAnalysisDto })?.portfolioAnalysis ?? null;
  const reposQueryOptions = { query: GET_GITHUB_REPOS_BY_PROFILE, variables: { profileId } };

  const visibilityFiltered = visibilityFilter
    ? allRepos.filter((r) => visibilityFilter === 'private' ? r.isPrivate : !r.isPrivate)
    : allRepos;

  const repoList = useAdminList<GitHubRepositoryDto, RepoSort>({
    items: visibilityFiltered,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (r, term) =>
      r.repositoryName.toLowerCase().includes(term) ||
      (r.description ?? '').toLowerCase().includes(term) ||
      r.repoUrl.toLowerCase().includes(term),
    getSortValue: (r, key) => {
      if (key === 'name') return r.repositoryName;
      return r.createdAt;
    },
  });

  const editRepoFields: FormDialogField[] = editRepo ? [
    {
      name: 'repositoryName',
      label: 'Repository Name',
      description: 'The display name for this repository in your portfolio.',
      type: 'text',
      defaultValue: editRepo.repositoryName,
      colSpan: 2,
    },
    {
      name: 'repoUrl',
      label: 'Repository URL',
      description: 'The full GitHub URL to the repository.',
      type: 'url',
      defaultValue: editRepo.repoUrl,
      colSpan: 2,
    },
    {
      name: 'description',
      label: 'Description (optional)',
      description: 'A short summary of what this project does. AI analysis can update this automatically from the README.',
      type: 'textarea',
      defaultValue: editRepo.description ?? '',
      colSpan: 2,
    },
    {
      name: 'isPrivate',
      label: 'Private repository',
      description: 'Mark as private if the repository is not publicly visible on GitHub.',
      type: 'checkbox',
      defaultValue: editRepo.isPrivate,
      colSpan: 2,
    },
  ] : [];

  const addRepoMutation = useMutation({
    mutationFn: (dto: AddGitHubRepoDto) =>
      apiClient.post<GitHubRepositoryDto>('/api/github-repositories', dto).then((r) => r.data),
    onSuccess: (repo) => {
      appendCachedListItem<GitHubRepositoryDto>(reposQueryOptions, 'gitHubRepositoriesByProfile', repo);
      setShowAddForm(false);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add repository.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const deleteRepoMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/github-repositories/${id}`),
    onSuccess: (_data, id) => {
      removeCachedListItem<GitHubRepositoryDto>(reposQueryOptions, 'gitHubRepositoriesByProfile', id);
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete repository.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
      setDeleteId(null);
    },
  });

  const updateRepoMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGitHubRepoDto }) =>
      apiClient.put<GitHubRepositoryDto>(`/api/github-repositories/${id}`, dto).then((r) => r.data),
    onSuccess: async (repo) => {
      replaceCachedListItem<GitHubRepositoryDto>(reposQueryOptions, 'gitHubRepositoriesByProfile', repo);
      await refetch();
      setEditRepo(null);
      setSnackbar({ open: true, message: 'Repository updated.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update repository.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      apiClient.post<PortfolioAnalysisDto>(`/api/ai/portfolio-analysis/${profileId}`).then((r) => r.data),
    onSuccess: async () => {
      await refetch();
      await refetchAnalysis();
      setSnackbar({ open: true, message: 'Portfolio analysis updated. Repository descriptions were refreshed from README files.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to analyze portfolio.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const handleAddRepo = (values: Record<string, string | boolean>) => {
    const repoUrl = String(values.repoUrl ?? '').trim();
    if (!repoUrl) return;
    const dto: AddGitHubRepoDto = {
      profileId,
      repositoryName: extractRepoName(repoUrl),
      repoUrl,
      description: String(values.description ?? '').trim() || undefined,
      isPrivate: Boolean(values.isPrivate),
    };
    addRepoMutation.mutate(dto);
  };

  const handleUpdateRepo = (values: Record<string, string | boolean>) => {
    if (!editRepo) return;
    updateRepoMutation.mutate({
      id: editRepo.id,
      dto: {
        repositoryName: String(values.repositoryName ?? '').trim(),
        repoUrl: String(values.repoUrl ?? '').trim(),
        description: String(values.description ?? '').trim(),
        isPrivate: Boolean(values.isPrivate),
      },
    });
  };

  const handleSharePortfolio = async () => {
    const url = `${window.location.origin}/portfolio/${user?.id ?? profileId}`;
    try {
      await navigator.clipboard.writeText(url);
      setSnackbar({ open: true, message: 'Portfolio link copied to clipboard!', variant: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy portfolio link.', variant: 'error' });
    }
  };

  const publicPortfolioUrl = `/portfolio/${user?.id ?? profileId}`;

  return (
    <AppShell breadcrumb="Portfolio">
      <div className="app-page">
        <PageHeader
          title="E-Portfolio & GitHub"
          description="Showcase your projects and get AI-powered insights."
          actions={
            <>
              <ActionButton icon={ExternalLink} label="View Public Portfolio" variant="tonal" size="md" onClick={() => window.open(publicPortfolioUrl, '_blank', 'noopener,noreferrer')} />
              <ActionButton icon={Share2} label="Share Portfolio" variant="tonal" size="md" onClick={handleSharePortfolio} />
              <ActionButton icon={Sparkles} label="Analyze" variant="tonal" size="md" disabled={!profileId || analyzeMutation.isPending} onClick={() => analyzeMutation.mutate()} />
              <ActionButton icon={Plus} label="Add Repository" variant="primary" size="md" onClick={() => setShowAddForm(true)} />
            </>
          }
        />

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search repositories..."
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={SORT_OPTIONS}
        >
          <AdminFilterSelect
            value={visibilityFilter}
            onChange={setVisibilityFilter}
            options={VISIBILITY_OPTIONS}
            ariaLabel="Filter by visibility"
            label="Visibility"
          />
        </AdminListToolbar>

        {reposLoading ? (
          <div className="desktop-grid-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : reposError ? (
          <EmptyState icon={Plus} title="Failed to load repositories" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : repoList.pagedItems.length === 0 ? (
          <EmptyState
            icon={Plus}
            title={search || visibilityFilter ? 'No repositories match your filters' : 'No repositories yet'}
            description={search || visibilityFilter ? 'Try adjusting your search or filter.' : 'Add your GitHub repositories to showcase your work.'}
            actionLabel="Add Repository"
            onAction={() => setShowAddForm(true)}
          />
        ) : (
          <>
            <div className="desktop-grid-2">
              {repoList.pagedItems.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onEdit={() => setEditRepo(repo)}
                  onDelete={() => setDeleteId(repo.id)}
                />
              ))}
            </div>
            <AdminPagination {...repoList} onPageChange={repoList.setPage} />
          </>
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

        <FormDialog
          isOpen={showAddForm}
          title="Add GitHub Repository"
          description="Link a public or private repository to showcase in your portfolio."
          notice={AI_DESCRIPTION_NOTICE}
          fields={ADD_REPO_FIELDS}
          submitLabel={addRepoMutation.isPending ? 'Adding...' : 'Add Repository'}
          onCancel={() => setShowAddForm(false)}
          onSubmit={handleAddRepo}
        />

        <FormDialog
          isOpen={editRepo !== null}
          title="Edit GitHub Repository"
          description="Update the repository details shown in your portfolio."
          notice={AI_DESCRIPTION_NOTICE}
          fields={editRepoFields}
          submitLabel={updateRepoMutation.isPending ? 'Saving...' : 'Save Changes'}
          onCancel={() => setEditRepo(null)}
          onSubmit={handleUpdateRepo}
        />

        <ConfirmDialog
          isOpen={deleteId !== null}
          title="Remove Repository?"
          message="This repository will be removed from your portfolio."
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => { if (deleteId) deleteRepoMutation.mutate(deleteId); }}
          onCancel={() => setDeleteId(null)}
        />

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'error' })} />
        <LoadingDialog
          isOpen={analyzeMutation.isPending}
          title="Analyzing portfolio"
          message="SECompass is reviewing your repositories and refreshing your public portfolio insights."
        />
      </div>
    </AppShell>
  );
}
