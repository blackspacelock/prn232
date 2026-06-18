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

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }
}
