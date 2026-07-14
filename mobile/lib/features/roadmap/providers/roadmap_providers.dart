import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/chat_models.dart';
import '../../../core/models/job_trend_models.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../ai_mentor/providers/mentor_chat_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../job_trends/providers/market_pulse_provider.dart';
import '../../portfolio/providers/portfolio_provider.dart';
import '../../profile/providers/profile_provider.dart';
import '../data/roadmap_repository.dart';
import '../data/roadmap_repository_impl.dart';

final roadmapRepositoryProvider = Provider<RoadmapRepository>(
  (_) => RoadmapRepositoryImpl(),
);

final profileIdProvider = FutureProvider<String>((ref) async {
  final user = ref.watch(authProvider).valueOrNull;
  final authProfileId = user?.profileId;
  if (authProfileId != null && authProfileId.isNotEmpty) {
    return authProfileId;
  }

  final storedProfileId = await TokenStorage.getProfileId();
  if (storedProfileId != null && storedProfileId.isNotEmpty) {
    return storedProfileId;
  }

  return user?.id ?? await TokenStorage.getUserId() ?? '';
});

final careerRolesProvider = FutureProvider<List<CareerRoleDto>>((ref) {
  return ref.watch(roadmapRepositoryProvider).getCareerRoles();
});

final selectedCareerRoleProvider = StateProvider<CareerRoleDto?>((ref) => null);

final roadmapsBySelectedRoleProvider =
    FutureProvider<List<CareerRoadmapDto>>((ref) async {
  final selected = ref.watch(selectedCareerRoleProvider);
  if (selected == null) return const [];
  return ref
      .watch(roadmapRepositoryProvider)
      .getRoadmapsByRole(selected.careerRoleId);
});

final roadmapsByRoleProvider =
    FutureProvider.family<List<CareerRoadmapDto>, String>((ref, roleId) {
  return ref.watch(roadmapRepositoryProvider).getRoadmapsByRole(roleId);
});

final careerRoadmapTemplateProvider =
    FutureProvider.family<CareerRoadmapWithNodesDto, String>((ref, roadmapId) {
  return ref
      .watch(roadmapRepositoryProvider)
      .getCareerRoadmapWithNodes(roadmapId);
});

final personalRoadmapsProvider =
    FutureProvider<List<PersonalRoadmapDto>>((ref) async {
  final profileId = await ref.watch(profileIdProvider.future);
  return ref.watch(roadmapRepositoryProvider).getPersonalRoadmaps(profileId);
});

final personalRoadmapDetailProvider =
    FutureProvider.family<PersonalRoadmapDto, String>((ref, id) {
  return ref
      .watch(roadmapRepositoryProvider)
      .getPersonalRoadmapWithProgress(id);
});

final learningResourcesProvider =
    FutureProvider.family<List<LearningResourceDto>, String>((ref, nodeId) {
  return ref.watch(roadmapRepositoryProvider).getResourcesByNode(nodeId);
});

final recommendedResourcesProvider =
    FutureProvider.family<List<LearningResourceDto>, String>(
        (ref, nodeId) async {
  final profileId = await ref.watch(profileIdProvider.future);
  return ref
      .watch(roadmapRepositoryProvider)
      .getRecommendedResources(profileId, nodeId);
});

class SkillInputNotifier extends AsyncNotifier<List<SkillDto>> {
  @override
  Future<List<SkillDto>> build() async {
    final profileId = await ref.watch(profileIdProvider.future);
    return ref.watch(profileRepositoryProvider).getSkillsByProfile(profileId);
  }

  Future<void> addSkill(String skillName) async {
    final profileId = await ref.read(profileIdProvider.future);
    await ref.read(profileRepositoryProvider).addSkill(profileId, skillName);
    ref.invalidateSelf();
  }

  Future<void> removeSkill(String skillId) async {
    await ref.read(profileRepositoryProvider).deleteSkill(skillId);
    ref.invalidateSelf();
  }
}

final skillInputProvider =
    AsyncNotifierProvider<SkillInputNotifier, List<SkillDto>>(
  SkillInputNotifier.new,
);

final technicalSkillsProvider = FutureProvider<List<TechnicalSkillDto>>((ref) {
  return ref.watch(profileRepositoryProvider).getTechnicalSkills();
});

final skillGapAnalysisProvider =
    FutureProvider.family<SkillGapAnalysisDto, String>(
        (ref, careerRoadmapId) async {
  final profileId = await ref.watch(profileIdProvider.future);
  return ref
      .watch(roadmapRepositoryProvider)
      .getSkillGapAnalysis(profileId, careerRoadmapId);
});

final trendingSkillRecommendationsProvider =
    FutureProvider<List<String>>((ref) async {
  final profileId = await ref.watch(profileIdProvider.future);
  return ref
      .watch(roadmapRepositoryProvider)
      .getTrendingSkillRecommendations(profileId);
});

final dashboardDataProvider = FutureProvider<DashboardData>((ref) async {
  final roadmaps = await ref.watch(personalRoadmapsProvider.future);
  final profileId = await ref.watch(profileIdProvider.future);
  PersonalRoadmapDto? activeRoadmap;
  for (final roadmap in roadmaps) {
    if (roadmap.isActive) {
      activeRoadmap = roadmap;
      break;
    }
  }
  final avgProgress = roadmaps.isEmpty
      ? 0.0
      : roadmaps
              .map((roadmap) => roadmap.progressPercentage)
              .reduce((a, b) => a + b) /
          roadmaps.length;

  final skills = profileId.isEmpty
      ? const <SkillDto>[]
      : await _orDefault(
          () => ref.read(profileRepositoryProvider).getSkillsByProfile(
                profileId,
              ),
          const <SkillDto>[],
        );
  final repos = profileId.isEmpty
      ? const <GitHubRepositoryDto>[]
      : await _orDefault(
          () => ref.read(portfolioRepositoryProvider).getRepos(profileId),
          const <GitHubRepositoryDto>[],
        );
  final skillGap = activeRoadmap == null || profileId.isEmpty
      ? null
      : await _orDefault<SkillGapAnalysisDto?>(
          () => ref.read(roadmapRepositoryProvider).getSkillGapAnalysis(
                profileId,
                activeRoadmap!.careerRoadmapId,
              ),
          null,
        );
  final topSkills = await _orDefault(
    () => ref.read(jobTrendsRepositoryProvider).getTopTrending(6),
    const <JobTrendDto>[],
  );
  final sessions = profileId.isEmpty
      ? const <ChatSessionDto>[]
      : await _orDefault(
          () => ref.read(chatRepositoryProvider).getSessions(profileId),
          const <ChatSessionDto>[],
        );

  return DashboardData(
    roadmaps: roadmaps,
    activeRoadmap: activeRoadmap,
    roadmapCount: roadmaps.length,
    averageProgress: avgProgress,
    skillsCount: skills.length,
    repositoryCount: repos.length,
    skillGapCategories: skillGap?.categoryBreakdown
            .map(
              (category) => SkillGapCategory(
                category.category,
                category.currentScore,
                category.requiredScore,
              ),
            )
            .toList() ??
        const [],
    trendingSkills: topSkills
        .map(
          (skill) => SkillTrend(skill.techSkill, skill.trendScore),
        )
        .toList(),
    recentMentorSessions: sessions
        .take(2)
        .map(
          (session) => MentorSessionSummary(
            title: session.title,
            preview: session.messages.isNotEmpty
                ? session.messages.last.messageContent
                : 'Continue your AI mentor conversation.',
            dateLabel: _dateLabel(session.createdAt),
          ),
        )
        .toList(),
  );
});

Future<T> _orDefault<T>(Future<T> Function() load, T fallback) async {
  try {
    return await load();
  } catch (_) {
    return fallback;
  }
}

String _dateLabel(String value) {
  final date = DateTime.tryParse(value)?.toLocal();
  if (date == null) return '';
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final sessionDay = DateTime(date.year, date.month, date.day);
  final days = today.difference(sessionDay).inDays;
  if (days == 0) return 'Today';
  if (days == 1) return 'Yesterday';
  if (days < 7) return '${days}d ago';
  return '${date.month}/${date.day}/${date.year}';
}

class DashboardData {
  const DashboardData({
    required this.roadmaps,
    required this.activeRoadmap,
    required this.roadmapCount,
    required this.averageProgress,
    required this.skillsCount,
    required this.repositoryCount,
    required this.skillGapCategories,
    required this.trendingSkills,
    required this.recentMentorSessions,
  });

  final List<PersonalRoadmapDto> roadmaps;
  final PersonalRoadmapDto? activeRoadmap;
  final int roadmapCount;
  final double averageProgress;
  final int skillsCount;
  final int repositoryCount;
  final List<SkillGapCategory> skillGapCategories;
  final List<SkillTrend> trendingSkills;
  final List<MentorSessionSummary> recentMentorSessions;
}

class SkillGapCategory {
  const SkillGapCategory(this.name, this.current, this.required);

  final String name;
  final double current;
  final double required;
}

class SkillTrend {
  const SkillTrend(this.name, this.score);

  final String name;
  final double score;
}

class MentorSessionSummary {
  const MentorSessionSummary({
    required this.title,
    required this.preview,
    required this.dateLabel,
  });

  final String title;
  final String preview;
  final String dateLabel;
}
