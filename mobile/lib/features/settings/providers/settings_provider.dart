import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/auth_response_dto.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../../profile/data/profile_repository.dart';
import '../../profile/data/profile_repository_impl.dart';

final settingsProfileRepositoryProvider = Provider<ProfileRepository>(
  (_) => ProfileRepositoryImpl(),
);

class SettingsData {
  const SettingsData({
    required this.user,
    required this.profile,
    required this.skills,
    required this.technicalSkills,
  });

  final UserDto user;
  final ProfileDto profile;
  final List<SkillDto> skills;
  final List<TechnicalSkillDto> technicalSkills;

  SettingsData copyWith({
    UserDto? user,
    ProfileDto? profile,
    List<SkillDto>? skills,
    List<TechnicalSkillDto>? technicalSkills,
  }) {
    return SettingsData(
      user: user ?? this.user,
      profile: profile ?? this.profile,
      skills: skills ?? this.skills,
      technicalSkills: technicalSkills ?? this.technicalSkills,
    );
  }
}

class SettingsNotifier extends AsyncNotifier<SettingsData> {
  @override
  Future<SettingsData> build() async {
    final userId = await _getUserId();
    final repo = ref.read(settingsProfileRepositoryProvider);

    final profileFuture = repo.getProfileByUserId(userId);
    final techSkillsFuture = repo.getTechnicalSkills();
    final profile = await profileFuture;
    final techSkills = await techSkillsFuture;

    final profileId = profile.profileId.isNotEmpty
        ? profile.profileId
        : await TokenStorage.getProfileId() ?? userId;

    final skills = await repo.getSkillsByProfile(profileId);

    final authUser = ref.read(authProvider).valueOrNull;
    final user = UserDto(
      id: userId,
      email: authUser?.email ?? '',
      fullName: authUser?.fullName,
      role: authUser?.role ?? 0,
      hasProfile: authUser?.hasProfile ?? true,
      avatarUrl: authUser?.avatarUrl,
      profileId: profileId,
    );

    return SettingsData(
      user: user,
      profile: profile,
      skills: skills,
      technicalSkills: techSkills,
    );
  }

  Future<void> updateUser(String? fullName, String? avatarUrl) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final userId = current.user.id;
    final updated = await ref
        .read(settingsProfileRepositoryProvider)
        .updateUser(userId, UpdateUserDto(fullName: fullName, avatarUrl: avatarUrl));
    state = AsyncData(current.copyWith(
      user: current.user.copyWith(
        fullName: updated.fullName ?? fullName,
        avatarUrl: updated.avatarUrl ?? avatarUrl,
      ),
    ));
  }

  Future<void> updateProfile(UpdateProfileDto dto) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final userId = current.user.id;
    final updated = await ref
        .read(settingsProfileRepositoryProvider)
        .updateProfile(userId, dto);
    state = AsyncData(current.copyWith(profile: updated));
  }

  Future<void> addSkill(String skillName) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final profileId = current.profile.profileId.isNotEmpty
        ? current.profile.profileId
        : await TokenStorage.getProfileId() ?? current.user.id;
    final skill = await ref
        .read(settingsProfileRepositoryProvider)
        .addSkill(profileId, skillName);
    state = AsyncData(current.copyWith(skills: [...current.skills, skill]));
  }

  Future<void> removeSkill(String skillId) async {
    final current = state.valueOrNull;
    if (current == null) return;
    await ref.read(settingsProfileRepositoryProvider).deleteSkill(skillId);
    state = AsyncData(current.copyWith(
      skills: current.skills.where((s) => s.skillId != skillId).toList(),
    ));
  }

  Future<void> deactivateAccount() async {
    final current = state.valueOrNull;
    if (current == null) return;
    final userId = current.user.id;
    await ref
        .read(settingsProfileRepositoryProvider)
        .deactivateAccount(userId);
    await TokenStorage.clearTokens();
    ref.read(authProvider.notifier).logout();
  }

  Future<String> _getUserId() async {
    final authUser = ref.read(authProvider).valueOrNull;
    if (authUser != null && authUser.id.isNotEmpty) return authUser.id;
    return await TokenStorage.getUserId() ?? '';
  }
}

final settingsProvider =
    AsyncNotifierProvider<SettingsNotifier, SettingsData>(
  SettingsNotifier.new,
);
