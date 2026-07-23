import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../roadmap/providers/roadmap_providers.dart';

class SkillGapAnalysisScreen extends ConsumerStatefulWidget {
  const SkillGapAnalysisScreen({
    super.key,
    required this.careerRoadmapId,
    this.autoAnalyze = false,
  });

  final String careerRoadmapId;
  final bool autoAnalyze;

  @override
  ConsumerState<SkillGapAnalysisScreen> createState() =>
      _SkillGapAnalysisScreenState();
}

class _SkillGapAnalysisScreenState
    extends ConsumerState<SkillGapAnalysisScreen> {
  bool _hasAnalyzed = false;

  @override
  void initState() {
    super.initState();
    _hasAnalyzed = widget.autoAnalyze;
  }

  void _analyze() {
    ref.invalidate(skillGapAnalysisProvider(widget.careerRoadmapId));
    ref.invalidate(trendingSkillRecommendationsProvider);
    setState(() => _hasAnalyzed = true);
  }

  @override
  Widget build(BuildContext context) {
    final analysis = _hasAnalyzed
        ? ref.watch(skillGapAnalysisProvider(widget.careerRoadmapId))
        : null;
    final trending = _hasAnalyzed
        ? ref.watch(trendingSkillRecommendationsProvider)
        : const AsyncValue<List<String>>.data([]);
    final roleName =
        ref.watch(selectedCareerRoleProvider)?.name ?? 'target role';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Skill Gap Analysis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: analysis?.valueOrNull == null
                ? null
                : () => Share.share(
                      _shareText(analysis!.valueOrNull!, roleName),
                    ),
          ),
        ],
      ),
      body: analysis == null
          ? _AnalyzePrompt(onAnalyze: _analyze)
          : analysis.when(
              loading: () => const _ResultSkeleton(),
              error: (error, _) => EmptyStateView(
                icon: Icons.error_outline,
                title: 'Could not run analysis',
                subtitle: error.toString(),
                actionLabel: 'Retry',
                onAction: _analyze,
              ),
              data: (data) => RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(
                      skillGapAnalysisProvider(widget.careerRoadmapId));
                  ref.invalidate(trendingSkillRecommendationsProvider);
                  await ref.read(
                      skillGapAnalysisProvider(widget.careerRoadmapId).future);
                },
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  children: [
                    AppButton(
                      label: 'Analyze Skill Gap',
                      leadingIcon: const Icon(Icons.analytics_outlined),
                      onPressed: _analyze,
                    ),
                    const SizedBox(height: 16),
                    _RadarSection(data: data),
                    const SizedBox(height: 16),
                    _CoverageCard(data: data, roleName: roleName),
                    const SizedBox(height: 20),
                    _SkillChipSection(
                      title: 'Skills You Have',
                      subtitle:
                          '${data.matchedSkills.length} of ${data.requiredSkills.length} required skills covered',
                      skills: data.matchedSkills,
                      background: AppColors.successContainer,
                      foreground: AppColors.success,
                    ),
                    const SizedBox(height: 16),
                    _SkillChipSection(
                      title: 'Skills to Develop',
                      skills: data.missingSkills,
                      background: const Color(0xFFFCE8E6),
                      foreground: const Color(0xFFD93025),
                    ),
                    trending.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.only(top: 16),
                        child: SkeletonCard(height: 72),
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                      data: (skills) => skills.isEmpty
                          ? const SizedBox.shrink()
                          : Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: _SkillChipSection(
                                title: 'Trending Recommendations',
                                subtitle:
                                    'Also consider learning these trending skills:',
                                skills: skills,
                                background: AppColors.nodeStatusInProgressFill,
                                foreground: AppColors.nodeStatusInProgressText,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  String _shareText(SkillGapAnalysisDto data, String roleName) {
    return 'SECompass Skill Gap for $roleName\n'
        'Coverage: ${data.coveragePercentage.round()}%\n'
        'Skills I have: ${data.matchedSkills.join(', ')}\n'
        'Skills to develop: ${data.missingSkills.join(', ')}';
  }
}

class _AnalyzePrompt extends StatelessWidget {
  const _AnalyzePrompt({required this.onAnalyze});

  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
      children: [
        EmptyStateView(
          icon: Icons.analytics_outlined,
          title: 'Ready to analyze',
          subtitle:
              'Run a fresh comparison between your current skills and this roadmap.',
          actionLabel: 'Analyze Skill Gap',
          onAction: onAnalyze,
        ),
      ],
    );
  }
}

class _CoverageCard extends StatelessWidget {
  const _CoverageCard({required this.data, required this.roleName});

  final SkillGapAnalysisDto data;
  final String roleName;

  @override
  Widget build(BuildContext context) {
    final isStrong = data.coveragePercentage >= 70;
    final color = isStrong ? AppColors.success : AppColors.error;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${data.coveragePercentage.round()}%',
            style: AppTextStyles.displayLarge.copyWith(color: color),
          ),
          const SizedBox(height: 4),
          Text(
            'Skills covered for $roleName',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          LinearProgressBar(
            value: (data.coveragePercentage / 100).clamp(0, 1),
            height: 8,
            color: AppColors.success,
          ),
          if (data.summary != null && data.summary!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              data.summary!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RadarSection extends StatelessWidget {
  const _RadarSection({required this.data});

  final SkillGapAnalysisDto data;

  @override
  Widget build(BuildContext context) {
    final breakdown = data.categoryBreakdown.isEmpty
        ? const [
            CategoryBreakdownDto(
              category: 'Skills',
              currentScore: 0,
              requiredScore: 1,
            ),
          ]
        : data.categoryBreakdown;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Category Coverage', style: AppTextStyles.titleMedium),
          const SizedBox(height: 12),
          SizedBox(
            height: 280,
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
                ticksTextStyle: const TextStyle(color: Colors.transparent),
                getTitle: (index, angle) => RadarChartTitle(
                  text: breakdown[index].category,
                  angle: angle,
                ),
                titleTextStyle: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
                dataSets: [
                  RadarDataSet(
                    dataEntries: breakdown
                        .map((item) => RadarEntry(value: item.currentScore))
                        .toList(),
                    fillColor: const Color(0xFF1A73E8).withValues(alpha: 0.2),
                    borderColor: const Color(0xFF1A73E8),
                    borderWidth: 2,
                  ),
                  RadarDataSet(
                    dataEntries: breakdown
                        .map((item) => RadarEntry(value: item.requiredScore))
                        .toList(),
                    fillColor: const Color(0xFFFBBC04).withValues(alpha: 0.15),
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
              _LegendDot(color: Color(0xFF1A73E8), label: 'Your Skills'),
              SizedBox(width: 16),
              _LegendDot(color: Color(0xFFFBBC04), label: 'Required'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SkillChipSection extends StatelessWidget {
  const _SkillChipSection({
    required this.title,
    required this.skills,
    required this.background,
    required this.foreground,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final List<String> skills;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTextStyles.titleMedium),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 10),
        if (skills.isEmpty)
          Text(
            'No skills in this group yet.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: skills
                .map(
                  (skill) => Chip(
                    label: Text(skill),
                    backgroundColor: background,
                    labelStyle:
                        AppTextStyles.labelMedium.copyWith(color: foreground),
                    side: BorderSide.none,
                  ),
                )
                .toList(),
          ),
      ],
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

class _ResultSkeleton extends StatelessWidget {
  const _ResultSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 140),
        SkeletonCard(height: 320),
        SkeletonCard(height: 96),
      ],
    );
  }
}
