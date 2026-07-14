import '../../../core/models/job_trend_models.dart';

abstract class JobTrendsRepository {
  Future<List<JobTrendDto>> getByRegion(String region);
  Future<List<JobTrendDto>> getTopTrending(int count);
}
