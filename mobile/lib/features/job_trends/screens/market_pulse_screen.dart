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
          if (_sourceFilter.isNotEmpty && !sources.contains(_sourceFilter)) {
            _sourceFilter = '';
          }
          final sourceFiltered = _sourceFilter.isEmpty
              ? data.regionalTrends
              : data.regionalTrends
                  .where((trend) => trend.source == _sourceFilter)
                  .toList();
          final list = _sorted(_filtered(sourceFiltered));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(marketPulseProvider);
              await ref.read(marketPulseProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                const _RegionChips(),
                const SizedBox(height: 16),
                _TopTrendingSection(trends: data.topSkills.take(5).toList()),
                const SizedBox(height: 16),
                _TrendAreaSection(trends: data.regionalTrends),
                const SizedBox(height: 16),
                _SearchSortToolbar(
                  controller: _searchController,
                  sort: _sort,
                  sourceFilter: _sourceFilter,
                  sources: sources,
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
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: regions
            .map(
              (region) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(region),
                  selected: selected == region,
                  onSelected: (_) => ref
                      .read(selectedMarketRegionProvider.notifier)
                      .state = region,
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _TopTrendingSection extends StatelessWidget {
  const _TopTrendingSection({required this.trends});

  final List<JobTrendDto> trends;

  @override
  Widget build(BuildContext context) {
    final updated = trends.isEmpty
        ? ''
        : DateFormat('MMM d').format(DateTime.parse(trends.first.snapshotDate));
    return _SectionCard(
      title: 'Top Trending Skills',
      subtitle: updated.isEmpty ? null : 'Updated $updated',
      child: trends.isEmpty
          ? const EmptyStateView(
              icon: Icons.trending_up_outlined,
              title: 'No trending data',
              subtitle: 'Market data will appear after job snapshots run.',
            )
          : SizedBox(
              height: 240,
              child: BarChart(
                BarChartData(
                  maxY: 100,
                  alignment: BarChartAlignment.spaceAround,
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) => const FlLine(
                      color: AppColors.outlineVariant,
                      strokeWidth: 0.6,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 48,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index < 0 || index >= trends.length) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: SizedBox(
                              width: 58,
                              child: Text(
                                trends[index].techSkill,
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
                    for (var i = 0; i < trends.length; i++)
                      BarChartGroupData(
                        x: i,
                        barRods: [
                          BarChartRodData(
                            toY: trends[i].trendScore.clamp(0, 100),
                            width: 18,
                            borderRadius: BorderRadius.circular(4),
                            color: _palette[i % _palette.length],
                          ),
                        ],
                      ),
                  ],
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
      child: history.points.length < 2
          ? const EmptyStateView(
              icon: Icons.timeline,
              title: 'Trend history is building',
              subtitle: 'History appears after multiple snapshots exist.',
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 240,
                  child: LineChart(
                    LineChartData(
                      minY: 0,
                      maxY: 100,
                      gridData: FlGridData(
                        getDrawingHorizontalLine: (_) => const FlLine(
                          color: AppColors.outlineVariant,
                          strokeWidth: 1,
                          dashArray: [4, 4],
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        topTitles: const AxisTitles(),
                        rightTitles: const AxisTitles(),
                        leftTitles: const AxisTitles(
                          sideTitles:
                              SideTitles(showTitles: true, reservedSize: 34),
                        ),
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
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  DateFormat('M/d').format(
                                    history.points[index].date,
                                  ),
                                  style: AppTextStyles.labelSmall,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      lineBarsData: [
                        for (var i = 0; i < history.skills.length; i++)
                          LineChartBarData(
                            spots: [
                              for (var x = 0; x < history.points.length; x++)
                                if (history.points[x].scores
                                    .containsKey(history.skills[i]))
                                  FlSpot(
                                    x.toDouble(),
                                    history
                                        .points[x].scores[history.skills[i]]!,
                                  ),
                            ],
                            isCurved: true,
                            color: _palette[i % _palette.length],
                            barWidth: 3,
                            dotData: const FlDotData(show: true),
                            belowBarData: BarAreaData(
                              show: true,
                              color: _palette[i % _palette.length]
                                  .withValues(alpha: 0.12),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _TrendLegend(skills: history.skills),
              ],
            ),
    );
  }
}

class _TrendLegend extends StatelessWidget {
  const _TrendLegend({required this.skills});

  final List<String> skills;

  @override
  Widget build(BuildContext context) {
    if (skills.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (var i = 0; i < skills.length; i++)
          _Badge(label: skills[i], color: _palette[i % _palette.length]),
      ],
    );
  }
}

class _SearchSortToolbar extends StatelessWidget {
  const _SearchSortToolbar({
    required this.controller,
    required this.sort,
    required this.sourceFilter,
    required this.sources,
    required this.onSearchChanged,
    required this.onSortChanged,
    required this.onSourceChanged,
  });

  final TextEditingController controller;
  final _TrendSort sort;
  final String sourceFilter;
  final List<String> sources;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<_TrendSort> onSortChanged;
  final ValueChanged<String> onSourceChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: AppTextField(
                controller: controller,
                label: 'Search skills',
                prefixIcon: const Icon(Icons.search),
                onChanged: onSearchChanged,
              ),
            ),
            const SizedBox(width: 12),
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
                DropdownMenuItem(
                    value: _TrendSort.dateDesc, child: Text('Date ↓')),
              ],
            ),
          ],
        ),
        if (sources.isNotEmpty) ...[
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: DropdownButton<String>(
              value: sourceFilter,
              onChanged: (value) => onSourceChanged(value ?? ''),
              items: [
                const DropdownMenuItem(value: '', child: Text('All Sources')),
                for (final source in sources)
                  DropdownMenuItem(value: source, child: Text(source)),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class TrendSkillCard extends StatelessWidget {
  const TrendSkillCard({super.key, required this.trend});

  final JobTrendDto trend;

  @override
  Widget build(BuildContext context) {
    final scoreColor = trend.trendScore >= 70
        ? AppColors.success
        : trend.trendScore >= 40
            ? AppColors.warning
            : AppColors.error;
    final date = DateTime.tryParse(trend.snapshotDate);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
                  child:
                      Text(trend.techSkill, style: AppTextStyles.titleSmall)),
              Text(
                trend.trendScore.round().toString(),
                style: AppTextStyles.displayMedium.copyWith(color: scoreColor),
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
            color: scoreColor,
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
  const _Badge({required this.label, this.monospace = false, this.color});

  final String label;
  final bool monospace;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color?.withValues(alpha: 0.14) ?? AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          color: color ?? AppColors.onSurfaceVariant,
          fontFamily: monospace ? 'monospace' : null,
        ),
      ),
    );
  }
}

_TrendHistory _buildTrendHistory(List<JobTrendDto> trends) {
  if (trends.isEmpty) return const _TrendHistory(skills: [], points: []);

  final parsed = trends
      .map(
          (trend) => _ParsedTrend(trend, DateTime.tryParse(trend.snapshotDate)))
      .where((item) => item.date != null)
      .toList();
  if (parsed.isEmpty) return const _TrendHistory(skills: [], points: []);

  parsed.sort((a, b) => a.date!.compareTo(b.date!));
  final latestDay = DateTime(
    parsed.last.date!.year,
    parsed.last.date!.month,
    parsed.last.date!.day,
  );

  final latestScores = <String, double>{};
  for (final item in parsed) {
    final day = DateTime(item.date!.year, item.date!.month, item.date!.day);
    if (day != latestDay) continue;
    final skill = item.trend.techSkill;
    final previous = latestScores[skill] ?? 0;
    if (item.trend.trendScore > previous) {
      latestScores[skill] = item.trend.trendScore;
    }
  }

  final skills = latestScores.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  final topSkills = skills.take(3).map((entry) => entry.key).toList();
  if (topSkills.isEmpty) return const _TrendHistory(skills: [], points: []);

  final byDay = <DateTime, Map<String, double>>{};
  for (final item in parsed) {
    if (!topSkills.contains(item.trend.techSkill)) continue;
    final day = DateTime(item.date!.year, item.date!.month, item.date!.day);
    byDay.putIfAbsent(day, () => <String, double>{});
    final scores = byDay[day]!;
    final previous = scores[item.trend.techSkill] ?? 0;
    if (item.trend.trendScore > previous) {
      scores[item.trend.techSkill] = item.trend.trendScore;
    }
  }

  final points = byDay.entries
      .map((entry) => _TrendHistoryPoint(entry.key, entry.value))
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));
  return _TrendHistory(skills: topSkills, points: points);
}

class _ParsedTrend {
  const _ParsedTrend(this.trend, this.date);

  final JobTrendDto trend;
  final DateTime? date;
}

class _TrendHistory {
  const _TrendHistory({required this.skills, required this.points});

  final List<String> skills;
  final List<_TrendHistoryPoint> points;
}

class _TrendHistoryPoint {
  const _TrendHistoryPoint(this.date, this.scores);

  final DateTime date;
  final Map<String, double> scores;
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

const _palette = [
  AppColors.primaryContainer,
  Color(0xFF00897B),
  AppColors.warning,
  Color(0xFF7B1FA2),
  AppColors.success,
];
