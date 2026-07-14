import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/profile_repository.dart';
import '../data/profile_repository_impl.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (_) => ProfileRepositoryImpl(),
);

class ProfileSetupNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> updateProfile(UpdateProfileDto dto) async {
    state = const AsyncLoading();
    try {
      final authUser = ref.read(authProvider).valueOrNull;
      final userId = authUser?.id ?? await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        throw const AuthException('Please sign in again to complete setup.');
      }

      await ref.read(profileRepositoryProvider).updateProfile(userId, dto);
      ref.read(authProvider.notifier).markProfileComplete();
      state = const AsyncData(null);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }
}

final profileSetupProvider = AsyncNotifierProvider<ProfileSetupNotifier, void>(
  ProfileSetupNotifier.new,
);
