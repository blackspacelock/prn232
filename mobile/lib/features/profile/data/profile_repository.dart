import '../../../core/models/profile_models.dart';

abstract class ProfileRepository {
  Future<ProfileDto> updateProfile(String userId, UpdateProfileDto dto);
}
