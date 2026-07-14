import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/roadmap_models.dart';
import 'mock_roadmap_data.dart';
import 'roadmap_repository.dart';

class RoadmapRepositoryImpl implements RoadmapRepository {
  RoadmapRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<List<CareerRoleDto>> getCareerRoles() async {
    try {
      final response = await _dio.get('/api/career-roles');
      final data = _asList(response.data);
      return data.map(CareerRoleDto.fromJson).toList();
    } on DioException {
      return mockCareerRoles;
    }
  }

  @override
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId) async {
    try {
      final response =
          await _dio.get('/api/career-roadmaps/role/$careerRoleId');
      final data = _asList(response.data);
      return data.map(CareerRoadmapDto.fromJson).toList();
    } on DioException {
      return mockRoadmapsForRole(careerRoleId);
    }
  }

  @override
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId) async {
    if (profileId.isEmpty) return [mockPersonalRoadmap()];
    try {
      final response = await _dio.get(
        ApiConstants.personalRoadmaps,
        queryParameters: {'profileId': profileId},
      );
      final data = _asList(response.data);
      return data.map(PersonalRoadmapDto.fromJson).toList();
    } on DioException {
      return [mockPersonalRoadmap(profileId: profileId)];
    }
  }

  @override
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id) async {
    try {
      final response = await _dio.get('${ApiConstants.personalRoadmaps}/$id');
      return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return mockPersonalRoadmap(id: id);
    }
  }

  @override
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  ) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.personalRoadmaps}/generate',
        data: {
          'profileId': profileId,
          'careerRoadmapId': careerRoadmapId,
        },
      );
      return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return mockPersonalRoadmap(
        id: 'generated-$careerRoadmapId',
        profileId: profileId,
        careerRoadmapId: careerRoadmapId,
      );
    }
  }

  @override
  Future<void> deleteRoadmap(String personalRoadmapId) async {
    try {
      await _dio.delete('${ApiConstants.personalRoadmaps}/$personalRoadmapId');
    } on DioException {
      return;
    }
  }

  @override
  Future<void> toggleActiveRoadmap(String personalRoadmapId) async {
    try {
      await _dio.put(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/toggle-active',
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<RoadmapTagDto> addTag(
    String personalRoadmapId,
    String name, {
    String? color,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags',
        data: {'name': name, if (color != null) 'color': color},
      );
      return RoadmapTagDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return RoadmapTagDto(
        roadmapTagId: 'tag-${DateTime.now().millisecondsSinceEpoch}',
        personalRoadmapId: personalRoadmapId,
        name: name,
        color: color,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  @override
  Future<RoadmapTagDto> updateTag(
    String personalRoadmapId,
    String tagId, {
    String? name,
    String? color,
  }) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags/$tagId',
        data: {
          if (name != null) 'name': name,
          if (color != null) 'color': color,
        },
      );
      return RoadmapTagDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return RoadmapTagDto(
        roadmapTagId: tagId,
        personalRoadmapId: personalRoadmapId,
        name: name ?? 'Tag',
        color: color,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  @override
  Future<void> deleteTag(String personalRoadmapId, String tagId) async {
    try {
      await _dio.delete(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags/$tagId',
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<void> updateNodeStatus(
    String nodeProgressId,
    int status, {
    String? note,
  }) async {
    try {
      await _dio.put(
        '${ApiConstants.nodeProgress}/$nodeProgressId',
        data: {'status': status, if (note != null) 'note': note},
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<List<LearningResourceDto>> getResourcesByNode(String nodeId) async {
    try {
      final response = await _dio.get('/api/learning-resources/node/$nodeId');
      final data = _asList(response.data);
      return data.map(LearningResourceDto.fromJson).toList();
    } on DioException {
      return mockLearningResources(nodeId);
    }
  }

  @override
  Future<List<LearningResourceDto>> getRecommendedResources(
    String profileId,
    String nodeId,
  ) async {
    try {
      final response = await _dio.get(
        '/api/learning-resources/recommended',
        queryParameters: {'profileId': profileId, 'nodeId': nodeId},
      );
      final data = _asList(response.data);
      return data.map(LearningResourceDto.fromJson).toList();
    } on DioException {
      return mockRecommendedResources(nodeId);
    }
  }

  @override
  Future<SkillGapAnalysisDto> getSkillGapAnalysis(
    String profileId,
    String careerRoadmapId,
  ) async {
    try {
      final response = await _dio.get(
        '/api/skill-gap-analysis',
        queryParameters: {
          'profileId': profileId,
          'careerRoadmapId': careerRoadmapId,
        },
      );
      return SkillGapAnalysisDto.fromJson(
          response.data as Map<String, dynamic>);
    } on DioException {
      return mockSkillGapAnalysis;
    }
  }

  @override
  Future<List<String>> getTrendingSkillRecommendations(String profileId) async {
    try {
      final response = await _dio.get(
        '/api/skill-gap-analysis/trending',
        queryParameters: {'profileId': profileId},
      );
      final data = _asList(response.data);
      return data
          .map((item) => (item['skillName'] ?? item['name'] ?? item).toString())
          .toList();
    } on DioException {
      return mockTrendingSkillRecommendations;
    }
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }
}
