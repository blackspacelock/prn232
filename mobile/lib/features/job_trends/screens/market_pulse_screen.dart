import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/models/job_trend_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/app_filter_controls.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/market_pulse_provider.dart';

enum _MarketSort { score, name, date }

class MarketPulseScreen extends ConsumerStatefulWidget {
  const MarketPulseScreen({super.key});

  @override
  ConsumerState<MarketPulseScreen> createState() => _MarketPulseScreenState();
}

class _MarketPulseScreenState extends ConsumerState<MarketPulseScreen> {
  DateTime? _fromDate;
  DateTime? _toDate;
  String? _dateRangeKey;
  _MarketSort _sort = _MarketSort.score;
  bool _descending = true;

  @override
  Widget build(BuildContext context) {
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
          final defaultRange = _snapshotDateRange(data.regionalTrends);
          final rangeKey =
              '$region|${defaultRange.from?.toIso8601String() ?? ''}|${defaultRange.to?.toIso8601String() ?? ''}';
          if (_dateRangeKey != rangeKey) {
            _dateRangeKey = rangeKey;
            _fromDate = defaultRange.from;
            _toDate = defaultRange.to;
          }
          final filteredTrends = _filterByDate(
            data.regionalTrends,
            fromDate: _fromDate,
            toDate: _toDate,
          );
          final demand = _buildDemandRows(
            filteredTrends,
            sort: _sort,
            descending: _descending,
          );
          final movers = _buildMarketMovers(filteredTrends);
          final sourceCoverage = _buildSourceCoverage(filteredTrends);
          final summary = _buildSummary(filteredTrends, demand, region);
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
                _SummaryGrid(summary: summary),
                const SizedBox(height: 16),
                _MarketControls(
                  fromDate: _fromDate,
                  toDate: _toDate,
                  sort: _sort,
                  descending: _descending,
                  onPickFrom: () => _pickDate(
                    isFrom: true,
                    defaultFrom: defaultRange.from,
                    defaultTo: defaultRange.to,
                  ),
                  onPickTo: () => _pickDate(
                    isFrom: false,
                    defaultFrom: defaultRange.from,
                    defaultTo: defaultRange.to,
                  ),
                  onClearDates: () => setState(() {
                    _fromDate = defaultRange.from;
                    _toDate = defaultRange.to;
                  }),
                  onSortChanged: (value) => setState(() => _sort = value),
                  onDirectionChanged: () =>
                      setState(() => _descending = !_descending),
                ),
                const SizedBox(height: 16),
                _SkillDemandSection(rows: demand, region: region),
                const SizedBox(height: 16),
                _MarketMoversSection(rows: movers),
                const SizedBox(height: 16),
                _TrendAreaSection(trends: filteredTrends, region: region),
                const SizedBox(height: 16),
                _SourceCoverageSection(sources: sourceCoverage),
              ],
            ),
          );
        },
      ),
    );
  }

  List<JobTrendDto> _filterByDate(
    List<JobTrendDto> trends, {
    DateTime? fromDate,
    DateTime? toDate,
  }) {
    return trends.where((trend) {
      final parsed = DateTime.tryParse(trend.snapshotDate);
      if (parsed == null) return true;
      final day = DateTime(parsed.year, parsed.month, parsed.day);
      if (fromDate != null && day.isBefore(_dateOnly(fromDate))) {
        return false;
      }
      if (toDate != null && day.isAfter(_dateOnly(toDate))) {
        return false;
      }
      return true;
    }).toList();
  }

  ({DateTime? from, DateTime? to}) _snapshotDateRange(
    List<JobTrendDto> trends,
  ) {
    final dates = trends
        .map((trend) => DateTime.tryParse(trend.snapshotDate))
        .whereType<DateTime>()
        .map(_dateOnly)
        .toList()
      ..sort();
    if (dates.isEmpty) return (from: null, to: null);
    return (from: dates.first, to: dates.last);
  }

  DateTime _dateOnly(DateTime value) =>
      DateTime(value.year, value.month, value.day);

  Future<void> _pickDate({
    required bool isFrom,
    DateTime? defaultFrom,
    DateTime? defaultTo,
  }) async {
    final now = DateTime.now();
    final initial =
        isFrom ? (_fromDate ?? defaultFrom) : (_toDate ?? defaultTo);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 1),
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _fromDate = picked;
        if (_toDate != null && _toDate!.isBefore(picked)) _toDate = picked;
      } else {
        _toDate = picked;
        if (_fromDate != null && _fromDate!.isAfter(picked)) {
          _fromDate = picked;
        }
      }
    });
  }
}

class _RegionChips extends ConsumerWidget {
  const _RegionChips();

  static const regions = ['Global', 'Vietnam'];

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

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.summary});

  final _MarketSummary summary;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.22,
      children: [
        _SummaryCard(
          icon: Icons.trending_up,
          label: 'Leading Signal',
          value: summary.leadingSkill,
          detail: summary.leadingDetail,
        ),
        _SummaryCard(
          icon: Icons.storage_outlined,
          label: 'Trend Records',
          value: summary.recordCount.toString(),
          detail: '${summary.uniqueSkillCount} unique skills',
        ),
        _SummaryCard(
          icon: Icons.show_chart,
          label: 'Average Raw Score',
          value: '${summary.averageRawScore.round()}/100',
          detail: 'Raw scrape score before normalization',
        ),
        _SummaryCard(
          icon: Icons.calendar_month_outlined,
          label: 'Latest Snapshot',
          value: summary.latestSnapshot,
          detail: summary.region,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.detail,
  });

  final IconData icon;
  final String label;
  final String value;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFFE8F0FE),
            child: Icon(icon, color: const Color(0xFF1A73E8), size: 19),
          ),
          const SizedBox(height: 12),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelSmall.copyWith(
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            detail,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _MarketControls extends StatelessWidget {
  const _MarketControls({
    required this.fromDate,
    required this.toDate,
    required this.sort,
    required this.descending,
    required this.onPickFrom,
    required this.onPickTo,
    required this.onClearDates,
    required this.onSortChanged,
    required this.onDirectionChanged,
  });

  final DateTime? fromDate;
  final DateTime? toDate;
  final _MarketSort sort;
  final bool descending;
  final VoidCallback onPickFrom;
  final VoidCallback onPickTo;
  final VoidCallback onClearDates;
  final ValueChanged<_MarketSort> onSortChanged;
  final VoidCallback onDirectionChanged;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('yyyy-MM-dd');
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppFilterBar(
            children: [
              AppFilterButton(
                label: 'From',
                value: fromDate == null
                    ? 'Any date'
                    : dateFormat.format(fromDate!),
                icon: Icons.calendar_today_outlined,
                trailing: Icons.edit_calendar_outlined,
                onPressed: onPickFrom,
              ),
              AppFilterButton(
                label: 'To',
                value: toDate == null ? 'Any date' : dateFormat.format(toDate!),
                icon: Icons.event_outlined,
                trailing: Icons.edit_calendar_outlined,
                onPressed: onPickTo,
              ),
              AppFilterSelect<_MarketSort>(
                label: 'Sort by',
                valueLabel: switch (sort) {
                  _MarketSort.score => 'Trend Score',
                  _MarketSort.name => 'Skill Name',
                  _MarketSort.date => 'Snapshot Date',
                },
                icon: Icons.sort_outlined,
                onSelected: onSortChanged,
                options: const [
                  AppFilterOption(
                    value: _MarketSort.score,
                    label: 'Trend Score',
                  ),
                  AppFilterOption(
                    value: _MarketSort.name,
                    label: 'Skill Name',
                  ),
                  AppFilterOption(
                    value: _MarketSort.date,
                    label: 'Snapshot Date',
                  ),
                ],
              ),
              AppFilterButton(
                label: 'Order',
                value: descending ? 'Descending' : 'Ascending',
                icon: descending ? Icons.south_outlined : Icons.north_outlined,
                trailing: Icons.swap_vert_outlined,
                onPressed: onDirectionChanged,
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed:
                  fromDate == null && toDate == null ? null : onClearDates,
              icon: const Icon(Icons.refresh_outlined, size: 16),
              label: const Text('Reset dates'),
            ),
          ),
        ],
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
              children: [
                for (var i = 0; i < rows.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _DemandBar(row: rows[i], colorIndex: i),
                  ),
              ],
            ),
    );
  }
}

class _DemandBar extends StatelessWidget {
  const _DemandBar({required this.row, required this.colorIndex});

  final _DemandRow row;
  final int colorIndex;

  @override
  Widget build(BuildContext context) {
    final color = _skillColor(colorIndex).accent;
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
                  _MoverRow(index: i + 1, row: rows[i], colorIndex: i),
              ],
            ),
    );
  }
}

class _MoverRow extends StatelessWidget {
  const _MoverRow({
    required this.index,
    required this.row,
    required this.colorIndex,
  });

  final int index;
  final _MarketMoverRow row;
  final int colorIndex;

  @override
  Widget build(BuildContext context) {
    final color = _skillColor(colorIndex).accent;
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
      description:
          'Top skills over time, normalized to the highest raw score in this view.',
      child: history.points.length < 2
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  'Trend history needs at least two snapshot dates.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
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
                        getDrawingVerticalLine: (_) => const FlLine(
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
                            reservedSize: 42,
                            interval: (history.points.length / 4)
                                .ceil()
                                .clamp(1, history.points.length)
                                .toDouble(),
                            getTitlesWidget: (value, meta) {
                              final index = value.toInt();
                              if (index < 0 || index >= history.points.length) {
                                return const SizedBox.shrink();
                              }
                              return SideTitleWidget(
                                axisSide: meta.axisSide,
                                child: SizedBox(
                                  width: 72,
                                  child: Text(
                                    DateFormat('yyyy-MM-dd').format(
                                      DateTime.parse(
                                          history.points[index].date),
                                    ),
                                    textAlign: TextAlign.center,
                                    style: AppTextStyles.labelSmall,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 36,
                            interval: 25,
                            getTitlesWidget: (value, meta) => SideTitleWidget(
                              axisSide: meta.axisSide,
                              child: Text(
                                value.round().toString(),
                                style: AppTextStyles.labelSmall,
                              ),
                            ),
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
                                if (history.points[pointIndex]
                                        .scores[history.skills[i]] !=
                                    null)
                                  FlSpot(
                                    pointIndex.toDouble(),
                                    history.points[pointIndex]
                                        .scores[history.skills[i]]!,
                                  ),
                            ],
                            isCurved: true,
                            color:
                                _areaSeriesColors[i % _areaSeriesColors.length]
                                    .stroke,
                            barWidth: 2,
                            dotData: const FlDotData(show: true),
                            belowBarData: BarAreaData(show: false),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _TimelineLegend(skills: history.skills),
              ],
            ),
    );
  }
}

class _TimelineLegend extends StatelessWidget {
  const _TimelineLegend({required this.skills});

  final List<String> skills;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 8,
      children: [
        for (var i = 0; i < skills.length; i++)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: _areaSeriesColors[i % _areaSeriesColors.length].stroke,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                skills[i],
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
      ],
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
    required this.latestSnapshot,
  });

  final String skill;
  final double rawAverage;
  final double relativeScore;
  final int recordCount;
  final String latestSnapshot;
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

class _MarketSummary {
  const _MarketSummary({
    required this.leadingSkill,
    required this.leadingDetail,
    required this.recordCount,
    required this.uniqueSkillCount,
    required this.averageRawScore,
    required this.latestSnapshot,
    required this.region,
  });

  final String leadingSkill;
  final String leadingDetail;
  final int recordCount;
  final int uniqueSkillCount;
  final double averageRawScore;
  final String latestSnapshot;
  final String region;
}

class _TrendHistoryPoint {
  const _TrendHistoryPoint({required this.date, required this.scores});

  final String date;
  final Map<String, double> scores;
}

List<_DemandRow> _buildDemandRows(
  List<JobTrendDto> trends, {
  _MarketSort sort = _MarketSort.score,
  bool descending = true,
}) {
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
    final latest = entry.value
        .map((trend) => trend.snapshotDate)
        .reduce((a, b) => a.compareTo(b) > 0 ? a : b);
    return _DemandRow(
      skill: entry.key,
      rawAverage: average,
      relativeScore: average,
      recordCount: entry.value.length,
      latestSnapshot: latest,
    );
  }).toList();

  rawRows.sort((a, b) {
    final result = switch (sort) {
      _MarketSort.score => a.rawAverage.compareTo(b.rawAverage),
      _MarketSort.name => a.skill.compareTo(b.skill),
      _MarketSort.date => a.latestSnapshot.compareTo(b.latestSnapshot),
    };
    return descending ? -result : result;
  });

  final maxScore = rawRows.fold<double>(
    0,
    (max, row) => row.rawAverage > max ? row.rawAverage : max,
  );
  if (maxScore <= 0) return rawRows.take(10).toList();

  return rawRows
      .take(10)
      .map(
        (row) => _DemandRow(
          skill: row.skill,
          rawAverage: row.rawAverage,
          relativeScore: row.rawAverage / maxScore * 100,
          recordCount: row.recordCount,
          latestSnapshot: row.latestSnapshot,
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

_MarketSummary _buildSummary(
  List<JobTrendDto> trends,
  List<_DemandRow> demandRows,
  String region,
) {
  final strongest = [...demandRows]
    ..sort((a, b) => b.rawAverage.compareTo(a.rawAverage));
  final leading = strongest.isEmpty ? null : strongest.first;
  final uniqueSkills = trends.map((trend) => trend.techSkill).toSet().length;
  final average = trends.isEmpty
      ? 0.0
      : trends.fold<double>(0, (sum, trend) => sum + trend.trendScore) /
          trends.length;
  final latestRaw = trends.isEmpty
      ? null
      : trends
          .map((trend) => trend.snapshotDate)
          .reduce((a, b) => a.compareTo(b) > 0 ? a : b);
  final latestDate = latestRaw == null ? null : DateTime.tryParse(latestRaw);

  return _MarketSummary(
    leadingSkill: leading?.skill ?? 'No data',
    leadingDetail: leading == null
        ? 'No records in filter'
        : 'Index ${leading.relativeScore.round()} · raw ${leading.rawAverage.round()}/100',
    recordCount: trends.length,
    uniqueSkillCount: uniqueSkills,
    averageRawScore: average,
    latestSnapshot: latestDate == null
        ? 'No data'
        : DateFormat('M/d/yyyy').format(latestDate),
    region: region,
  );
}

({List<String> skills, List<_TrendHistoryPoint> points}) _buildTrendHistory(
  List<JobTrendDto> trends,
) {
  if (trends.isEmpty) {
    return (skills: const [], points: const []);
  }

  final skills =
      _buildDemandRows(trends).take(6).map((row) => row.skill).toList();
  if (skills.isEmpty) {
    return (skills: const [], points: const []);
  }

  final skillSet = skills.toSet();
  final byDate = <String, Map<String, ({int count, double total})>>{};
  for (final trend in trends) {
    if (!skillSet.contains(trend.techSkill)) continue;
    final dateKey = trend.snapshotDate.split('T').first;
    final skillMap = byDate.putIfAbsent(dateKey, () => {});
    final current = skillMap[trend.techSkill] ?? (count: 0, total: 0.0);
    skillMap[trend.techSkill] = (
      count: current.count + 1,
      total: current.total + trend.trendScore,
    );
  }

  final rawPoints = byDate.entries
      .map((entry) {
        final scores = <String, double>{};
        for (final skill in skills) {
          final score = entry.value[skill];
          if (score != null && score.count > 0) {
            scores[skill] = score.total / score.count;
          }
        }
        return _TrendHistoryPoint(date: entry.key, scores: scores);
      })
      .where((point) => point.scores.isNotEmpty)
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));

  final maxScore = rawPoints.fold<double>(0, (maxValue, point) {
    var highest = maxValue;
    for (final score in point.scores.values) {
      if (score > highest) highest = score;
    }
    return highest;
  });

  if (maxScore <= 0) {
    return (skills: skills, points: rawPoints);
  }

  final points = rawPoints
      .map(
        (point) => _TrendHistoryPoint(
          date: point.date,
          scores: {
            for (final entry in point.scores.entries)
              entry.key: (entry.value / maxScore * 100).roundToDouble(),
          },
        ),
      )
      .toList();
  return (skills: skills, points: points);
}

({Color background, Color border, Color text, Color accent}) _skillColor(
  int index,
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
    (
      background: const Color(0xFFE0F7FA),
      border: const Color(0xFF80DEEA),
      text: const Color(0xFF00838F),
      accent: const Color(0xFF00ACC1),
    ),
    (
      background: const Color(0xFFE8F5E9),
      border: const Color(0xFFA5D6A7),
      text: const Color(0xFF2E7D32),
      accent: const Color(0xFF43A047),
    ),
    (
      background: const Color(0xFFFFF3E0),
      border: const Color(0xFFFFCC80),
      text: const Color(0xFFE65100),
      accent: const Color(0xFFEF6C00),
    ),
    (
      background: const Color(0xFFE3F2FD),
      border: const Color(0xFF90CAF9),
      text: const Color(0xFF1565C0),
      accent: const Color(0xFF1976D2),
    ),
    (
      background: const Color(0xFFF1F8E9),
      border: const Color(0xFFC5E1A5),
      text: const Color(0xFF558B2F),
      accent: const Color(0xFF7CB342),
    ),
    (
      background: const Color(0xFFF9FBE7),
      border: const Color(0xFFE6EE9C),
      text: const Color(0xFF827717),
      accent: const Color(0xFFAFB42B),
    ),
    (
      background: const Color(0xFFFFEBEE),
      border: const Color(0xFFEF9A9A),
      text: const Color(0xFFC62828),
      accent: const Color(0xFFE53935),
    ),
    (
      background: const Color(0xFFF3E5F5),
      border: const Color(0xFFCE93D8),
      text: const Color(0xFF6A1B9A),
      accent: const Color(0xFF8E24AA),
    ),
  ];
  return palettes[index % palettes.length];
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
