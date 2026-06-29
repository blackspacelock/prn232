import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/graphql_api.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/auth_response_dto.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/models/profile_models.dart';
import 'profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl({Dio? dio, GraphQLApi? graphQL})
      : _dio = dio ?? DioClient.instance,
        _graphQL = graphQL ?? GraphQLApi(dio: dio);

  final Dio _dio;
  final GraphQLApi _graphQL;

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
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'profileByUserId',
      r'''
      query GetProfileByUserId($userId: UUID!) {
        profileByUserId(userId: $userId) {
          userId
          bioDescription
          phoneNumber
          university
          major
          studiedYear
        }
      }
      ''',
      variables: {'userId': userId},
    );
    return ProfileDto.fromJson(data ?? {'userId': userId});
  }

  @override
  Future<ProfileWithSkillsDto> getProfileWithSkills(String userId) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'profileWithSkills',
      r'''
      query GetProfileWithSkills($userId: UUID!) {
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
          }
        }
      }
      ''',
      variables: {'userId': userId},
    );
    return ProfileWithSkillsDto.fromJson(data ?? {'userId': userId});
  }

  @override
  Future<List<SkillDto>> getSkillsByProfile(String profileId) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'skillsByProfile',
      r'''
      query GetSkillsByProfile($profileId: UUID!) {
        skillsByProfile(profileId: $profileId) {
          id
          profileId
          technicalSkillId
          skillName
          category
          note
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(SkillDto.fromJson)
        .toList();
  }

  @override
  Future<List<TechnicalSkillDto>> getTechnicalSkills() async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'technicalSkills',
      r'''
      query GetTechnicalSkills {
        technicalSkills {
          id
          name
          category
        }
      }
      ''',
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(TechnicalSkillDto.fromJson)
        .toList();
  }

  @override
  Future<SkillDto> addSkill(String profileId, String skillName) async {
    final response = await _dio.post(
      ApiConstants.skills,
      data: {'profileId': profileId, 'skillName': skillName},
    );
    final data = response.data;
    if (data is Map<String, dynamic>) return SkillDto.fromJson(data);
    throw const ServerException('Invalid skill response from server');
  }

  @override
  Future<void> deleteSkill(String skillId) async {
    await _dio.delete('${ApiConstants.skills}/$skillId');
  }

  @override
  Future<UserDto> getUserById(String userId) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'userById',
      r'''
      query GetUserById($userId: UUID!) {
        userById(id: $userId) {
          id
          fullName
          email
          role
          isActive
          avatarUrl
          createdAt
        }
      }
      ''',
      variables: {'userId': userId},
    );
    if (data == null) throw StateError('User not found');
    return UserDto.fromJson(data);
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
    throw const ServerException('Invalid user response from server');
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
}
