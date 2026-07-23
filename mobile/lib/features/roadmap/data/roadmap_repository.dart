import '../../../core/models/roadmap_models.dart';

abstract class RoadmapRepository {
  Future<List<CareerRoleDto>> getCareerRoles();
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId);
  Future<List<RoadmapNodeEdgeDto>> getRoadmapNodeEdges(String careerRoadmapId);
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId);
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id);
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId, {
    String? note,
  });
  Future<void> toggleActiveRoadmap(String personalRoadmapId);
  Future<void> deleteRoadmap(String personalRoadmapId);
  Future<void> updateNodeStatus(
    String nodeProgressId,
    int status, {
    String? note,
  });
  Future<List<LearningResourceDto>> getResourcesByNode(String nodeId);
  Future<List<LearningResourceDto>> getRecommendedResources(
    String profileId,
    String nodeId,
  );
  Future<SkillGapAnalysisDto> getSkillGapAnalysis(
    String profileId,
    String careerRoadmapId,
  );
  Future<List<String>> getTrendingSkillRecommendations(String profileId);
}
