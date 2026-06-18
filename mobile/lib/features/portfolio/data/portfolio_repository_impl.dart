import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/portfolio_models.dart';
import 'portfolio_repository.dart';

class PortfolioRepositoryImpl implements PortfolioRepository {
  PortfolioRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<List<GitHubRepositoryDto>> getRepos(String profileId) async {
    try {
      final response = await _dio.get(
        ApiConstants.githubRepositories,
        queryParameters: {'profileId': profileId},
      );
      final data = _asList(response.data);
      return data.map(GitHubRepositoryDto.fromJson).toList();
    } on DioException {
      return [];
    }
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
    try {
      final response = await _dio.get(
        '${ApiConstants.aiPortfolioAnalysis}/$profileId',
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return PortfolioAnalysisDto.fromJson(data);
      }
      return null;
    } on DioException {
      return null;
    }
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
      message = (data['message'] ?? data['error'] ?? data.toString()).toString();
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

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }
}
