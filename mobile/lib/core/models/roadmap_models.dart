class CareerRoleDto {
  const CareerRoleDto({
    required this.careerRoleId,
    required this.name,
    this.description,
    this.iconName,
  });

  final String careerRoleId;
  final String name;
  final String? description;
  final String? iconName;

  factory CareerRoleDto.fromJson(Map<String, dynamic> json) => CareerRoleDto(
        careerRoleId:
            (json['careerRoleId'] ?? json['id'] ?? json['roleId']).toString(),
        name: (json['name'] ?? json['roleName'] ?? 'Career Role').toString(),
        description: json['description'] as String?,
        iconName: json['iconName'] as String?,
      );
}

class CareerRoadmapDto {
  const CareerRoadmapDto({
    required this.careerRoadmapId,
    required this.name,
    this.description,
    this.careerRole,
  });

  final String careerRoadmapId;
  final String name;
  final String? description;
  final CareerRoleDto? careerRole;

  factory CareerRoadmapDto.fromJson(Map<String, dynamic> json) =>
      CareerRoadmapDto(
        careerRoadmapId: (json['careerRoadmapId'] ?? json['id']).toString(),
        name: (json['name'] ?? json['title'] ?? 'Career Roadmap').toString(),
        description: json['description'] as String?,
        careerRole: json['careerRole'] is Map<String, dynamic>
            ? CareerRoleDto.fromJson(json['careerRole'] as Map<String, dynamic>)
            : null,
      );
}

class NodeDto {
  const NodeDto({
    required this.nodeId,
    required this.name,
    required this.order,
    this.description,
    this.parentNodeId,
  });

  final String nodeId;
  final String name;
  final int order;
  final String? description;
  final String? parentNodeId;

  factory NodeDto.fromJson(Map<String, dynamic> json) => NodeDto(
        nodeId: (json['nodeId'] ?? json['id']).toString(),
        name: (json['name'] ?? json['title'] ?? 'Roadmap Node').toString(),
        order: json['order'] as int? ?? 0,
        description: json['description'] as String?,
        parentNodeId: json['parentNodeId'] as String?,
      );
}

class NodeProgressDto {
  const NodeProgressDto({
    required this.nodeProgressId,
    required this.personalRoadmapId,
    required this.nodeId,
    required this.status,
    this.note,
    this.node,
  });

  final String nodeProgressId;
  final String personalRoadmapId;
  final String nodeId;
  final int status;
  final String? note;
  final NodeDto? node;

  factory NodeProgressDto.fromJson(Map<String, dynamic> json) =>
      NodeProgressDto(
        nodeProgressId: (json['nodeProgressId'] ?? json['id']).toString(),
        personalRoadmapId: (json['personalRoadmapId'] ?? '').toString(),
        nodeId: (json['nodeId'] ?? json['node']?['nodeId'] ?? '').toString(),
        status: json['status'] as int? ?? 0,
        note: json['note'] as String?,
        node: json['node'] is Map<String, dynamic>
            ? NodeDto.fromJson(json['node'] as Map<String, dynamic>)
            : null,
      );
}

class PersonalRoadmapDto {
  const PersonalRoadmapDto({
    required this.personalRoadmapId,
    required this.profileId,
    required this.careerRoadmapId,
    required this.progressPercentage,
    required this.isActive,
    required this.createdAt,
    this.careerRoadmap,
    this.nodeProgresses = const [],
  });

  final String personalRoadmapId;
  final String profileId;
  final String careerRoadmapId;
  final double progressPercentage;
  final bool isActive;
  final String createdAt;
  final CareerRoadmapDto? careerRoadmap;
  final List<NodeProgressDto> nodeProgresses;

  factory PersonalRoadmapDto.fromJson(Map<String, dynamic> json) {
    final nodes = json['nodeProgresses'];
    return PersonalRoadmapDto(
      personalRoadmapId: (json['personalRoadmapId'] ?? json['id']).toString(),
      profileId: (json['profileId'] ?? '').toString(),
      careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0,
      isActive: json['isActive'] as bool? ?? false,
      createdAt: (json['createdAt'] ?? '').toString(),
      careerRoadmap: json['careerRoadmap'] is Map<String, dynamic>
          ? CareerRoadmapDto.fromJson(
              json['careerRoadmap'] as Map<String, dynamic>,
            )
          : null,
      nodeProgresses: nodes is List
          ? nodes
              .whereType<Map<String, dynamic>>()
              .map(NodeProgressDto.fromJson)
              .toList()
          : const [],
    );
  }
}

class LearningResourceDto {
  const LearningResourceDto({
    required this.learningResourceId,
    required this.nodeId,
    required this.resourceName,
    required this.resourceUrl,
    required this.resourceType,
    required this.provider,
    required this.isFree,
  });

  final String learningResourceId;
  final String nodeId;
  final String resourceName;
  final String resourceUrl;
  final String resourceType;
  final String provider;
  final bool isFree;

  factory LearningResourceDto.fromJson(Map<String, dynamic> json) =>
      LearningResourceDto(
        learningResourceId:
            (json['learningResourceId'] ?? json['resourceId'] ?? json['id'])
                .toString(),
        nodeId: (json['nodeId'] ?? '').toString(),
        resourceName: (json['resourceName'] ??
                json['name'] ??
                json['title'] ??
                'Resource')
            .toString(),
        resourceUrl: (json['resourceUrl'] ?? json['url'] ?? json['link'] ?? '')
            .toString(),
        resourceType:
            (json['resourceType'] ?? json['type'] ?? 'Article').toString(),
        provider:
            (json['provider'] ?? json['source'] ?? json['platform'] ?? 'Web')
                .toString(),
        isFree: json['isFree'] as bool? ?? true,
      );
}

class SkillGapAnalysisDto {
  const SkillGapAnalysisDto({
    required this.coveragePercentage,
    required this.matchedSkills,
    required this.missingSkills,
    required this.categoryBreakdown,
  });

  final double coveragePercentage;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final List<CategoryBreakdownDto> categoryBreakdown;

  factory SkillGapAnalysisDto.fromJson(Map<String, dynamic> json) =>
      SkillGapAnalysisDto(
        coveragePercentage:
            (json['coveragePercentage'] as num?)?.toDouble() ?? 0,
        matchedSkills: (json['matchedSkills'] as List?)
                ?.map((skill) => skill.toString())
                .toList() ??
            const [],
        missingSkills: (json['missingSkills'] as List?)
                ?.map((skill) => skill.toString())
                .toList() ??
            const [],
        categoryBreakdown: (json['categoryBreakdown'] as List?)
                ?.whereType<Map<String, dynamic>>()
                .map(CategoryBreakdownDto.fromJson)
                .toList() ??
            const [],
      );
}

class CategoryBreakdownDto {
  const CategoryBreakdownDto({
    required this.category,
    required this.currentScore,
    required this.requiredScore,
  });

  final String category;
  final double currentScore;
  final double requiredScore;

  factory CategoryBreakdownDto.fromJson(Map<String, dynamic> json) =>
      CategoryBreakdownDto(
        category: (json['category'] ?? json['name'] ?? 'General').toString(),
        currentScore: (json['currentScore'] ??
                    json['current'] ??
                    json['yourScore'] as num?)
                ?.toDouble() ??
            0,
        requiredScore:
            (json['requiredScore'] ?? json['required'] as num?)?.toDouble() ??
                1,
      );
}
