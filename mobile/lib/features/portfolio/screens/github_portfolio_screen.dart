import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/app_exception.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/portfolio_provider.dart';

class GithubPortfolioScreen extends ConsumerWidget {
  const GithubPortfolioScreen({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final publicPortfolio = ref.watch(publicPortfolioProvider(userId));
    final viewer = ref.watch(authProvider).valueOrNull;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Public Portfolio'),
        actions: [
          if (viewer != null)
            IconButton(
              tooltip: 'My portfolio',
              onPressed: () => context.go('/portfolio'),
              icon: const Icon(Icons.folder_special_outlined),
            ),
        ],
      ),
      body: publicPortfolio.when(
        loading: () => const _PublicPortfolioSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.person_off_outlined,
          title: 'Portfolio not found',
          subtitle: error is AppException
              ? error.message
              : 'This portfolio does not exist or is not public.',
          actionLabel: viewer == null ? 'Go Home' : 'My Portfolio',
          onAction: () =>
              viewer == null ? context.go('/') : context.go('/portfolio'),
        ),
        data: (data) {
          if (data.publicPortfolio?.isPublic == false) {
            return EmptyStateView(
              icon: Icons.lock_outline,
              title: 'Portfolio not public',
              subtitle: 'This portfolio is currently hidden.',
              actionLabel: viewer == null ? 'Go Home' : 'My Portfolio',
              onAction: () =>
                  viewer == null ? context.go('/') : context.go('/portfolio'),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(publicPortfolioProvider(userId));
              await ref.read(publicPortfolioProvider(userId).future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                _PublicProfileCard(data: data),
                const SizedBox(height: 16),
                _SkillsCard(skills: data.profile.skills),
                if (data.publicPortfolio?.cachedPortfolioAnalysis != null) ...[
                  const SizedBox(height: 16),
                  _PublicAnalysisCard(
                    analysis: data.publicPortfolio!.cachedPortfolioAnalysis!,
                  ),
                ],
                const SizedBox(height: 16),
                _PublicReposCard(repositories: data.publicRepositories),
                const SizedBox(height: 20),
                if (viewer == null)
                  AppButton(
                    label: 'Join SECompass',
                    leadingIcon: const Icon(Icons.explore_outlined, size: 18),
                    onPressed: () => context.go('/register'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PublicProfileCard extends StatelessWidget {
  const _PublicProfileCard({required this.data});

  final PublicPortfolioViewData data;

  @override
  Widget build(BuildContext context) {
    final profile = data.profile;
    final portfolio = data.publicPortfolio;
    final displayName = (profile.fullName?.trim().isNotEmpty ?? false)
        ? profile.fullName!.trim()
        : 'SECompass Student';
    final headline = portfolio?.headline?.trim();
    final bio = (portfolio?.publicBio?.trim().isNotEmpty ?? false)
        ? portfolio!.publicBio!.trim()
        : profile.bioDescription;
    final schoolLine = [
      profile.university,
      profile.major,
    ].where((item) => item != null && item.trim().isNotEmpty).join(' - ');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Avatar(name: displayName, avatarUrl: profile.avatarUrl),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(displayName, style: AppTextStyles.titleLarge),
                      if (headline != null && headline.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          headline,
                          style: AppTextStyles.titleSmall.copyWith(
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                      if (schoolLine.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          schoolLine,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            if (bio != null && bio.trim().isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                bio,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
            if (_hasLinks(portfolio)) ...[
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (portfolio?.location?.trim().isNotEmpty ?? false)
                    _InfoChip(
                      icon: Icons.place_outlined,
                      label: portfolio!.location!.trim(),
                    ),
                  if (portfolio?.websiteUrl?.trim().isNotEmpty ?? false)
                    _LinkChip(
                      icon: Icons.language_outlined,
                      label: 'Website',
                      url: portfolio!.websiteUrl!.trim(),
                    ),
                  if (portfolio?.linkedInUrl?.trim().isNotEmpty ?? false)
                    _LinkChip(
                      icon: Icons.badge_outlined,
                      label: 'LinkedIn',
                      url: portfolio!.linkedInUrl!.trim(),
                    ),
                  if (portfolio?.contactEmail?.trim().isNotEmpty ?? false)
                    _LinkChip(
                      icon: Icons.mail_outline,
                      label: 'Email',
                      url: 'mailto:${portfolio!.contactEmail!.trim()}',
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  bool _hasLinks(PublicPortfolioDto? portfolio) {
    if (portfolio == null) return false;
    return [
      portfolio.location,
      portfolio.websiteUrl,
      portfolio.linkedInUrl,
      portfolio.contactEmail,
    ].any((item) => item != null && item.trim().isNotEmpty);
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.name, this.avatarUrl});

  final String name;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    final url = avatarUrl?.trim();
    if (url != null && url.isNotEmpty) {
      return CircleAvatar(
        radius: 34,
        backgroundImage: NetworkImage(url),
        backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.18),
      );
    }
    return CircleAvatar(
      radius: 34,
      backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.18),
      child: Text(
        name.characters.first.toUpperCase(),
        style: AppTextStyles.titleLarge.copyWith(color: AppColors.primary),
      ),
    );
  }
}

class _SkillsCard extends StatelessWidget {
  const _SkillsCard({required this.skills});

  final List<SkillDto> skills;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Skills', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            if (skills.isEmpty)
              Text(
                'No skills listed yet.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: skills
                    .map(
                      (skill) => _SkillChip(
                        label: skill.skillName,
                        category: skill.category,
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _PublicAnalysisCard extends StatelessWidget {
  const _PublicAnalysisCard({required this.analysis});

  final PortfolioAnalysisDto analysis;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('Portfolio Analysis', style: AppTextStyles.titleMedium),
              ],
            ),
            if (analysis.summary?.trim().isNotEmpty ?? false) ...[
              const SizedBox(height: 12),
              Text(
                analysis.summary!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
            if (analysis.repoAnalyses.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...analysis.repoAnalyses.map(
                (repo) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _RepoAnalysisTile(repo: repo),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RepoAnalysisTile extends StatelessWidget {
  const _RepoAnalysisTile({required this.repo});

  final RepoAnalysisDto repo;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(repo.repositoryName, style: AppTextStyles.titleSmall),
          if (repo.objective.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              repo.objective,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 8),
          if (repo.techStacks.isEmpty)
            Text(
              'Tech stack not specified',
              style: AppTextStyles.labelSmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            )
          else
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: repo.techStacks
                  .map((stack) => Chip(label: Text(stack)))
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _PublicReposCard extends StatelessWidget {
  const _PublicReposCard({required this.repositories});

  final List<GitHubRepositoryDto> repositories;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('GitHub Projects', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            if (repositories.isEmpty)
              Text(
                'No public repositories.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              )
            else
              ...repositories.map(
                (repo) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _PublicRepoTile(repo: repo),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PublicRepoTile extends StatelessWidget {
  const _PublicRepoTile({required this.repo});

  final GitHubRepositoryDto repo;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _openUrl(context, repo.repoUrl),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.folder_outlined,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    repo.repositoryName,
                    style: AppTextStyles.titleSmall.copyWith(
                      color: AppColors.primary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(Icons.open_in_new, size: 16),
              ],
            ),
            if (repo.description?.trim().isNotEmpty ?? false) ...[
              const SizedBox(height: 8),
              Text(
                repo.description!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              repo.repoUrl,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillChip extends StatelessWidget {
  const _SkillChip({required this.label, required this.category});

  final String label;
  final String category;

  @override
  Widget build(BuildContext context) {
    final color = _skillColor(category);
    return Chip(
      label: Text(label),
      backgroundColor: color.withValues(alpha: 0.12),
      side: BorderSide(color: color.withValues(alpha: 0.28)),
      labelStyle: AppTextStyles.labelMedium.copyWith(color: color),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
    );
  }
}

class _LinkChip extends StatelessWidget {
  const _LinkChip({
    required this.icon,
    required this.label,
    required this.url,
  });

  final IconData icon;
  final String label;
  final String url;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      onPressed: () => _openUrl(context, url),
    );
  }
}

class _PublicPortfolioSkeleton extends StatelessWidget {
  const _PublicPortfolioSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 160),
        SizedBox(height: 12),
        SkeletonCard(height: 120),
        SizedBox(height: 12),
        SkeletonCard(height: 220),
      ],
    );
  }
}

Future<void> _openUrl(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null && await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
    return;
  }
  if (context.mounted) {
    AppSnackbar.showError(context, 'Could not open link');
  }
}

Color _skillColor(String category) {
  final normalized = category.toLowerCase();
  if (normalized.contains('frontend')) return AppColors.primary;
  if (normalized.contains('backend')) return AppColors.success;
  if (normalized.contains('database')) return AppColors.warning;
  if (normalized.contains('devops')) return AppColors.nodeStatusSkippedText;
  if (normalized.contains('testing')) return AppColors.nodeStatusInProgressText;
  return AppColors.onSurfaceVariant;
}
