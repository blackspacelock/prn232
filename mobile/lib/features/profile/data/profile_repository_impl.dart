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
  static const _cascadeDeleteQuery = {'delete': true};

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
    final data = await _query(
      _profileByUserIdQuery,
      variables: {'userId': userId},
    );
    final profile = data['profileByUserId'];
    if (profile is Map<String, dynamic>) {
      return ProfileDto.fromJson(profile);
    }
    return ProfileDto(profileId: userId, userId: userId);
  }

  @override
  Future<ProfileWithSkillsDto> getProfileWithSkills(String userId) async {
    final data = await _query(
      _profileWithSkillsQuery,
      variables: {'userId': userId},
    );
    final profile = data['profileWithSkills'];
    if (profile is Map<String, dynamic>) {
      return ProfileWithSkillsDto.fromJson(profile);
    }
    return ProfileWithSkillsDto(profileId: userId, userId: userId);
  }

  @override
  Future<List<SkillDto>> getSkillsByProfile(String profileId) async {
    final data = await _query(
      _skillsByProfileQuery,
      variables: {'profileId': profileId},
    );
    return _asList(data['skillsByProfile']).map(SkillDto.fromJson).toList();
  }

  @override
  Future<List<TechnicalSkillDto>> getTechnicalSkills() async {
    final data = await _query(_technicalSkillsQuery);
    return _asList(data['technicalSkills'])
        .map(TechnicalSkillDto.fromJson)
        .toList();
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
      await _dio.delete(
        '${ApiConstants.skills}/$skillId',
        queryParameters: _cascadeDeleteQuery,
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<UserDto> getUserById(String userId) async {
    final data = await _query(
      _userByIdQuery,
      variables: {'userId': userId},
    );
    final user = data['userById'];
    if (user is Map<String, dynamic>) {
      return UserDto.fromJson(user);
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
      await _dio.delete(
        '${ApiConstants.users}/$userId',
        queryParameters: _cascadeDeleteQuery,
      );
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

const _userByIdQuery = r'''
query MobileUserById($userId: UUID!) {
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
''';

const _profileByUserIdQuery = r'''
query MobileProfileByUserId($userId: UUID!) {
  profileByUserId(userId: $userId) {
    userId
    bioDescription
    phoneNumber
    university
    major
    studiedYear
  }
}
''';

const _profileWithSkillsQuery = r'''
query MobileProfileWithSkills($userId: UUID!) {
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
}
''';

const _skillsByProfileQuery = r'''
query MobileSkillsByProfile($profileId: UUID!) {
  skillsByProfile(profileId: $profileId) {
    id
    profileId
    technicalSkillId
    skillName
    category
    note
    createdAt
  }
}
''';

const _technicalSkillsQuery = r'''
query MobileTechnicalSkills {
  technicalSkills {
    id
    name
    category
  }
}
''';
