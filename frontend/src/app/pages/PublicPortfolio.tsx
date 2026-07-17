import { useNavigate, useParams } from 'react-router';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { SkillChip } from '../components/SkillChip';
import { getSkillCategoryColorIndex } from '../components/skillColorUtils';
import { Compass, ExternalLink, FileText, Lock, Phone, User } from 'lucide-react';
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
  const userBio = profile?.bioDescription?.trim();
  const phoneNumber = profile?.phoneNumber?.trim();
  const analysis = publicPortfolio?.cachedPortfolioAnalysis;
  const repositoryAnalyses = analysis?.repositoryAnalyses ?? [];
  const getRepositoryAnalysis = (repo: GitHubRepositoryDto) =>
    repositoryAnalyses.find((item) =>
      item.repositoryId === repo.id ||
      item.repositoryName.toLowerCase() === repo.repositoryName.toLowerCase()
    );

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
              {(userBio || phoneNumber) && (
                <div className="mt-4 grid gap-3 rounded-xl border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-4">
                  {userBio && (
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--md3-primary)]" />
                      <div>
                        <p className="text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Bio</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--md3-on-surface)]">{userBio}</p>
                      </div>
                    </div>
                  )}
                  {phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--md3-primary)]" />
                      <div>
                        <p className="text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Phone</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--md3-on-surface)]">{phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
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

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-5">Portfolio</h2>

          {analysis && (
            <div className="mb-5 rounded-xl bg-[var(--md3-surface-container)] px-4 py-3">
              <p className="text-sm text-[var(--md3-on-surface-variant)]">{analysis.overallSummary}</p>
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold text-[var(--md3-on-surface)] mb-4">GitHub Projects</h3>
            {reposLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : publicRepos.length === 0 ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)]">No public repositories.</p>
            ) : (
              <div className="space-y-4">
                {publicRepos.map((repo) => {
                  const repoAnalysis = getRepositoryAnalysis(repo);
                  return (
                    <div key={repo.id} className="rounded-xl border border-[var(--md3-outline-variant)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {repo.isPrivate && <Lock className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />}
                          <h4 className="truncate text-base font-medium text-[var(--md3-on-surface)]">
                            {repo.repositoryName || repo.repoUrl}
                          </h4>
                        </div>
                        <a
                          href={repo.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${repo.repositoryName || 'repository'} on GitHub`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
                        >
                          <ExternalLink className="h-4 w-4 text-[var(--md3-on-surface-variant)]" />
                        </a>
                      </div>

                      {repo.description && (
                        <p className="mt-2 text-sm text-[var(--md3-on-surface-variant)]">{repo.description}</p>
                      )}

                      {repoAnalysis && (
                        <div className="mt-3 rounded-lg bg-[var(--md3-surface-container)] px-3 py-3">
                          <p className="text-sm text-[var(--md3-on-surface-variant)]">
                            <span className="font-medium text-[var(--md3-on-surface)]">Objective: </span>
                            {repoAnalysis.objective}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {repoAnalysis.techStacks.length > 0 ? repoAnalysis.techStacks.map((stack) => (
                              <span key={stack} className="rounded-lg bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-primary-container)]">
                                {stack}
                              </span>
                            )) : (
                              <span className="text-xs text-[var(--md3-on-surface-variant)]">Tech stack not specified</span>
                            )}
                          </div>
                        </div>
                      )}

                      {repo.createdAt && (
                        <p className="mt-3 text-xs text-[var(--md3-on-surface-variant)]">{new Date(repo.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <ActionButton icon={Compass} label="Join SECompass" variant="primary" size="lg" onClick={() => navigate('/register')} />
        </div>
      </div>
      </div>
    </PublicLayout>
  );
}
