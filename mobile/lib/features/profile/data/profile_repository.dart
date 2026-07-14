import '../../../core/models/auth_response_dto.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/models/profile_models.dart';

abstract class ProfileRepository {
  Future<ProfileDto> updateProfile(String userId, UpdateProfileDto dto);
  Future<ProfileDto> getProfileByUserId(String userId);
  Future<ProfileWithSkillsDto> getProfileWithSkills(String userId);
  Future<List<SkillDto>> getSkillsByProfile(String profileId);
  Future<List<TechnicalSkillDto>> getTechnicalSkills();
  Future<SkillDto> addSkill(String profileId, String skillName);
  Future<void> deleteSkill(String skillId);
  Future<UserDto> getUserById(String userId);
  Future<UserDto> updateUser(String userId, UpdateUserDto dto);
  Future<void> deactivateAccount(String userId);
}
