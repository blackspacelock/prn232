import { useNavigate, useParams } from 'react-router';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { RepoCard } from '../components/RepoCard';
import { SkillChip } from '../components/SkillChip';
import { getSkillCategoryColorIndex } from '../components/skillColorUtils';
import { Compass, User } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_PROFILE_WITH_SKILLS, GET_GITHUB_REPOS_BY_PROFILE, GET_PUBLIC_PORTFOLIO_BY_PROFILE } from '@/graphql/queries';
import { PublicLayout } from '../components/PublicLayout';
import { AppBreadcrumbs } from '../components/AppBreadcrumbs';
import { useAuthStore } from '@/store/authStore';
import type { GitHubRepositoryDto, ProfileWithSkillsDto, PublicPortfolioDto } from '@/types/api';

export function PublicPortfolioPage() {
  const { username: userId } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const viewer = useAuthStore((s) => s.user);
  const showBreadcrumbs = Boolean(viewer);
  const breadcrumbs = [
    { label: 'Portfolio', to: '/portfolio' },
    { label: userId ?? 'User' },
  ];

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GET_PROFILE_WITH_SKILLS, {
    variables: { userId },
    skip: !userId,
    context: { headers: {} },
  });

  const profile: ProfileWithSkillsDto | null = (profileData as { profileWithSkills?: ProfileWithSkillsDto })?.profileWithSkills ?? null;
  const skills = profile?.skills ?? [];
  const profileId = profile?.userId;
  const displayName = profile?.fullName?.trim() || 'SECompass Student';

  const { data: reposData, loading: reposLoading } = useQuery(GET_GITHUB_REPOS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
    context: { headers: {} },
  });

  const repos: GitHubRepositoryDto[] = (reposData as { gitHubRepositoriesByProfile?: GitHubRepositoryDto[] })?.gitHubRepositoriesByProfile ?? [];
  const publicRepos = repos.filter((r) => !r.isPrivate);

  const { data: portfolioData } = useQuery(GET_PUBLIC_PORTFOLIO_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
    context: { headers: {} },
  });

  const publicPortfolio: PublicPortfolioDto | null = (portfolioData as { publicPortfolioByProfile?: PublicPortfolioDto })?.publicPortfolioByProfile ?? null;
  const headline = publicPortfolio?.headline?.trim();
  const publicBio = publicPortfolio?.publicBio?.trim() || profile?.bioDescription;
  const analysis = publicPortfolio?.cachedPortfolioAnalysis;

  if (profileLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-64px)] bg-[var(--md3-surface-container)] py-12">
          {showBreadcrumbs && (
            <div className="mb-6 w-full px-6">
              <AppBreadcrumbs items={breadcrumbs} />
            </div>
          )}
          <div className="max-w-[860px] mx-auto px-6 space-y-6">
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
            {showBreadcrumbs && <AppBreadcrumbs items={breadcrumbs} />}
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
        {showBreadcrumbs && (
          <div className="w-full px-6 pt-8">
            <AppBreadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="max-w-[860px] mx-auto px-6 py-12 space-y-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-6">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={`${displayName} avatar`} className="h-20 w-20 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-[var(--md3-primary)]">
                  {displayName[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-[var(--md3-on-surface)] mb-2">{displayName}</h1>
              {headline && (
                <p className="text-base font-medium text-[var(--md3-primary)] mb-2">{headline}</p>
              )}
              {profile.university && (
                <p className="text-sm text-[var(--md3-on-surface-variant)] mb-1">{profile.university} {profile.major && `· ${profile.major}`}</p>
              )}
              {publicBio && (
                <p className="text-sm text-[var(--md3-on-surface-variant)]">{publicBio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-4">Skills</h2>
          {profileLoading ? (
            <div className="flex flex-wrap gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)}</div>
          ) : skills.length === 0 ? (
            <p className="text-sm text-[var(--md3-on-surface-variant)]">No skills listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <SkillChip key={skill.id} label={skill.skillName} colorIndex={getSkillCategoryColorIndex(skill.category)} />
              ))}
            </div>
          )}
        </div>

        {analysis && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-4">Portfolio Analysis</h2>
            <p className="text-sm text-[var(--md3-on-surface-variant)] mb-5">{analysis.overallSummary}</p>
            <div className="space-y-4">
              {analysis.repositoryAnalyses.map((repo) => (
                <div key={repo.repositoryId} className="rounded-xl border border-[var(--md3-outline-variant)] p-4">
                  <h3 className="text-base font-medium text-[var(--md3-on-surface)]">{repo.repositoryName}</h3>
                  <p className="mt-2 text-sm text-[var(--md3-on-surface-variant)]">
                    <span className="font-medium text-[var(--md3-on-surface)]">Objective: </span>
                    {repo.objective}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {repo.techStacks.length > 0 ? repo.techStacks.map((stack) => (
                      <span key={stack} className="rounded-lg bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-primary-container)]">
                        {stack}
                      </span>
                    )) : (
                      <span className="text-xs text-[var(--md3-on-surface-variant)]">Tech stack not specified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-4">GitHub Projects</h2>
          {reposLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : publicRepos.length === 0 ? (
            <p className="text-sm text-[var(--md3-on-surface-variant)]">No public repositories.</p>
          ) : (
            <div className="space-y-4">
              {publicRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} variant="public" />
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
