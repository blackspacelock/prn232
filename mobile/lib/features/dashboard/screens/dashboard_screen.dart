import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../../core/widgets/status_chip.dart';
import '../../roadmap/providers/roadmap_providers.dart';

final _announcementProvider = FutureProvider<String>((ref) async {
  if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return '';

  final config = FirebaseRemoteConfig.instance;
  await config.setDefaults(const {'dashboard_announcement': ''});
  await config.setConfigSettings(
    RemoteConfigSettings(
      fetchTimeout: const Duration(seconds: 10),
      minimumFetchInterval:
          kDebugMode ? Duration.zero : const Duration(hours: 1),
    ),
  );
  try {
    await config.fetchAndActivate();
  } catch (_) {
    // Keep the in-app default when Remote Config is unavailable.
  }
  return config.getString('dashboard_announcement').trim();
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardDataProvider);
    final announcement = ref.watch(_announcementProvider).valueOrNull ?? '';
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
          onRefresh: () async {
            ref.invalidate(dashboardDataProvider);
            ref.invalidate(_announcementProvider);
            await Future.wait([
              ref.read(dashboardDataProvider.future),
              ref.read(_announcementProvider.future),
            ]);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (announcement.isNotEmpty) ...[
                _AnnouncementBanner(message: announcement),
                const SizedBox(height: 16),
              ],
              _StatsGrid(data: data),
              const SizedBox(height: 24),
              _RoadmapsSection(roadmaps: data.roadmaps),
              const SizedBox(height: 24),
              _SkillGapSnapshot(
                activeRoadmap: data.activeRoadmap,
                categories: data.skillGapCategories,
              ),
              const SizedBox(height: 24),
              _TrendingSkills(skills: data.trendingSkills),
              const SizedBox(height: 24),
              _RecentMentorSessions(sessions: data.recentMentorSessions),
              const SizedBox(height: 24),
              const _QuickActionsGrid(),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnnouncementBanner extends StatelessWidget {
  const _AnnouncementBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryContainer),
      ),
      child: Row(
        children: [
          const Icon(Icons.campaign_outlined, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(message, style: AppTextStyles.bodyMedium)),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.55,
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
      width: double.infinity,
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
            height: 186,
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
            const SizedBox(height: 8),
            Text(
              roadmap.careerRoadmap?.careerRole?.name ?? 'Software Engineering',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const Spacer(),
            Align(
              alignment: Alignment.centerLeft,
              child: StatusChip(
                status: roadmap.progressPercentage >= 100
                    ? 4
                    : roadmap.progressPercentage > 0
                        ? 1
                        : 0,
                label: roadmap.progressPercentage >= 100
                    ? 'Completed'
                    : roadmap.progressPercentage > 0
                        ? 'In Progress'
                        : 'Not Started',
              ),
            ),
            const SizedBox(height: 10),
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
  const _SkillGapSnapshot({
    required this.activeRoadmap,
    required this.categories,
  });

  final PersonalRoadmapDto? activeRoadmap;
  final List<SkillGapCategory> categories;

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
              onAction: () => context.go('/roadmaps'),
            )
          : InkWell(
              onTap: () => context.go('/skill-gap/select'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 320,
                    child: RadarChart(
                      RadarChartData(
                        radarShape: RadarShape.polygon,
                        radarBorderData:
                            const BorderSide(color: AppColors.outlineVariant),
                        tickBorderData:
                            const BorderSide(color: AppColors.outlineVariant),
                        gridBorderData:
                            const BorderSide(color: AppColors.outlineVariant),
                        tickCount: 4,
                        ticksTextStyle:
                            const TextStyle(color: Colors.transparent),
                        titlePositionPercentageOffset: 0.2,
                        getTitle: (index, angle) {
                          final label = categories[index].name;
                          final displayLabel = label.length > 14
                              ? '${label.substring(0, 12)}…'
                              : label;
                          return RadarChartTitle(
                            text: displayLabel,
                            angle: angle + 90,
                          );
                        },
                        titleTextStyle: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.onSurfaceVariant,
                          fontSize: 10,
                        ),
                        dataSets: [
                          RadarDataSet(
                            dataEntries: categories
                                .map((category) =>
                                    RadarEntry(value: category.current))
                                .toList(),
                            fillColor:
                                const Color(0xFF1A73E8).withValues(alpha: 0.2),
                            borderColor: const Color(0xFF1A73E8),
                            borderWidth: 2,
                          ),
                          RadarDataSet(
                            dataEntries: categories
                                .map((category) =>
                                    RadarEntry(value: category.required))
                                .toList(),
                            fillColor:
                                const Color(0xFFFBBC04).withValues(alpha: 0.15),
                            borderColor: const Color(0xFFFBBC04),
                            borderWidth: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      _LegendDot(
                        color: Color(0xFF1A73E8),
                        label: 'Your Skills',
                      ),
                      SizedBox(width: 16),
                      _LegendDot(color: Color(0xFFFBBC04), label: 'Required'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap to inspect missing skills for your active roadmap.',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: AppTextStyles.labelSmall),
      ],
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
      child: SizedBox(
        height: 220,
        child: BarChart(
          BarChartData(
            alignment: BarChartAlignment.spaceAround,
            maxY: 1,
            minY: 0,
            gridData: FlGridData(
              drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => const FlLine(
                color: AppColors.outlineVariant,
                strokeWidth: 0.6,
              ),
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              topTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              rightTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 48,
                  getTitlesWidget: (value, meta) {
                    final index = value.toInt();
                    if (index < 0 || index >= skills.length) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: SizedBox(
                        width: 54,
                        child: Text(
                          skills[index].name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.labelSmall,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            barGroups: [
              for (var i = 0; i < skills.length; i++)
                BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: skills[i].score,
                      width: 18,
                      borderRadius: BorderRadius.circular(6),
                      color: _rankColor(i),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Color _rankColor(int index) {
    return switch (index) {
      0 => AppColors.primary,
      1 => AppColors.secondaryContainer,
      2 => AppColors.success,
      3 => AppColors.warning,
      _ => AppColors.outline,
    };
  }
}

class _RecentMentorSessions extends StatelessWidget {
  const _RecentMentorSessions({required this.sessions});

  final List<MentorSessionSummary> sessions;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Recent AI Mentor Sessions',
      child: Column(
        children: sessions
            .take(2)
            .map(
              (session) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F0FE),
                  child:
                      Icon(Icons.smart_toy_outlined, color: AppColors.primary),
                ),
                title: Text(session.title),
                subtitle: Text(
                  session.preview,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  session.dateLabel,
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                onTap: () => context.go('/mentor'),
              ),
            )
            .toList(),
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
