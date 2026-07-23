import '../../../core/models/roadmap_models.dart';

abstract class RoadmapRepository {
  Future<List<CareerRoleDto>> getCareerRoles();
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId);
  Future<List<RoadmapNodeEdgeDto>> getRoadmapNodeEdges(String careerRoadmapId);
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId);
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id);
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  );
  Future<PersonalRoadmapDto> createCustomRoadmap(
    CustomPersonalRoadmapRequest request,
  );
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

class CustomPersonalRoadmapRequest {
  const CustomPersonalRoadmapRequest({
    required this.profileId,
    required this.careerRoleId,
    required this.name,
    this.description,
    this.desire,
    required this.steps,
  });

  final String profileId;
  final String careerRoleId;
  final String name;
  final String? description;
  final String? desire;
  final List<CustomRoadmapStepRequest> steps;

  Map<String, dynamic> toJson() => {
        'profileId': profileId,
        'careerRoleId': careerRoleId,
        'name': name,
        if (description != null && description!.trim().isNotEmpty)
          'description': description!.trim(),
        if (desire != null && desire!.trim().isNotEmpty)
          'desire': desire!.trim(),
        'steps': steps.map((step) => step.toJson()).toList(),
      };
}

class CustomRoadmapStepRequest {
  const CustomRoadmapStepRequest({
    required this.name,
    this.description,
    this.previousStepIndex,
    this.parentStepIndex,
    this.branchStepIndex,
    this.positionX,
    this.positionY,
    this.technicalSkillIds = const [],
    this.learningResources = const [],
  });

  final String name;
  final String? description;
  final int? previousStepIndex;
  final int? parentStepIndex;
  final int? branchStepIndex;
  final int? positionX;
  final int? positionY;
  final List<String> technicalSkillIds;
  final List<CustomRoadmapResourceRequest> learningResources;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null && description!.trim().isNotEmpty)
          'description': description!.trim(),
        if (previousStepIndex != null) 'previousStepIndex': previousStepIndex,
        if (parentStepIndex != null) 'parentStepIndex': parentStepIndex,
        if (branchStepIndex != null) 'branchStepIndex': branchStepIndex,
        if (positionX != null) 'positionX': positionX,
        if (positionY != null) 'positionY': positionY,
        'technicalSkillIds': technicalSkillIds,
        'learningResources':
            learningResources.map((resource) => resource.toJson()).toList(),
      };
}

class CustomRoadmapResourceRequest {
  const CustomRoadmapResourceRequest({
    required this.name,
    required this.resourceUrl,
    this.resourceType = 'Article',
    this.provider,
    this.isFree = true,
  });

  final String name;
  final String resourceUrl;
  final String resourceType;
  final String? provider;
  final bool isFree;

  Map<String, dynamic> toJson() => {
        'name': name,
        'resourceUrl': resourceUrl,
        'resourceType': resourceType,
        if (provider != null && provider!.trim().isNotEmpty)
          'provider': provider!.trim(),
        'isFree': isFree,
      };
}
