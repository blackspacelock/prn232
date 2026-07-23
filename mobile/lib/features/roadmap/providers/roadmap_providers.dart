import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/job_trend_models.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../ai_mentor/data/chat_repository_impl.dart';
import '../../job_trends/data/job_trends_repository_impl.dart';
import '../../portfolio/data/portfolio_repository_impl.dart';
import '../../profile/providers/profile_provider.dart';
import '../data/roadmap_repository.dart';
import '../data/roadmap_repository_impl.dart';

final roadmapRepositoryProvider = Provider<RoadmapRepository>(
  (_) => RoadmapRepositoryImpl(),
);

final profileIdProvider = FutureProvider<String>((ref) async {
  return await TokenStorage.getProfileId() ??
      await TokenStorage.getUserId() ??
      '';
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

final roadmapNodeEdgesProvider =
    FutureProvider.family<List<RoadmapNodeEdgeDto>, String>(
        (ref, careerRoadmapId) {
  return ref.watch(roadmapRepositoryProvider).getRoadmapNodeEdges(
        careerRoadmapId,
      );
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
  final profileId = await ref.watch(profileIdProvider.future);
  final roadmaps = await ref.watch(personalRoadmapsProvider.future);
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

  final profileRepo = ref.watch(profileRepositoryProvider);
  final roadmapRepo = ref.watch(roadmapRepositoryProvider);
  final portfolioRepo = PortfolioRepositoryImpl();
  final chatRepo = ChatRepositoryImpl();
  final trendsRepo = JobTrendsRepositoryImpl();

  final results = await Future.wait<Object>([
    if (profileId.isEmpty)
      Future<List<SkillDto>>.value(const [])
    else
      profileRepo.getSkillsByProfile(profileId),
    if (profileId.isEmpty)
      Future.value(0)
    else
      portfolioRepo.getRepos(profileId).then((repos) => repos.length),
    if (activeRoadmap == null || profileId.isEmpty)
      Future<SkillGapAnalysisDto>.value(
        const SkillGapAnalysisDto(
          coveragePercentage: 0,
          requiredSkills: [],
          matchedSkills: [],
          missingSkills: [],
          categoryBreakdown: [],
        ),
      )
    else
      roadmapRepo.getSkillGapAnalysis(
        profileId,
        activeRoadmap.careerRoadmapId,
      ),
    trendsRepo.getTopTrending(5),
    if (profileId.isEmpty)
      Future.value(<MentorSessionSummary>[])
    else
      chatRepo.getSessions(profileId).then(
            (sessions) => sessions
                .take(3)
                .map(
                  (session) => MentorSessionSummary(
                    title: session.title,
                    preview: 'Continue this mentor conversation',
                    dateLabel: _dateLabel(session.createdAt),
                  ),
                )
                .toList(),
          ),
  ]);

  final skills = results[0] as List<SkillDto>;
  final repositoryCount = results[1] as int;
  final skillGap = results[2] as SkillGapAnalysisDto;
  final trendingSkills = results[3] as List<JobTrendDto>;
  final mentorSessions = results[4] as List<MentorSessionSummary>;

  return DashboardData(
    roadmaps: roadmaps,
    activeRoadmap: activeRoadmap,
    roadmapCount: roadmaps.length,
    averageProgress: avgProgress,
    skillsCount: skills.length,
    repositoryCount: repositoryCount,
    skillGapCategories: skillGap.categoryBreakdown
        .map(
          (item) => SkillGapCategory(
            item.category,
            item.currentScore,
            item.requiredScore,
          ),
        )
        .toList(),
    trendingSkills: trendingSkills
        .map(
          (item) => SkillTrend(
            item.techSkill,
            item.trendScore / 100,
          ),
        )
        .toList(),
    recentMentorSessions: mentorSessions,
  );
});

String _dateLabel(String value) {
  final createdAt = DateTime.tryParse(value);
  if (createdAt == null) return '';
  final age = DateTime.now().difference(createdAt);
  if (age.inDays == 0) return 'Today';
  if (age.inDays == 1) return 'Yesterday';
  return '${age.inDays} days ago';
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
