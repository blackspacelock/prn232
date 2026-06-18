import '../../../core/models/profile_models.dart';

abstract class ProfileRepository {
  Future<ProfileDto> updateProfile(String userId, UpdateProfileDto dto);
  Future<List<SkillDto>> getSkillsByProfile(String profileId);
  Future<List<TechnicalSkillDto>> getTechnicalSkills();
  Future<SkillDto> addSkill(String profileId, String skillName);
  Future<void> deleteSkill(String skillId);
}
