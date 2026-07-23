import 'package:dio/dio.dart';
import '../../../core/api/graphql_api.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/job_trend_models.dart';
import 'job_trends_repository.dart';

class JobTrendsRepositoryImpl implements JobTrendsRepository {
  JobTrendsRepositoryImpl({Dio? dio, GraphQLApi? graphQL})
      : _graphQL = graphQL ?? GraphQLApi(dio: dio ?? DioClient.instance);

  final GraphQLApi _graphQL;

  @override
  Future<List<JobTrendDto>> getByRegion(String region) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'jobTrendsByRegion',
      r'''
      query GetJobTrendsByRegion($region: String!) {
        jobTrendsByRegion(region: $region) {
          id
          techSkill
          description
          source
          region
          trendScore
          snapshotDate
        }
      }
      ''',
      variables: {'region': region.isEmpty ? 'Global' : region},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(JobTrendDto.fromJson)
        .toList();
  }

  @override
  Future<List<JobTrendDto>> getTopTrending(int count) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'topTrendingSkills',
      r'''
      query GetTopTrendingSkills($count: Int!) {
        topTrendingSkills(count: $count) {
          id
          techSkill
          description
          region
          trendScore
          snapshotDate
        }
      }
      ''',
      variables: {'count': count},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(JobTrendDto.fromJson)
        .toList();
  }
}
