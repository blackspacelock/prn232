import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/storage/token_storage.dart';
import '../data/roadmap_repository.dart';
import '../data/roadmap_repository_impl.dart';

final roadmapRepositoryProvider = Provider<RoadmapRepository>(
  (_) => RoadmapRepositoryImpl(),
);

final profileIdProvider = FutureProvider<String>((ref) async {
  return await TokenStorage.getUserId() ?? 'demo-profile';
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

final dashboardDataProvider = FutureProvider<DashboardData>((ref) async {
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

  return DashboardData(
    roadmaps: roadmaps,
    activeRoadmap: activeRoadmap,
    roadmapCount: roadmaps.length,
    averageProgress: avgProgress,
    skillsCount: 12,
    repositoryCount: 3,
    trendingSkills: const [
      SkillTrend('Flutter', 0.92),
      SkillTrend('ASP.NET Core', 0.84),
      SkillTrend('SQL', 0.76),
      SkillTrend('Docker', 0.64),
      SkillTrend('Azure', 0.58),
    ],
  );
});

class DashboardData {
  const DashboardData({
    required this.roadmaps,
    required this.activeRoadmap,
    required this.roadmapCount,
    required this.averageProgress,
    required this.skillsCount,
    required this.repositoryCount,
    required this.trendingSkills,
  });

  final List<PersonalRoadmapDto> roadmaps;
  final PersonalRoadmapDto? activeRoadmap;
  final int roadmapCount;
  final double averageProgress;
  final int skillsCount;
  final int repositoryCount;
  final List<SkillTrend> trendingSkills;
}

class SkillTrend {
  const SkillTrend(this.name, this.score);

  final String name;
  final double score;
}
