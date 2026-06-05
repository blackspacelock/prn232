import { useNavigate, useParams } from 'react-router';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Compass, ExternalLink, Lock, User } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_PROFILE_BY_USER_ID, GET_GITHUB_REPOS_BY_PROFILE } from '@/graphql/queries';
import { PublicLayout } from '../components/PublicLayout';
import { AppBreadcrumbs } from '../components/AppBreadcrumbs';

interface ProfileDto { userId: string; bioDescription?: string; university?: string; major?: string; studiedYear?: number }
interface GitHubRepo { id: string; repositoryName: string; repoUrl: string; description?: string; isPrivate: boolean }

export function PublicPortfolioPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const breadcrumbs = [
    { label: 'Home', to: '/' },
    { label: 'Portfolio' },
    { label: username ?? 'User' },
  ];

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GET_PROFILE_BY_USER_ID, {
    variables: { userId: username },
    skip: !username,
    context: { headers: {} },
  });

  const profile: ProfileDto | null = (profileData as { profileByUserId?: ProfileDto })?.profileByUserId ?? null;

  const { data: reposData, loading: reposLoading } = useQuery(GET_GITHUB_REPOS_BY_PROFILE, {
    variables: { profileId: profile?.userId ?? username },
    skip: !username,
    context: { headers: {} },
  });

  const repos: GitHubRepo[] = (reposData as { gitHubRepositoriesByProfile?: GitHubRepo[] })?.gitHubRepositoriesByProfile ?? [];

  if (profileLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-64px)] bg-[var(--md3-surface-container)] py-12">
          <div className="max-w-[860px] mx-auto px-6 space-y-6">
            <AppBreadcrumbs items={breadcrumbs} />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-64px)] bg-[var(--md3-surface-container)] flex items-center justify-center p-6">
          <div className="w-full max-w-[860px] space-y-6">
            <AppBreadcrumbs items={breadcrumbs} />
            <EmptyState
              icon={User}
              title="Portfolio not found"
              description="This portfolio does not exist or is not public."
              actionLabel="Go Home"
              onAction={() => navigate('/')}
            />
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-64px)] bg-[var(--md3-surface-container)]">
        <div className="max-w-[860px] mx-auto px-6 py-12 space-y-8">
        <AppBreadcrumbs items={breadcrumbs} />
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-[var(--md3-primary)]">
                {String(username ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-[var(--md3-on-surface)] mb-2">{String(username)}</h1>
              {profile.university && (
                <p className="text-sm text-[var(--md3-on-surface-variant)] mb-1">{profile.university} {profile.major && `· ${profile.major}`}</p>
              )}
              {profile.bioDescription && (
                <p className="text-sm text-[var(--md3-on-surface-variant)]">{profile.bioDescription}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-4">GitHub Projects</h2>
          {reposLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : repos.length === 0 ? (
            <p className="text-sm text-[var(--md3-on-surface-variant)]">No public repositories.</p>
          ) : (
            <div className="space-y-4">
              {repos.filter((r) => !r.isPrivate).map((repo) => (
                <div key={repo.id} className="border border-[var(--md3-outline-variant)] rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {repo.isPrivate && <Lock className="w-4 h-4 text-[var(--md3-on-surface-variant)]" />}
                      <h3 className="text-base font-medium text-[var(--md3-on-surface)]">{repo.repositoryName || repo.repoUrl}</h3>
                    </div>
                    <a href={repo.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--md3-primary)] hover:underline">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  </div>
                  {repo.description && <p className="text-sm text-[var(--md3-on-surface-variant)] mt-2">{repo.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <ActionButton icon={Compass} label="Join SECompass" variant="primary" size="lg" onClick={() => navigate('/register')} />
        </div>
      </div>
      </div>
    </PublicLayout>
  );
}
