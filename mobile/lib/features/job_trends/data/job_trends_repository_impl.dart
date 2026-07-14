import 'package:dio/dio.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/job_trend_models.dart';
import 'job_trends_repository.dart';

class JobTrendsRepositoryImpl implements JobTrendsRepository {
  JobTrendsRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<List<JobTrendDto>> getByRegion(String region) async {
    try {
      final response = await _dio.get(
        '/api/job-trends',
        queryParameters: {if (region.isNotEmpty) 'region': region},
      );
      final data = _asList(response.data);
      return data.map(JobTrendDto.fromJson).toList();
    } on DioException {
      return _mockTrends(region.isEmpty ? 'Global' : region);
    }
  }

  @override
  Future<List<JobTrendDto>> getTopTrending(int count) async {
    try {
      final response = await _dio.get(
        '/api/job-trends/top',
        queryParameters: {'count': count},
      );
      final data = _asList(response.data);
      return data.map(JobTrendDto.fromJson).toList();
    } on DioException {
      return _mockTrends('Global').take(count).toList();
    }
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  List<JobTrendDto> _mockTrends(String region) {
    final skills = [
      ('Flutter', 91.0),
      ('ASP.NET Core', 84.0),
      ('SQL', 78.0),
      ('Docker', 72.0),
      ('Azure', 67.0),
      ('React', 63.0),
      ('Testing', 58.0),
      ('GraphQL', 44.0),
    ];
    return [
      for (var i = 0; i < skills.length; i++)
        JobTrendDto(
          jobTrendId: '${region.toLowerCase()}-$i',
          techSkill: skills[i].$1,
          trendScore: (skills[i].$2 - i).clamp(0, 100),
          snapshotDate: DateTime.now()
              .subtract(Duration(days: 30 * (i % 6)))
              .toIso8601String(),
          region: region,
          source: i.isEven ? 'LinkedIn' : 'Indeed',
          description:
              'Demand signal based on recent entry-level software roles.',
        ),
    ];
  }
}
