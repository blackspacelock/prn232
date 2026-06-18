import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/profile_models.dart';
import 'profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<ProfileDto> updateProfile(String userId, UpdateProfileDto dto) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.profiles}/$userId',
        data: dto.toJson(),
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return ProfileDto.fromJson(data);
      return ProfileDto(profileId: userId, userId: userId);
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = _extractError(e);
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

  @override
  Future<List<SkillDto>> getSkillsByProfile(String profileId) async {
    try {
      final response = await _dio.get(
        ApiConstants.skills,
        queryParameters: {'profileId': profileId},
      );
      final data = _asList(response.data);
      return data.map(SkillDto.fromJson).toList();
    } on DioException {
      return _mockSkills(profileId);
    }
  }

  @override
  Future<List<TechnicalSkillDto>> getTechnicalSkills() async {
    try {
      final response = await _dio.get('/api/technical-skills');
      final data = _asList(response.data);
      return data.map(TechnicalSkillDto.fromJson).toList();
    } on DioException {
      return _mockTechnicalSkills;
    }
  }

  @override
  Future<SkillDto> addSkill(String profileId, String skillName) async {
    try {
      final response = await _dio.post(
        ApiConstants.skills,
        data: {'profileId': profileId, 'skillName': skillName},
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return SkillDto.fromJson(data);
    } on DioException {
      // Offline/mock mode falls through below.
    }
    return SkillDto(
      skillId: 'skill-${skillName.toLowerCase().replaceAll(' ', '-')}',
      profileId: profileId,
      skillName: skillName,
    );
  }

  @override
  Future<void> deleteSkill(String skillId) async {
    try {
      await _dio.delete('${ApiConstants.skills}/$skillId');
    } on DioException {
      return;
    }
  }

  String _extractError(DioException e) {
    final data = e.response?.data;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map) {
      return (data['message'] ?? data['error'] ?? data.toString()).toString();
    }
    return e.message ?? 'Failed to save profile';
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  List<SkillDto> _mockSkills(String profileId) => [
        SkillDto(
            skillId: 'flutter', profileId: profileId, skillName: 'Flutter'),
        SkillDto(skillId: 'dart', profileId: profileId, skillName: 'Dart'),
        SkillDto(skillId: 'sql', profileId: profileId, skillName: 'SQL'),
      ];

  static const _mockTechnicalSkills = [
    TechnicalSkillDto(
      technicalSkillId: 'flutter',
      skillName: 'Flutter',
      category: 'Mobile',
    ),
    TechnicalSkillDto(
      technicalSkillId: 'dart',
      skillName: 'Dart',
      category: 'Programming',
    ),
    TechnicalSkillDto(
      technicalSkillId: 'aspnet',
      skillName: 'ASP.NET Core',
      category: 'Backend',
    ),
    TechnicalSkillDto(
      technicalSkillId: 'sql',
      skillName: 'SQL',
      category: 'Database',
    ),
    TechnicalSkillDto(
      technicalSkillId: 'docker',
      skillName: 'Docker',
      category: 'DevOps',
    ),
    TechnicalSkillDto(
      technicalSkillId: 'testing',
      skillName: 'Testing',
      category: 'Quality',
    ),
  ];
}
