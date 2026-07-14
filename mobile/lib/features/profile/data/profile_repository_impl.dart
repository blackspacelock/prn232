import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/auth_response_dto.dart';
import '../../../core/models/portfolio_models.dart';
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
  Future<ProfileDto> getProfileByUserId(String userId) async {
    try {
      final response = await _dio.get('${ApiConstants.profiles}/$userId');
      final data = response.data;
      if (data is Map<String, dynamic>) return ProfileDto.fromJson(data);
      return ProfileDto(profileId: userId, userId: userId);
    } on DioException {
      return ProfileDto(profileId: userId, userId: userId);
    }
  }

  @override
  Future<ProfileWithSkillsDto> getProfileWithSkills(String userId) async {
    try {
      final response = await _dio.get('${ApiConstants.profiles}/$userId');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final profile = ProfileWithSkillsDto.fromJson(data);
        // If skills not embedded, fetch separately
        if (profile.skills.isEmpty && profile.profileId.isNotEmpty) {
          final skills = await getSkillsByProfile(profile.profileId);
          return ProfileWithSkillsDto(
            profileId: profile.profileId,
            userId: profile.userId,
            bioDescription: profile.bioDescription,
            phoneNumber: profile.phoneNumber,
            university: profile.university,
            major: profile.major,
            studiedYear: profile.studiedYear,
            skills: skills,
          );
        }
        return profile;
      }
      return ProfileWithSkillsDto(profileId: userId, userId: userId);
    } on DioException {
      return ProfileWithSkillsDto(profileId: userId, userId: userId);
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
      return [];
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
      // fallthrough to local stub
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

  @override
  Future<UserDto> getUserById(String userId) async {
    try {
      final response = await _dio.get('${ApiConstants.users}/$userId');
      final data = response.data;
      if (data is Map<String, dynamic>) return UserDto.fromJson(data);
    } on DioException {
      // fallthrough to stub
    }
    return UserDto(id: userId, email: '', role: 0, hasProfile: true);
  }

  @override
  Future<UserDto> updateUser(String userId, UpdateUserDto dto) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.users}/$userId',
        data: dto.toJson(),
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return UserDto.fromJson(data);
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = _extractError(e);
      if (status != null && status >= 400 && status < 500) {
        throw ValidationException(message);
      }
      throw ServerException(message, statusCode: status);
    }
    return UserDto(id: userId, email: '', role: 0, hasProfile: true);
  }

  @override
  Future<void> deactivateAccount(String userId) async {
    try {
      await _dio.delete('${ApiConstants.users}/$userId');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = _extractError(e);
      throw ServerException(message, statusCode: status);
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

  static const _mockTechnicalSkills = [
    TechnicalSkillDto(
        technicalSkillId: 'flutter', skillName: 'Flutter', category: 'Mobile'),
    TechnicalSkillDto(
        technicalSkillId: 'dart', skillName: 'Dart', category: 'Programming'),
    TechnicalSkillDto(
        technicalSkillId: 'aspnet',
        skillName: 'ASP.NET Core',
        category: 'Backend'),
    TechnicalSkillDto(
        technicalSkillId: 'react', skillName: 'React', category: 'Frontend'),
    TechnicalSkillDto(
        technicalSkillId: 'sql', skillName: 'SQL', category: 'Database'),
    TechnicalSkillDto(
        technicalSkillId: 'docker', skillName: 'Docker', category: 'DevOps'),
    TechnicalSkillDto(
        technicalSkillId: 'azure', skillName: 'Azure', category: 'Cloud'),
    TechnicalSkillDto(
        technicalSkillId: 'nodejs', skillName: 'Node.js', category: 'Backend'),
    TechnicalSkillDto(
        technicalSkillId: 'graphql',
        skillName: 'GraphQL',
        category: 'API Design'),
    TechnicalSkillDto(
        technicalSkillId: 'testing',
        skillName: 'Testing',
        category: 'Quality'),
    TechnicalSkillDto(
        technicalSkillId: 'git', skillName: 'Git', category: 'Tools'),
    TechnicalSkillDto(
        technicalSkillId: 'csharp',
        skillName: 'C#',
        category: 'Programming'),
    TechnicalSkillDto(
        technicalSkillId: 'typescript',
        skillName: 'TypeScript',
        category: 'Programming'),
    TechnicalSkillDto(
        technicalSkillId: 'python',
        skillName: 'Python',
        category: 'Programming'),
  ];
}
