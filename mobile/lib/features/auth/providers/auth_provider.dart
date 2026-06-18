import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/auth_response_dto.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';
import '../data/auth_repository_impl.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (_) => AuthRepositoryImpl(),
);

// Holds the current authenticated user (null = logged out)
final currentUserProvider = StateProvider<UserDto?>((ref) => null);

class AuthNotifier extends AsyncNotifier<UserDto?> {
  @override
  Future<UserDto?> build() async {
    final hasToken = await TokenStorage.hasValidToken();
    if (!hasToken) return null;
    final id = await TokenStorage.getUserId();
    // Minimal user stub from storage; full profile loaded separately
    return id != null ? UserDto(id: id, email: '', role: 0, hasProfile: false) : null;
  }

  Future<UserDto> login(String email, String password) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.login(email, password);
    await _persist(result);
    state = AsyncData(result.user);
    return result.user;
  }

  Future<UserDto> register(
    String fullName,
    String email,
    String password,
  ) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.register(fullName, email, password);
    await _persist(result);
    state = AsyncData(result.user);
    return result.user;
  }

  Future<UserDto> googleLogin(String idToken) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.googleLogin(idToken);
    await _persist(result);
    state = AsyncData(result.user);
    return result.user;
  }

  Future<void> logout() async {
    final refreshToken = await TokenStorage.getRefreshToken();
    if (refreshToken != null) {
      await ref.read(authRepositoryProvider).logout(refreshToken);
    }
    await TokenStorage.clearTokens();
    state = const AsyncData(null);
  }

  Future<void> _persist(AuthResponseDto result) => TokenStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        userId: result.user.id,
      );
}

final authProvider = AsyncNotifierProvider<AuthNotifier, UserDto?>(
  AuthNotifier.new,
);
