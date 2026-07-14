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
    this.isCustom = false,
  });

  final String careerRoadmapId;
  final String name;
  final String? description;
  final CareerRoleDto? careerRole;
  final bool isCustom;

  factory CareerRoadmapDto.fromJson(Map<String, dynamic> json) =>
      CareerRoadmapDto(
        careerRoadmapId: (json['careerRoadmapId'] ?? json['id']).toString(),
        name: (json['name'] ?? json['title'] ?? 'Career Roadmap').toString(),
        description: json['description'] as String?,
        isCustom: json['isCustom'] as bool? ?? false,
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
        nodeId: (json['nodeId'] ??
                json['node']?['nodeId'] ??
                json['node']?['id'] ??
                '')
            .toString(),
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
    this.careerRoadmapName,
    this.careerRoadmapDescription,
    this.note,
    this.inProgressCount = 0,
    this.careerRoadmap,
    this.nodeProgresses = const [],
    this.tags = const [],
  });

  final String personalRoadmapId;
  final String profileId;
  final String careerRoadmapId;
  final String? careerRoadmapName;
  final String? careerRoadmapDescription;
  final String? note;
  final double progressPercentage;
  final int inProgressCount;
  final bool isActive;
  final String createdAt;
  final CareerRoadmapDto? careerRoadmap;
  final List<NodeProgressDto> nodeProgresses;
  final List<RoadmapTagDto> tags;

  String get displayName =>
      careerRoadmapName ?? careerRoadmap?.name ?? 'Personal Roadmap';

  String? get displayDescription =>
      careerRoadmapDescription ?? careerRoadmap?.description;

  factory PersonalRoadmapDto.fromJson(Map<String, dynamic> json) {
    final nodes = json['nodeProgresses'];
    final tags = json['tags'];
    return PersonalRoadmapDto(
      personalRoadmapId: (json['personalRoadmapId'] ?? json['id']).toString(),
      profileId: (json['profileId'] ?? '').toString(),
      careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
      careerRoadmapName: json['careerRoadmapName'] as String?,
      careerRoadmapDescription: json['careerRoadmapDescription'] as String?,
      note: json['note'] as String?,
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0,
      inProgressCount: json['inProgressCount'] as int? ?? 0,
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
      tags: tags is List
          ? tags
              .whereType<Map<String, dynamic>>()
              .map(RoadmapTagDto.fromJson)
              .toList()
          : const [],
    );
  }

  PersonalRoadmapDto copyWith({
    bool? isActive,
    List<RoadmapTagDto>? tags,
  }) {
    return PersonalRoadmapDto(
      personalRoadmapId: personalRoadmapId,
      profileId: profileId,
      careerRoadmapId: careerRoadmapId,
      careerRoadmapName: careerRoadmapName,
      careerRoadmapDescription: careerRoadmapDescription,
      note: note,
      progressPercentage: progressPercentage,
      inProgressCount: inProgressCount,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
      careerRoadmap: careerRoadmap,
      nodeProgresses: nodeProgresses,
      tags: tags ?? this.tags,
    );
  }
}

class RoadmapTagDto {
  const RoadmapTagDto({
    required this.roadmapTagId,
    required this.personalRoadmapId,
    required this.name,
    this.color,
    this.createdAt,
  });

  final String roadmapTagId;
  final String personalRoadmapId;
  final String name;
  final String? color;
  final String? createdAt;

  factory RoadmapTagDto.fromJson(Map<String, dynamic> json) => RoadmapTagDto(
        roadmapTagId: (json['roadmapTagId'] ?? json['id']).toString(),
        personalRoadmapId: (json['personalRoadmapId'] ?? '').toString(),
        name: (json['name'] ?? 'Tag').toString(),
        color: json['color'] as String?,
        createdAt: json['createdAt']?.toString(),
      );
}

class RoadmapTemplateNodeDto {
  const RoadmapTemplateNodeDto({
    required this.roadmapNodeId,
    required this.careerRoadmapId,
    required this.nodeId,
    required this.order,
    required this.nodeType,
    required this.requirementType,
    this.parentRoadmapNodeId,
    this.positionX,
    this.positionY,
    this.createdAt,
    this.node,
  });

  final String roadmapNodeId;
  final String careerRoadmapId;
  final String nodeId;
  final String? parentRoadmapNodeId;
  final int order;
  final String nodeType;
  final String requirementType;
  final int? positionX;
  final int? positionY;
  final String? createdAt;
  final NodeDto? node;

  String get displayName => node?.name ?? 'Roadmap topic';
  String? get displayDescription => node?.description;

  factory RoadmapTemplateNodeDto.fromJson(Map<String, dynamic> json) =>
      RoadmapTemplateNodeDto(
        roadmapNodeId: (json['roadmapNodeId'] ?? json['id']).toString(),
        careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
        nodeId: (json['nodeId'] ?? json['node']?['id'] ?? '').toString(),
        parentRoadmapNodeId: json['parentRoadmapNodeId']?.toString(),
        order: json['order'] as int? ?? 0,
        nodeType: (json['nodeType'] ?? 'Topic').toString(),
        requirementType: (json['requirementType'] ?? 'Required').toString(),
        positionX: json['positionX'] as int?,
        positionY: json['positionY'] as int?,
        createdAt: json['createdAt']?.toString(),
        node: json['node'] is Map<String, dynamic>
            ? NodeDto.fromJson(json['node'] as Map<String, dynamic>)
            : null,
      );
}

class RoadmapTemplateEdgeDto {
  const RoadmapTemplateEdgeDto({
    required this.edgeId,
    required this.careerRoadmapId,
    required this.fromRoadmapNodeId,
    required this.toRoadmapNodeId,
    required this.edgeType,
    this.createdAt,
  });

  final String edgeId;
  final String careerRoadmapId;
  final String fromRoadmapNodeId;
  final String toRoadmapNodeId;
  final String edgeType;
  final String? createdAt;

  factory RoadmapTemplateEdgeDto.fromJson(Map<String, dynamic> json) =>
      RoadmapTemplateEdgeDto(
        edgeId: (json['edgeId'] ?? json['id']).toString(),
        careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
        fromRoadmapNodeId: (json['fromRoadmapNodeId'] ?? '').toString(),
        toRoadmapNodeId: (json['toRoadmapNodeId'] ?? '').toString(),
        edgeType: (json['edgeType'] ?? 'default').toString(),
        createdAt: json['createdAt']?.toString(),
      );
}

class CareerRoadmapWithNodesDto {
  const CareerRoadmapWithNodesDto({
    required this.careerRoadmapId,
    required this.careerRoleId,
    required this.name,
    required this.isCustom,
    this.description,
    this.nodes = const [],
    this.edges = const [],
  });

  final String careerRoadmapId;
  final String careerRoleId;
  final String name;
  final String? description;
  final bool isCustom;
  final List<RoadmapTemplateNodeDto> nodes;
  final List<RoadmapTemplateEdgeDto> edges;

  factory CareerRoadmapWithNodesDto.fromJson(Map<String, dynamic> json) {
    final nodes = json['nodes'];
    final edges = json['edges'];
    return CareerRoadmapWithNodesDto(
      careerRoadmapId: (json['careerRoadmapId'] ?? json['id']).toString(),
      careerRoleId: (json['careerRoleId'] ?? '').toString(),
      name: (json['name'] ?? 'Roadmap Template').toString(),
      description: json['description'] as String?,
      isCustom: json['isCustom'] as bool? ?? false,
      nodes: nodes is List
          ? nodes
              .whereType<Map<String, dynamic>>()
              .map(RoadmapTemplateNodeDto.fromJson)
              .toList()
          : const [],
      edges: edges is List
          ? edges
              .whereType<Map<String, dynamic>>()
              .map(RoadmapTemplateEdgeDto.fromJson)
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
    required this.requiredSkills,
    required this.matchedSkills,
    required this.missingSkills,
    required this.categoryBreakdown,
    this.summary,
  });

  final double coveragePercentage;
  final List<String> requiredSkills;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final List<CategoryBreakdownDto> categoryBreakdown;
  final String? summary;

  factory SkillGapAnalysisDto.fromJson(Map<String, dynamic> json) =>
      SkillGapAnalysisDto(
        coveragePercentage:
            (json['coveragePercentage'] as num?)?.toDouble() ?? 0,
        requiredSkills:
            (json['requiredSkills'] as List?)?.map(_skillName).toList() ??
                const [],
        matchedSkills:
            (json['matchedSkills'] as List?)?.map(_skillName).toList() ??
                const [],
        missingSkills:
            (json['missingSkills'] as List?)?.map(_skillName).toList() ??
                const [],
        categoryBreakdown: (json['categoryBreakdown'] as List?)
                ?.whereType<Map<String, dynamic>>()
                .map(CategoryBreakdownDto.fromJson)
                .toList() ??
            const [],
        summary: json['summary'] as String?,
      );

  static String _skillName(Object? skill) {
    if (skill is Map<String, dynamic>) {
      return (skill['name'] ?? skill['skillName'] ?? '').toString();
    }
    return skill.toString();
  }
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

  factory CategoryBreakdownDto.fromJson(Map<String, dynamic> json) {
    final current = json['currentScore'] ??
        json['current'] ??
        json['yourScore'] ??
        json['yourLevel'];
    final required =
        json['requiredScore'] ?? json['required'] ?? json['requiredLevel'];
    return CategoryBreakdownDto(
      category: (json['category'] ?? json['name'] ?? 'General').toString(),
      currentScore: current is num ? current.toDouble() : 0,
      requiredScore: required is num ? required.toDouble() : 1,
    );
  }
}
