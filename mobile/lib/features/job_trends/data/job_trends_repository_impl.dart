import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/job_trend_models.dart';
import 'job_trends_repository.dart';

class JobTrendsRepositoryImpl implements JobTrendsRepository {
  JobTrendsRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<List<JobTrendDto>> getByRegion(String region) async {
    final data = await _query(
      _jobTrendsByRegionQuery,
      variables: {'region': region.isEmpty ? 'Global' : region},
    );
    return _asList(data['jobTrendsByRegion'])
        .map(JobTrendDto.fromJson)
        .toList();
  }

  @override
  Future<List<JobTrendDto>> getTopTrending(int count) async {
    final data = await _query(
      _topTrendingSkillsQuery,
      variables: {'count': count},
    );
    return _asList(data['topTrendingSkills'])
        .map(JobTrendDto.fromJson)
        .toList();
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  Future<Map<String, dynamic>> _query(
    String query, {
    Map<String, dynamic> variables = const {},
  }) async {
    final response = await _dio.post(
      ApiConstants.graphqlEndpoint,
      data: {'query': query, 'variables': variables},
    );
    final payload = response.data;
    if (payload is! Map<String, dynamic>) {
      throw StateError('Invalid GraphQL response');
    }
    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      throw StateError(errors.first.toString());
    }
    final data = payload['data'];
    return data is Map<String, dynamic> ? data : const {};
  }
}

const _jobTrendsByRegionQuery = r'''
query MobileJobTrendsByRegion($region: String!) {
  jobTrendsByRegion(region: $region) {
    id
    techSkill
    description
    source
    region
    trendScore
    snapshotDate
    createdAt
  }
}
''';

const _topTrendingSkillsQuery = r'''
query MobileTopTrendingSkills($count: Int!) {
  topTrendingSkills(count: $count) {
    id
    techSkill
    description
    source
    region
    trendScore
    snapshotDate
    createdAt
  }
}
''';
