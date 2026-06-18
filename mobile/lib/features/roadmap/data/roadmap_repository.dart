import '../../../core/models/roadmap_models.dart';

abstract class RoadmapRepository {
  Future<List<CareerRoleDto>> getCareerRoles();
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId);
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId);
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id);
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  );
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
}
