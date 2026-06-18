import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../../core/widgets/status_chip.dart';
import '../../roadmap/providers/roadmap_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardDataProvider);
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back', style: AppTextStyles.labelLarge),
            Text('Keep moving toward job-ready.',
                style: AppTextStyles.bodySmall),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: CircleAvatar(
              backgroundColor: AppColors.primaryContainer,
              child: Icon(Icons.person, color: Colors.white),
            ),
          ),
        ],
      ),
      body: dashboard.when(
        loading: () => const _DashboardSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load dashboard',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(dashboardDataProvider),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dashboardDataProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _StatsScroller(data: data),
              const SizedBox(height: 24),
              _RoadmapsSection(roadmaps: data.roadmaps),
              const SizedBox(height: 24),
              _SkillGapSnapshot(activeRoadmap: data.activeRoadmap),
              const SizedBox(height: 24),
              _TrendingSkills(skills: data.trendingSkills),
              const SizedBox(height: 24),
              const _RecentMentorSessions(),
              const SizedBox(height: 24),
              const _QuickActionsGrid(),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsScroller extends StatelessWidget {
  const _StatsScroller({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 112,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _StatCard(
              icon: Icons.map_outlined,
              value: '${data.roadmapCount}',
              label: 'My Roadmaps'),
          _StatCard(
              icon: Icons.show_chart,
              value: '${data.averageProgress.round()}%',
              label: 'Avg Progress'),
          _StatCard(
              icon: Icons.psychology_outlined,
              value: '${data.skillsCount}',
              label: 'My Skills'),
          _StatCard(
              icon: Icons.folder_special_outlined,
              value: '${data.repositoryCount}',
              label: 'GitHub Repos'),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(
      {required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 148,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary),
          const Spacer(),
          Text(value,
              style: AppTextStyles.headlineMedium
                  .copyWith(color: AppColors.primary)),
          Text(label,
              style: AppTextStyles.labelSmall
                  .copyWith(color: AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _RoadmapsSection extends StatelessWidget {
  const _RoadmapsSection({required this.roadmaps});

  final List<PersonalRoadmapDto> roadmaps;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: 'My Roadmaps',
          actionLabel: 'New',
          onAction: () => context.go('/career-roles'),
        ),
        const SizedBox(height: 12),
        if (roadmaps.isEmpty)
          EmptyStateView(
            icon: Icons.map_outlined,
            title: 'No roadmaps yet',
            subtitle: 'Choose a career role to generate your first path.',
            actionLabel: 'Choose Role',
            onAction: () => context.go('/career-roles'),
          )
        else
          SizedBox(
            height: 150,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: roadmaps.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) =>
                  _RoadmapSummaryCard(roadmap: roadmaps[index]),
            ),
          ),
      ],
    );
  }
}

class _RoadmapSummaryCard extends StatelessWidget {
  const _RoadmapSummaryCard({required this.roadmap});

  final PersonalRoadmapDto roadmap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/roadmap/${roadmap.personalRoadmapId}'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 260,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    roadmap.careerRoadmap?.name ?? 'Personal Roadmap',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.titleSmall,
                  ),
                ),
                if (roadmap.isActive)
                  const StatusChip(status: 1, label: 'Active'),
              ],
            ),
            const Spacer(),
            Text('${roadmap.progressPercentage.round()}% complete',
                style: AppTextStyles.labelSmall),
            const SizedBox(height: 8),
            LinearProgressBar(value: roadmap.progressPercentage / 100),
          ],
        ),
      ),
    );
  }
}

class _SkillGapSnapshot extends StatelessWidget {
  const _SkillGapSnapshot({required this.activeRoadmap});

  final PersonalRoadmapDto? activeRoadmap;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Skill Gap Snapshot',
      child: activeRoadmap == null
          ? EmptyStateView(
              icon: Icons.radar,
              title: 'Set an active roadmap',
              subtitle: 'Generate a roadmap to unlock skill-gap analysis.',
              actionLabel: 'Choose Role',
              onAction: () => context.go('/career-roles'),
            )
          : InkWell(
              onTap: () => context.go('/skill-gap/select'),
              child: Column(
                children: [
                  const Icon(Icons.radar, size: 72, color: AppColors.primary),
                  const SizedBox(height: 12),
                  Text('Your skills cover about 58% of this roadmap.',
                      style: AppTextStyles.bodyMedium),
                  const SizedBox(height: 12),
                  const LinearProgressBar(
                      value: 0.58, color: AppColors.primary),
                ],
              ),
            ),
    );
  }
}

class _TrendingSkills extends StatelessWidget {
  const _TrendingSkills({required this.skills});

  final List<SkillTrend> skills;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Trending Skills',
      actionLabel: 'View all',
      onAction: () => context.go('/market-pulse'),
      child: Column(
        children: skills
            .map(
              (skill) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    SizedBox(
                        width: 100,
                        child:
                            Text(skill.name, style: AppTextStyles.labelMedium)),
                    Expanded(
                        child: LinearProgressBar(
                            value: skill.score, color: AppColors.primary)),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _RecentMentorSessions extends StatelessWidget {
  const _RecentMentorSessions();

  @override
  Widget build(BuildContext context) {
    return const _Panel(
      title: 'Recent AI Mentor Sessions',
      child: Column(
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.smart_toy_outlined, color: AppColors.primary),
            title: Text('Roadmap planning'),
            subtitle:
                Text('How should I prioritize Flutter and backend practice?'),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.smart_toy_outlined, color: AppColors.primary),
            title: Text('Portfolio review'),
            subtitle: Text('Ideas for making my GitHub repos stronger.'),
          ),
        ],
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid();

  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickAction(Icons.map_outlined, 'Create Roadmap',
          () => context.go('/career-roles')),
      _QuickAction(Icons.analytics_outlined, 'Analyze Skills',
          () => context.go('/skill-gap/select')),
      _QuickAction(
          Icons.smart_toy_outlined, 'Ask Mentor', () => context.go('/mentor')),
      _QuickAction(Icons.trending_up_outlined, 'Market Pulse',
          () => context.go('/market-pulse')),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: actions.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.7,
      ),
      itemBuilder: (context, index) {
        final action = actions[index];
        return InkWell(
          onTap: action.onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(action.icon, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(action.label, style: AppTextStyles.labelLarge)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel(
      {required this.title,
      required this.child,
      this.actionLabel,
      this.onAction});

  final String title;
  final Widget child;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
            title: title, actionLabel: actionLabel, onAction: onAction),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.outlineVariant),
          ),
          child: child,
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text(title, style: AppTextStyles.titleMedium)),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class _QuickAction {
  const _QuickAction(this.icon, this.label, this.onTap);

  final IconData icon;
  final String label;
  final VoidCallback onTap;
}

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SkeletonCard(height: 112),
        SkeletonCard(height: 150),
        SkeletonCard(height: 180),
        SkeletonCard(height: 180),
      ],
    );
  }
}
