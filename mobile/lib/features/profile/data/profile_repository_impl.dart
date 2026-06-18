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

  String _extractError(DioException e) {
    final data = e.response?.data;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map) {
      return (data['message'] ?? data['error'] ?? data.toString()).toString();
    }
    return e.message ?? 'Failed to save profile';
  }
}
