import 'dart:async';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/models/job_trend_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/market_pulse_provider.dart';

enum _TrendSort { scoreDesc, scoreAsc, nameAsc, dateDesc }

class MarketPulseScreen extends ConsumerStatefulWidget {
  const MarketPulseScreen({super.key});

  @override
  ConsumerState<MarketPulseScreen> createState() => _MarketPulseScreenState();
}

class _MarketPulseScreenState extends ConsumerState<MarketPulseScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  String _query = '';
  _TrendSort _sort = _TrendSort.scoreDesc;
  String _sourceFilter = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim().toLowerCase());
    });
  }

  @override
  Widget build(BuildContext context) {
    final market = ref.watch(marketPulseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Market Pulse'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => showDialog<void>(
              context: context,
              builder: (context) => const AlertDialog(
                title: Text('Market Pulse'),
                content: Text(
                  'Trend scores summarize recent demand signals for technical skills.',
                ),
              ),
            ),
          ),
        ],
      ),
      body: market.when(
        loading: () => const _MarketSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load market trends',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(marketPulseProvider),
        ),
        data: (data) {
          final sources = data.regionalTrends
              .map((trend) => trend.source)
              .whereType<String>()
              .where((source) => source.isNotEmpty)
              .toSet()
              .toList()
            ..sort();
          final selectedSource =
              sources.contains(_sourceFilter) ? _sourceFilter : '';
          final sourceFiltered = selectedSource.isEmpty
              ? data.regionalTrends
              : data.regionalTrends
                  .where((trend) => trend.source == selectedSource)
                  .toList();
          final list = _sorted(_filtered(sourceFiltered));
          final topChartSkills = _query.isEmpty
              ? data.topSkills
              : data.topSkills
                  .where(
                    (trend) => trend.techSkill.toLowerCase().contains(_query),
                  )
                  .toList();
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(marketPulseProvider);
              await ref.read(marketPulseProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                Text(
                  'Real-time demand data for software engineering skills.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                const _RegionChips(),
                const SizedBox(height: 16),
                _TopTrendingSection(trends: topChartSkills.take(10).toList()),
                const SizedBox(height: 16),
                _TrendAreaSection(trends: data.regionalTrends),
                const SizedBox(height: 16),
                _SearchSortToolbar(
                  controller: _searchController,
                  sort: _sort,
                  sources: sources,
                  selectedSource: selectedSource,
                  onSearchChanged: _onSearchChanged,
                  onSortChanged: (value) => setState(() => _sort = value),
                  onSourceChanged: (value) =>
                      setState(() => _sourceFilter = value),
                ),
                const SizedBox(height: 12),
                if (list.isEmpty)
                  EmptyStateView(
                    icon: Icons.search_off,
                    title: 'No matching trends',
                    subtitle: 'Try a different search or region.',
                    actionLabel: 'Clear Search',
                    onAction: () {
                      _searchController.clear();
                      setState(() => _query = '');
                    },
                  )
                else
                  ...list.map((trend) => TrendSkillCard(trend: trend)),
              ],
            ),
          );
        },
      ),
    );
  }

  List<JobTrendDto> _filtered(List<JobTrendDto> trends) {
    if (_query.isEmpty) return [...trends];
    return trends
        .where((trend) => trend.techSkill.toLowerCase().contains(_query))
        .toList();
  }

  List<JobTrendDto> _sorted(List<JobTrendDto> trends) {
    return trends
      ..sort((a, b) {
        return switch (_sort) {
          _TrendSort.scoreDesc => b.trendScore.compareTo(a.trendScore),
          _TrendSort.scoreAsc => a.trendScore.compareTo(b.trendScore),
          _TrendSort.nameAsc => a.techSkill.compareTo(b.techSkill),
          _TrendSort.dateDesc => b.snapshotDate.compareTo(a.snapshotDate),
        };
      });
  }
}

class _RegionChips extends ConsumerWidget {
  const _RegionChips();

  static const regions = ['Vietnam', 'Singapore', 'Thailand', 'Global'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedMarketRegionProvider);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: regions
              .map(
                (region) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(region),
                    selected: selected == region,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    onSelected: (_) => ref
                        .read(selectedMarketRegionProvider.notifier)
                        .state = region,
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _TopTrendingSection extends StatelessWidget {
  const _TopTrendingSection({required this.trends});

  final List<JobTrendDto> trends;

  @override
  Widget build(BuildContext context) {
    final region = trends.isEmpty ? 'Global' : trends.first.region ?? 'Global';
    return _SectionCard(
      title: 'Top Trending Skills',
      subtitle: region,
      child: trends.isEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  'No data available for this region.',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          : SizedBox(
              height: 280,
              child: BarChart(
                BarChartData(
                  maxY: 100,
                  alignment: BarChartAlignment.spaceAround,
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) => const FlLine(
                      color: AppColors.outlineVariant,
                      strokeWidth: 1,
                      dashArray: [3, 3],
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 36,
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 54,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index < 0 || index >= trends.length) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            angle: -0.72,
                            child: SizedBox(
                              width: 74,
                              child: Text(
                                trends[index].techSkill,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppTextStyles.labelSmall,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < trends.length; i++)
                      BarChartGroupData(
                        x: i,
                        barRods: [
                          BarChartRodData(
                            toY: trends[i].trendScore,
                            width: 18,
                            borderRadius: BorderRadius.circular(4),
                            color: _skillColor(trends[i].techSkill).accent,
                          ),
                        ],
                      ),
                  ],
                  barTouchData: BarTouchData(
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipColor: (_) => AppColors.surface,
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        final trend = trends[group.x.toInt()];
                        return BarTooltipItem(
                          '${trend.techSkill}\nScore: ${rod.toY.round()}',
                          AppTextStyles.labelSmall,
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _TrendAreaSection extends StatelessWidget {
  const _TrendAreaSection({required this.trends});

  final List<JobTrendDto> trends;

  @override
  Widget build(BuildContext context) {
    final history = _buildTrendHistory(trends);
    return _SectionCard(
      title: 'Trend Over Time',
      subtitle: trends.isEmpty ? 'Global' : trends.first.region ?? 'Global',
      child: history.points.length < 2
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  'Trend history builds up after weekly scrapes run.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          : SizedBox(
              height: 280,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: 100,
                  gridData: FlGridData(
                    getDrawingHorizontalLine: (_) => const FlLine(
                      color: AppColors.outlineVariant,
                      strokeWidth: 1,
                      dashArray: [3, 3],
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 34,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index < 0 || index >= history.points.length) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              DateFormat('MM/dd').format(
                                DateTime.parse(history.points[index].date),
                              ),
                              style: AppTextStyles.labelSmall,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  lineTouchData: const LineTouchData(enabled: true),
                  lineBarsData: [
                    for (var i = 0; i < history.skills.length; i++)
                      LineChartBarData(
                        spots: [
                          for (var pointIndex = 0;
                              pointIndex < history.points.length;
                              pointIndex++)
                            FlSpot(
                              pointIndex.toDouble(),
                              history.points[pointIndex]
                                      .scores[history.skills[i]] ??
                                  0,
                            ),
                        ],
                        isCurved: true,
                        color: _areaSeriesColors[i % _areaSeriesColors.length]
                            .stroke,
                        barWidth: 3,
                        belowBarData: BarAreaData(
                          show: true,
                          color: _areaSeriesColors[i % _areaSeriesColors.length]
                              .fill,
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _SearchSortToolbar extends StatelessWidget {
  const _SearchSortToolbar({
    required this.controller,
    required this.sort,
    required this.sources,
    required this.selectedSource,
    required this.onSearchChanged,
    required this.onSortChanged,
    required this.onSourceChanged,
  });

  final TextEditingController controller;
  final _TrendSort sort;
  final List<String> sources;
  final String selectedSource;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<_TrendSort> onSortChanged;
  final ValueChanged<String> onSourceChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        SizedBox(
          width: MediaQuery.sizeOf(context).width - 32,
          child: AppTextField(
            controller: controller,
            label: 'Search skills',
            prefixIcon: const Icon(Icons.search),
            onChanged: onSearchChanged,
          ),
        ),
        DropdownButton<_TrendSort>(
          value: sort,
          onChanged: (value) {
            if (value != null) onSortChanged(value);
          },
          items: const [
            DropdownMenuItem(
              value: _TrendSort.scoreDesc,
              child: Text('Score ↓'),
            ),
            DropdownMenuItem(
                value: _TrendSort.scoreAsc, child: Text('Score ↑')),
            DropdownMenuItem(
                value: _TrendSort.nameAsc, child: Text('Name A-Z')),
            DropdownMenuItem(value: _TrendSort.dateDesc, child: Text('Date ↓')),
          ],
        ),
        if (sources.isNotEmpty)
          DropdownButton<String>(
            value: selectedSource,
            onChanged: (value) {
              if (value != null) onSourceChanged(value);
            },
            items: [
              const DropdownMenuItem(value: '', child: Text('All Sources')),
              ...sources.map(
                (source) => DropdownMenuItem(
                  value: source,
                  child: Text(source),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class TrendSkillCard extends StatelessWidget {
  const TrendSkillCard({super.key, required this.trend});

  final JobTrendDto trend;

  @override
  Widget build(BuildContext context) {
    final colors = _skillColor(trend.techSkill);
    final date = DateTime.tryParse(trend.snapshotDate);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child:
                      Text(trend.techSkill, style: AppTextStyles.titleSmall)),
              Text(
                trend.trendScore.round().toString(),
                style: AppTextStyles.displayMedium.copyWith(color: colors.text),
              ),
              Text(
                '/100',
                style: AppTextStyles.titleMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            children: [
              _Badge(label: trend.region ?? 'Global'),
              _Badge(label: trend.source ?? 'Market', monospace: true),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressBar(
            value: (trend.trendScore / 100).clamp(0, 1),
            color: colors.accent,
          ),
          if (date != null) ...[
            const SizedBox(height: 8),
            Text(
              'Snapshot ${DateFormat.yMMMd().format(date)}',
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

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child, this.subtitle});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
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
          Text(title, style: AppTextStyles.titleMedium),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, this.monospace = false});

  final String label;
  final bool monospace;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          color: AppColors.onSurfaceVariant,
          fontFamily: monospace ? 'monospace' : null,
        ),
      ),
    );
  }
}

class _TrendHistoryPoint {
  const _TrendHistoryPoint({required this.date, required this.scores});

  final String date;
  final Map<String, double> scores;
}

({List<String> skills, List<_TrendHistoryPoint> points}) _buildTrendHistory(
  List<JobTrendDto> trends,
) {
  if (trends.isEmpty) {
    return (skills: const [], points: const []);
  }

  final latestDate = trends
      .map((trend) => trend.snapshotDate)
      .reduce((a, b) => a.compareTo(b) > 0 ? a : b);
  final latestScores = <String, double>{};
  for (final trend in trends) {
    if (trend.snapshotDate != latestDate) continue;
    latestScores[trend.techSkill] = [
      latestScores[trend.techSkill] ?? 0,
      trend.trendScore,
    ].reduce((a, b) => a > b ? a : b);
  }

  final topSkills = latestScores.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  final skills = topSkills.take(3).map((entry) => entry.key).toList();
  final byDate = <String, Map<String, double>>{};
  for (final trend in trends) {
    if (!skills.contains(trend.techSkill)) continue;
    final dateKey = trend.snapshotDate.split('T').first;
    (byDate[dateKey] ??= {})[trend.techSkill] = trend.trendScore;
  }

  final points = byDate.entries
      .map((entry) => _TrendHistoryPoint(date: entry.key, scores: entry.value))
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));
  return (skills: skills, points: points);
}

({Color background, Color border, Color text, Color accent}) _skillColor(
  String label,
) {
  final palettes = [
    (
      background: const Color(0xFFE8F0FE),
      border: const Color(0xFFB8D0FA),
      text: const Color(0xFF1A73E8),
      accent: const Color(0xFF1A73E8),
    ),
    (
      background: const Color(0xFFE6F4EA),
      border: const Color(0xFFB7DFC0),
      text: const Color(0xFF188038),
      accent: const Color(0xFF34A853),
    ),
    (
      background: const Color(0xFFF3E8FD),
      border: const Color(0xFFD8B4F8),
      text: const Color(0xFF7B1FA2),
      accent: const Color(0xFF7B1FA2),
    ),
    (
      background: const Color(0xFFFFF4D6),
      border: const Color(0xFFFFD166),
      text: const Color(0xFF8A5A00),
      accent: const Color(0xFFFBBC04),
    ),
  ];
  final hash = label.codeUnits.fold<int>(0, (sum, code) => sum + code);
  return palettes[hash.abs() % palettes.length];
}

class _MarketSkeleton extends StatelessWidget {
  const _MarketSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 44),
        SkeletonCard(height: 260),
        SkeletonCard(height: 260),
        SkeletonCard(height: 120),
      ],
    );
  }
}

const _areaSeriesColors = [
  (stroke: Color(0xFF1A73E8), fill: Color(0xFFE8F0FE)),
  (stroke: Color(0xFF34A853), fill: Color(0xFFE6F4EA)),
  (stroke: Color(0xFF7B1FA2), fill: Color(0xFFF3E8FD)),
];
