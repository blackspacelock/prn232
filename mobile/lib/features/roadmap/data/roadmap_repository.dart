import '../../../core/models/roadmap_models.dart';

abstract class RoadmapRepository {
  Future<List<CareerRoleDto>> getCareerRoles();
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId);
  Future<CareerRoadmapWithNodesDto> getCareerRoadmapWithNodes(
    String careerRoadmapId,
  );
  Future<RoadmapTemplateNodeDto> assignRoadmapNode(
    String careerRoadmapId,
    CreateRoadmapNodeDto dto,
  );
  Future<RoadmapTemplateNodeDto> updateRoadmapNode(
    String careerRoadmapId,
    String roadmapNodeId,
    UpdateRoadmapNodeDto dto,
  );
  Future<void> deleteRoadmapNode(String careerRoadmapId, String roadmapNodeId);
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId);
  Future<List<PersonalRoadmapDto>> getSharedRoadmaps();
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id);
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  );
  Future<PersonalRoadmapDto> copySharedRoadmap(
    String profileId,
    String sharedPersonalRoadmapId,
  );
  Future<PersonalRoadmapDto> createPersonalRoadmap({
    required String profileId,
    required String careerRoleId,
    required String name,
    String? description,
    String? desire,
    required List<Map<String, String>> steps,
  });
  Future<void> deleteRoadmap(String personalRoadmapId);
  Future<void> toggleActiveRoadmap(String personalRoadmapId);
  Future<void> toggleSharedRoadmap(String personalRoadmapId);
  Future<RoadmapTagDto> addTag(
    String personalRoadmapId,
    String name, {
    String? color,
  });
  Future<RoadmapTagDto> updateTag(
    String personalRoadmapId,
    String tagId, {
    String? name,
    String? color,
  });
  Future<void> deleteTag(String personalRoadmapId, String tagId);
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
