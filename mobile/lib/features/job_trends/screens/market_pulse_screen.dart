import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/models/job_trend_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/market_pulse_provider.dart';

class MarketPulseScreen extends ConsumerWidget {
  const MarketPulseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final market = ref.watch(marketPulseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Market Pulse'),
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
          final region = ref.watch(selectedMarketRegionProvider);
          final demand = _buildDemandRows(data.regionalTrends);
          final movers = _buildMarketMovers(data.regionalTrends);
          final sourceCoverage = _buildSourceCoverage(data.regionalTrends);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(marketPulseProvider);
              await ref.read(marketPulseProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                Text('Market Pulse', style: AppTextStyles.titleLarge),
                const SizedBox(height: 4),
                Text(
                  'Real-time demand data for software engineering skills.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                const _RegionChips(),
                const SizedBox(height: 16),
                _SkillDemandSection(rows: demand, region: region),
                const SizedBox(height: 16),
                _MarketMoversSection(rows: movers),
                const SizedBox(height: 16),
                _TrendAreaSection(trends: data.regionalTrends, region: region),
                const SizedBox(height: 16),
                _SourceCoverageSection(sources: sourceCoverage),
              ],
            ),
          );
        },
      ),
    );
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

class _SkillDemandSection extends StatelessWidget {
  const _SkillDemandSection({required this.rows, required this.region});

  final List<_DemandRow> rows;
  final String region;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Skill Demand Landscape',
      subtitle: region,
      description:
          'Relative index: the strongest skill in the current filter is 100.',
      child: rows.isEmpty
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
          : Column(
              children: rows
                  .map(
                    (row) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _DemandBar(row: row),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _DemandBar extends StatelessWidget {
  const _DemandBar({required this.row});

  final _DemandRow row;

  @override
  Widget build(BuildContext context) {
    final color = _skillColor(row.skill).accent;
    return Row(
      children: [
        SizedBox(
          width: 92,
          child: Text(
            row.skill,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: AppTextStyles.labelSmall,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  minHeight: 22,
                  value: row.relativeScore / 100,
                  color: color,
                  backgroundColor: AppColors.surfaceContainer,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Raw avg: ${row.rawAverage.round()} from ${row.recordCount} record${row.recordCount == 1 ? '' : 's'}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 32,
          child: Text(
            row.relativeScore.round().toString(),
            textAlign: TextAlign.right,
            style: AppTextStyles.labelSmall.copyWith(color: color),
          ),
        ),
      ],
    );
  }
}

class _MarketMoversSection extends StatelessWidget {
  const _MarketMoversSection({required this.rows});

  final List<_MarketMoverRow> rows;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Market Movers',
      description:
          'Ranked skills with latest movement from the previous snapshot.',
      child: rows.isEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'No market movement available yet.',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          : Column(
              children: [
                for (var i = 0; i < rows.length; i++)
                  _MoverRow(index: i + 1, row: rows[i]),
              ],
            ),
    );
  }
}

class _MoverRow extends StatelessWidget {
  const _MoverRow({required this.index, required this.row});

  final int index;
  final _MarketMoverRow row;

  @override
  Widget build(BuildContext context) {
    final color = _skillColor(row.skill).accent;
    final positive = row.delta >= 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text(index.toString(), style: AppTextStyles.labelMedium),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        row.skill,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.labelLarge,
                      ),
                    ),
                    Text(
                      row.score.round().toString(),
                      style: AppTextStyles.labelMedium.copyWith(color: color),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                LinearProgressBar(
                  value: (row.relativeScore / 100).clamp(0, 1),
                  height: 5,
                  color: color,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: positive
                  ? AppColors.successContainer
                  : const Color(0xFFFCE8E6),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '${positive ? '+' : ''}${row.delta.round()}',
              style: AppTextStyles.labelSmall.copyWith(
                color: positive ? AppColors.success : const Color(0xFFD93025),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrendAreaSection extends StatelessWidget {
  const _TrendAreaSection({required this.trends, required this.region});

  final List<JobTrendDto> trends;
  final String region;

  @override
  Widget build(BuildContext context) {
    final history = _buildTrendHistory(trends);
    return _SectionCard(
      title: 'Momentum Timeline',
      subtitle: region,
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

class _SourceCoverageSection extends StatelessWidget {
  const _SourceCoverageSection({required this.sources});

  final List<_SourceCoverageRow> sources;

  @override
  Widget build(BuildContext context) {
    final total = sources.fold<int>(0, (sum, source) => sum + source.count);
    return _SectionCard(
      title: 'Source Coverage',
      description: 'How much each source contributes to this market view.',
      child: sources.isEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'No source coverage available.',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          : Column(
              children: [
                SizedBox(
                  height: 190,
                  child: PieChart(
                    PieChartData(
                      centerSpaceRadius: 42,
                      sectionsSpace: 3,
                      sections: [
                        for (var i = 0; i < sources.length; i++)
                          PieChartSectionData(
                            value: sources[i].count.toDouble(),
                            color: _sourceColors[i % _sourceColors.length],
                            showTitle: false,
                            radius: 42,
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                for (var i = 0; i < sources.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: _sourceColors[i % _sourceColors.length],
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            sources[i].source,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodySmall,
                          ),
                        ),
                        Text(
                          total == 0
                              ? '0'
                              : '${sources[i].count} (${(sources[i].count / total * 100).round()}%)',
                          style: AppTextStyles.labelMedium,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
    this.subtitle,
    this.description,
  });

  final String title;
  final String? subtitle;
  final String? description;
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
          if (description != null) ...[
            const SizedBox(height: 6),
            Text(
              description!,
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

class _DemandRow {
  const _DemandRow({
    required this.skill,
    required this.rawAverage,
    required this.relativeScore,
    required this.recordCount,
  });

  final String skill;
  final double rawAverage;
  final double relativeScore;
  final int recordCount;
}

class _MarketMoverRow {
  const _MarketMoverRow({
    required this.skill,
    required this.score,
    required this.relativeScore,
    required this.delta,
  });

  final String skill;
  final double score;
  final double relativeScore;
  final double delta;
}

class _SourceCoverageRow {
  const _SourceCoverageRow({required this.source, required this.count});

  final String source;
  final int count;
}

class _TrendHistoryPoint {
  const _TrendHistoryPoint({required this.date, required this.scores});

  final String date;
  final Map<String, double> scores;
}

List<_DemandRow> _buildDemandRows(List<JobTrendDto> trends) {
  final bySkill = <String, List<JobTrendDto>>{};
  for (final trend in trends) {
    if (trend.techSkill.trim().isEmpty) continue;
    (bySkill[trend.techSkill] ??= []).add(trend);
  }

  final rawRows = bySkill.entries.map((entry) {
    final average = entry.value.fold<double>(
          0,
          (sum, trend) => sum + trend.trendScore,
        ) /
        entry.value.length;
    return _DemandRow(
      skill: entry.key,
      rawAverage: average,
      relativeScore: average,
      recordCount: entry.value.length,
    );
  }).toList()
    ..sort((a, b) => b.rawAverage.compareTo(a.rawAverage));

  final maxScore = rawRows.isEmpty ? 0 : rawRows.first.rawAverage;
  if (maxScore <= 0) return rawRows.take(10).toList();

  return rawRows
      .take(10)
      .map(
        (row) => _DemandRow(
          skill: row.skill,
          rawAverage: row.rawAverage,
          relativeScore: row.rawAverage / maxScore * 100,
          recordCount: row.recordCount,
        ),
      )
      .toList();
}

List<_MarketMoverRow> _buildMarketMovers(List<JobTrendDto> trends) {
  final demandRows = _buildDemandRows(trends);
  final relativeBySkill = {
    for (final row in demandRows) row.skill: row.relativeScore,
  };
  final bySkill = <String, List<JobTrendDto>>{};
  for (final trend in trends) {
    if (trend.techSkill.trim().isEmpty) continue;
    (bySkill[trend.techSkill] ??= []).add(trend);
  }

  final rows = <_MarketMoverRow>[];
  for (final entry in bySkill.entries) {
    final byDate = <String, List<JobTrendDto>>{};
    for (final trend in entry.value) {
      final dateKey = trend.snapshotDate.split('T').first;
      (byDate[dateKey] ??= []).add(trend);
    }
    final dates = byDate.keys.toList()..sort();
    if (dates.isEmpty) continue;

    double averageFor(String date) =>
        byDate[date]!.fold<double>(
          0,
          (sum, trend) => sum + trend.trendScore,
        ) /
        byDate[date]!.length;

    final latest = averageFor(dates.last);
    final previous =
        dates.length < 2 ? latest : averageFor(dates[dates.length - 2]);
    rows.add(
      _MarketMoverRow(
        skill: entry.key,
        score: latest,
        relativeScore: relativeBySkill[entry.key] ?? latest,
        delta: latest - previous,
      ),
    );
  }

  rows.sort((a, b) => b.score.compareTo(a.score));
  return rows.take(6).toList();
}

List<_SourceCoverageRow> _buildSourceCoverage(List<JobTrendDto> trends) {
  final counts = <String, int>{};
  for (final trend in trends) {
    final source = (trend.source == null || trend.source!.trim().isEmpty)
        ? 'Market'
        : trend.source!.trim();
    counts[source] = (counts[source] ?? 0) + 1;
  }
  final rows = counts.entries
      .map((entry) => _SourceCoverageRow(source: entry.key, count: entry.value))
      .toList()
    ..sort((a, b) => b.count.compareTo(a.count));
  return rows;
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
  final skills = topSkills.take(6).map((entry) => entry.key).toList();
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
    (
      background: const Color(0xFFFCE8E6),
      border: const Color(0xFFF4B8B2),
      text: const Color(0xFFD93025),
      accent: const Color(0xFFD93025),
    ),
    (
      background: const Color(0xFFE6F7F3),
      border: const Color(0xFF9AD6CB),
      text: const Color(0xFF008577),
      accent: const Color(0xFF008577),
    ),
    (
      background: const Color(0xFFEAF2D7),
      border: const Color(0xFFC4DCA0),
      text: const Color(0xFF689F38),
      accent: const Color(0xFF689F38),
    ),
    (
      background: const Color(0xFFFFEBDD),
      border: const Color(0xFFFFBE8A),
      text: const Color(0xFFF57C00),
      accent: const Color(0xFFF57C00),
    ),
    (
      background: const Color(0xFFEDE7F6),
      border: const Color(0xFFC7B2E8),
      text: const Color(0xFF5E35B1),
      accent: const Color(0xFF5E35B1),
    ),
    (
      background: const Color(0xFFFCE4EC),
      border: const Color(0xFFF4A7C4),
      text: const Color(0xFFD81B60),
      accent: const Color(0xFFD81B60),
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
  (stroke: Color(0xFFF57C00), fill: Color(0xFFFFEBDD)),
  (stroke: Color(0xFFD93025), fill: Color(0xFFFCE8E6)),
  (stroke: Color(0xFF008577), fill: Color(0xFFE6F7F3)),
  (stroke: Color(0xFF7B1FA2), fill: Color(0xFFF3E8FD)),
];

const _sourceColors = [
  Color(0xFF689F38),
  Color(0xFF9334E6),
  Color(0xFFF57C00),
  Color(0xFF1A73E8),
  Color(0xFFD93025),
];
