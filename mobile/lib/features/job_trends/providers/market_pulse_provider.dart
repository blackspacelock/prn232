import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/job_trend_models.dart';
import '../data/job_trends_repository.dart';
import '../data/job_trends_repository_impl.dart';

final jobTrendsRepositoryProvider = Provider<JobTrendsRepository>(
  (_) => JobTrendsRepositoryImpl(),
);

final selectedMarketRegionProvider = StateProvider<String>((_) => 'Vietnam');

final marketPulseProvider = FutureProvider<MarketPulseData>((ref) async {
  final region = ref.watch(selectedMarketRegionProvider);
  final repo = ref.watch(jobTrendsRepositoryProvider);
  final regionalQuery = region == 'Global' ? '' : region;
  final results = await Future.wait([
    repo.getTopTrending(10),
    repo.getByRegion(regionalQuery),
  ]);
  return MarketPulseData(
    topSkills: results[0],
    regionalTrends: results[1],
  );
});

class MarketPulseData {
  const MarketPulseData({
    required this.topSkills,
    required this.regionalTrends,
  });

  final List<JobTrendDto> topSkills;
  final List<JobTrendDto> regionalTrends;
}
