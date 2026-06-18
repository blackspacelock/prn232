import '../../../core/models/auth_response_dto.dart';

abstract class AuthRepository {
  Future<AuthResponseDto> login(String email, String password);
  Future<AuthResponseDto> register(String fullName, String email, String password);
  Future<AuthResponseDto> googleLogin(String idToken);
  Future<void> logout(String refreshToken);
  Future<AuthResponseDto> refresh(String refreshToken);
}
