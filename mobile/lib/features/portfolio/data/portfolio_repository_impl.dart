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
    final data = await _query(
      _githubReposByProfileQuery,
      variables: {'profileId': profileId},
    );
    return _asList(data['gitHubRepositoriesByProfile'])
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
    final data = await _query(
      _portfolioAnalysisQuery,
      variables: {'profileId': profileId},
    );
    final analysis = data['portfolioAnalysis'];
    if (analysis is Map<String, dynamic>) {
      return PortfolioAnalysisDto.fromJson(analysis);
    }
    return null;
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

  @override
  Future<PublicPortfolioViewData> getPublicPortfolioView(String userId) async {
    try {
      final data = await _query(
        _publicPortfolioQuery,
        variables: {'userId': userId},
      );

      final profileJson = data['profileWithSkills'];
      if (profileJson is! Map<String, dynamic>) {
        throw const ValidationException('Portfolio not found');
      }

      final profile = ProfileWithSkillsDto.fromJson(profileJson);
      final profileId =
          profile.profileId.isNotEmpty ? profile.profileId : userId;

      final repos = (data['gitHubRepositoriesByProfile'] as List?)
              ?.whereType<Map<String, dynamic>>()
              .map(GitHubRepositoryDto.fromJson)
              .toList() ??
          const <GitHubRepositoryDto>[];

      final publicPortfolioJson = data['publicPortfolioByProfile'];
      final publicPortfolio = publicPortfolioJson is Map<String, dynamic>
          ? PublicPortfolioDto.fromJson(publicPortfolioJson)
          : null;

      if (profileId.isEmpty) {
        throw const ValidationException('Portfolio not found');
      }

      return PublicPortfolioViewData(
        profile: profile,
        repositories: repos,
        publicPortfolio: publicPortfolio,
      );
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
      throw const ServerException('Invalid GraphQL response');
    }
    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      throw ServerException(errors.first.toString());
    }
    final data = payload['data'];
    return data is Map<String, dynamic> ? data : const {};
  }
}

const _githubReposByProfileQuery = r'''
query MobileGitHubRepositoriesByProfile($profileId: UUID!) {
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
''';

const _portfolioAnalysisQuery = r'''
query MobilePortfolioAnalysis($profileId: UUID!) {
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
''';

const _publicPortfolioQuery = r'''
query MobilePublicPortfolio($userId: UUID!) {
  profileWithSkills(userId: $userId) {
    userId
    fullName
    avatarUrl
    bioDescription
    phoneNumber
    university
    major
    studiedYear
    skills {
      id
      profileId
      technicalSkillId
      skillName
      category
      note
      createdAt
    }
  }
  gitHubRepositoriesByProfile(profileId: $userId) {
    id
    profileId
    repositoryName
    repoUrl
    description
    isPrivate
    createdAt
  }
  publicPortfolioByProfile(profileId: $userId) {
    id
    profileId
    headline
    publicBio
    location
    websiteUrl
    linkedInUrl
    contactEmail
    isPublic
    lastAnalyzedAt
    cachedPortfolioAnalysis {
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
}
''';
