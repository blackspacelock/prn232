import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/graphql_api.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/portfolio_models.dart';
import 'portfolio_repository.dart';

class PortfolioRepositoryImpl implements PortfolioRepository {
  PortfolioRepositoryImpl({Dio? dio, GraphQLApi? graphQL})
      : _dio = dio ?? DioClient.instance,
        _graphQL = graphQL ?? GraphQLApi(dio: dio);

  final Dio _dio;
  final GraphQLApi _graphQL;

  @override
  Future<List<GitHubRepositoryDto>> getRepos(String profileId) async {
    if (profileId.isEmpty) return const [];
    final data = await _graphQL.queryField<List<dynamic>>(
      'gitHubRepositoriesByProfile',
      r'''
      query GetGitHubRepositoriesByProfile($profileId: UUID!) {
        gitHubRepositoriesByProfile(profileId: $profileId) {
          id
          profileId
          repositoryName
          repoUrl
          description
          isPrivate
          createdAt
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(GitHubRepositoryDto.fromJson)
        .toList();
  }

  @override
  Future<GitHubRepositoryDto> addRepo(CreateRepoDto dto) async {
    try {
      final response = await _dio.post(
        ApiConstants.githubRepositories,
        data: dto.toJson(),
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return GitHubRepositoryDto.fromJson(data);
      }
      throw const ServerException('Invalid response from server');
    } on DioException catch (e) {
      _throwMapped(e);
    }
  }

  @override
  Future<GitHubRepositoryDto> updateRepo(String id, UpdateRepoDto dto) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.githubRepositories}/$id',
        data: dto.toJson(),
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return GitHubRepositoryDto.fromJson(data);
      }
      throw const ServerException('Invalid response from server');
    } on DioException catch (e) {
      _throwMapped(e);
    }
  }

  @override
  Future<void> deleteRepo(String id) async {
    try {
      await _dio.delete('${ApiConstants.githubRepositories}/$id');
    } on DioException catch (e) {
      _throwMapped(e);
    }
  }

  @override
  Future<PortfolioAnalysisDto?> getAnalysis(String profileId) async {
    if (profileId.isEmpty) return null;
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'portfolioAnalysis',
      r'''
      query GetPortfolioAnalysis($profileId: UUID!) {
        portfolioAnalysis(profileId: $profileId) {
          profileId
          repositoryNames
          overallSummary
          strengths
          recommendations
          repositoryAnalyses {
            repositoryId
            repositoryName
            objective
            techStacks
            summary
          }
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data == null ? null : PortfolioAnalysisDto.fromJson(data);
  }

  @override
  Future<PortfolioAnalysisDto> runAnalysis(String profileId) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.aiPortfolioAnalysis}/$profileId',
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return PortfolioAnalysisDto.fromJson(data);
      }
      throw const ServerException('AI analysis returned invalid data');
    } on DioException catch (e) {
      _throwMapped(e);
    }
  }

  Never _throwMapped(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    String message = e.message ?? 'Request failed';
    if (data is String && data.isNotEmpty) message = data;
    if (data is Map) {
      message =
          (data['message'] ?? data['error'] ?? data.toString()).toString();
    }
    if (status == 401) throw AuthException(message);
    if (status != null && status >= 400 && status < 500) {
      throw ValidationException(message);
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      throw const NetworkException();
    }
    throw ServerException(message, statusCode: status);
  }
}
