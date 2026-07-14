import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/auth_response_dto.dart';
import 'auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final Dio _dio;

  AuthRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  @override
  Future<AuthResponseDto> login(String email, String password) =>
      _post(ApiConstants.login, {'email': email, 'password': password});

  @override
  Future<AuthResponseDto> register(
    String fullName,
    String email,
    String password,
  ) =>
      _post(ApiConstants.register, {
        'fullName': fullName,
        'email': email,
        'password': password,
        'confirmPassword': password,
      });

  @override
  Future<AuthResponseDto> googleLogin(String idToken) =>
      _post(ApiConstants.googleLogin, {'idToken': idToken});

  @override
  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post(ApiConstants.logout, data: {'refreshToken': refreshToken});
    } on DioException {
      // Best-effort logout — clear local tokens regardless
    }
  }

  @override
  Future<AuthResponseDto> refresh(String refreshToken) =>
      _post(ApiConstants.refresh, {'refreshToken': refreshToken});

  Future<AuthResponseDto> _post(String path, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(path, data: data);
      return AuthResponseDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = _extractError(e);
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

  String _extractError(DioException e) {
    final data = e.response?.data;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map) {
      return (data['message'] ?? data['error'] ?? data.toString()).toString();
    }
    return e.message ?? 'An error occurred';
  }
}
