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
          final list = _sorted(_filtered(data.regionalTrends));
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
                _TrendAreaSection(trends: data.topSkills.take(3).toList()),
                const SizedBox(height: 16),
                _SearchSortToolbar(
                  controller: _searchController,
                  sort: _sort,
                  onSearchChanged: _onSearchChanged,
                  onSortChanged: (value) => setState(() => _sort = value),
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
      child: SizedBox(
        height: 220,
        child: BarChart(
          BarChartData(
            maxY: 100,
            alignment: BarChartAlignment.spaceAround,
            gridData: const FlGridData(show: true),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              topTitles: const AxisTitles(),
              rightTitles: const AxisTitles(),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 80,
                  getTitlesWidget: (value, meta) {
                    final index = value.toInt();
                    if (index < 0 || index >= trends.length) {
                      return const SizedBox.shrink();
                    }
                    return Text(
                      trends[index].techSkill,
                      style: AppTextStyles.labelSmall,
                    );
                  },
                ),
              ),
              bottomTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: true, reservedSize: 24),
              ),
            ),
            barGroups: [
              for (var i = 0; i < trends.length; i++)
                BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: trends[i].trendScore,
                      width: 16,
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
    return _SectionCard(
      title: 'Trend Over Time',
      child: SizedBox(
        height: 220,
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
            titlesData: const FlTitlesData(
              topTitles: AxisTitles(),
              rightTitles: AxisTitles(),
            ),
            lineBarsData: [
              for (var i = 0; i < trends.length; i++)
                LineChartBarData(
                  spots: _seriesFor(trends[i], i),
                  isCurved: true,
                  color: _palette[i % _palette.length],
                  barWidth: 3,
                  belowBarData: BarAreaData(
                    show: true,
                    color:
                        _palette[i % _palette.length].withValues(alpha: 0.15),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  List<FlSpot> _seriesFor(JobTrendDto trend, int index) {
    return [
      for (var i = 0; i < 6; i++)
        FlSpot(
          i.toDouble(),
          (trend.trendScore - ((5 - i) * (4 + index))).clamp(0, 100),
        ),
    ];
  }
}

class _SearchSortToolbar extends StatelessWidget {
  const _SearchSortToolbar({
    required this.controller,
    required this.sort,
    required this.onSearchChanged,
    required this.onSortChanged,
  });

  final TextEditingController controller;
  final _TrendSort sort;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<_TrendSort> onSortChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
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
            DropdownMenuItem(value: _TrendSort.dateDesc, child: Text('Date ↓')),
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
