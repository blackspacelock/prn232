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
    required this.nodes,
    required this.edges,
  });

  final String profileId;
  final String careerRoleId;
  final String name;
  final String? description;
  final List<CustomRoadmapNodeRequest> nodes;
  final List<CustomRoadmapEdgeRequest> edges;

  Map<String, dynamic> toJson() => {
        'profileId': profileId,
        'careerRoleId': careerRoleId,
        'name': name,
        if (description != null && description!.trim().isNotEmpty)
          'description': description!.trim(),
        'nodes': nodes.map((node) => node.toJson()).toList(),
        'edges': edges.map((edge) => edge.toJson()).toList(),
      };
}

class CustomRoadmapNodeRequest {
  const CustomRoadmapNodeRequest({
    required this.clientId,
    this.parentClientId,
    required this.name,
    this.description,
    required this.order,
    this.nodeType = 'Topic',
    this.requirementType = 'Required',
    this.positionX,
    this.positionY,
    this.technicalSkills = const [],
    this.learningResources = const [],
  });

  final String clientId;
  final String? parentClientId;
  final String name;
  final String? description;
  final int order;
  final String nodeType;
  final String requirementType;
  final int? positionX;
  final int? positionY;
  final List<CustomRoadmapSkillRequest> technicalSkills;
  final List<CustomRoadmapResourceRequest> learningResources;

  Map<String, dynamic> toJson() => {
        'clientId': clientId,
        if (parentClientId != null) 'parentClientId': parentClientId,
        'name': name,
        if (description != null && description!.trim().isNotEmpty)
          'description': description!.trim(),
        'order': order,
        'nodeType': nodeType,
        'requirementType': requirementType,
        if (positionX != null) 'positionX': positionX,
        if (positionY != null) 'positionY': positionY,
        'technicalSkills':
            technicalSkills.map((skill) => skill.toJson()).toList(),
        'learningResources':
            learningResources.map((resource) => resource.toJson()).toList(),
      };
}

class CustomRoadmapSkillRequest {
  const CustomRoadmapSkillRequest({
    required this.name,
    this.category = 'General',
  });

  final String name;
  final String category;

  Map<String, dynamic> toJson() => {
        'name': name,
        'category': category,
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

class CustomRoadmapEdgeRequest {
  const CustomRoadmapEdgeRequest({
    required this.fromClientId,
    required this.toClientId,
    this.edgeType = 'Next',
  });

  final String fromClientId;
  final String toClientId;
  final String edgeType;

  Map<String, dynamic> toJson() => {
        'fromClientId': fromClientId,
        'toClientId': toClientId,
        'edgeType': edgeType,
      };
}
