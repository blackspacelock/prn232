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

class RoadmapNodeDto {
  const RoadmapNodeDto({
    required this.roadmapNodeId,
    required this.nodeId,
    required this.order,
    this.parentRoadmapNodeId,
    this.nodeType,
    this.requirementType,
    this.positionX,
    this.positionY,
    this.node,
  });

  final String roadmapNodeId;
  final String nodeId;
  final int order;
  final String? parentRoadmapNodeId;
  final String? nodeType;
  final String? requirementType;
  final double? positionX;
  final double? positionY;
  final NodeDto? node;

  factory RoadmapNodeDto.fromJson(Map<String, dynamic> json) => RoadmapNodeDto(
        roadmapNodeId: (json['roadmapNodeId'] ?? json['id']).toString(),
        nodeId: (json['nodeId'] ?? json['node']?['id'] ?? '').toString(),
        order: json['order'] as int? ?? 0,
        parentRoadmapNodeId: json['parentRoadmapNodeId'] as String?,
        nodeType: json['nodeType'] as String?,
        requirementType: json['requirementType'] as String?,
        positionX: (json['positionX'] as num?)?.toDouble(),
        positionY: (json['positionY'] as num?)?.toDouble(),
        node: json['node'] is Map<String, dynamic>
            ? NodeDto.fromJson(json['node'] as Map<String, dynamic>)
            : null,
      );
}

class RoadmapNodeEdgeDto {
  const RoadmapNodeEdgeDto({
    required this.roadmapNodeEdgeId,
    required this.careerRoadmapId,
    required this.fromRoadmapNodeId,
    required this.toRoadmapNodeId,
    this.edgeType,
  });

  final String roadmapNodeEdgeId;
  final String careerRoadmapId;
  final String fromRoadmapNodeId;
  final String toRoadmapNodeId;
  final String? edgeType;

  factory RoadmapNodeEdgeDto.fromJson(Map<String, dynamic> json) =>
      RoadmapNodeEdgeDto(
        roadmapNodeEdgeId:
            (json['roadmapNodeEdgeId'] ?? json['edgeId'] ?? json['id'])
                .toString(),
        careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
        fromRoadmapNodeId: (json['fromRoadmapNodeId'] ?? '').toString(),
        toRoadmapNodeId: (json['toRoadmapNodeId'] ?? '').toString(),
        edgeType: json['edgeType'] as String?,
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
    this.roadmapNode,
  });

  final String nodeProgressId;
  final String personalRoadmapId;
  final String nodeId;
  final int status;
  final String? note;
  final NodeDto? node;
  final RoadmapNodeDto? roadmapNode;

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
        roadmapNode: json['roadmapNode'] is Map<String, dynamic>
            ? RoadmapNodeDto.fromJson(
                json['roadmapNode'] as Map<String, dynamic>,
              )
            : null,
      );
}

class RoadmapTagDto {
  const RoadmapTagDto({
    required this.roadmapTagId,
    required this.personalRoadmapId,
    required this.name,
    required this.createdAt,
    this.color,
  });

  final String roadmapTagId;
  final String personalRoadmapId;
  final String name;
  final String createdAt;
  final String? color;

  factory RoadmapTagDto.fromJson(Map<String, dynamic> json) => RoadmapTagDto(
        roadmapTagId: (json['roadmapTagId'] ?? json['id']).toString(),
        personalRoadmapId: (json['personalRoadmapId'] ?? '').toString(),
        name: (json['name'] ?? '').toString(),
        color: json['color'] as String?,
        createdAt:
            (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
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
    this.note,
    this.careerRoadmap,
    this.nodeProgresses = const [],
    this.tags = const [],
  });

  final String personalRoadmapId;
  final String profileId;
  final String careerRoadmapId;
  final double progressPercentage;
  final bool isActive;
  final String createdAt;
  final String? note;
  final CareerRoadmapDto? careerRoadmap;
  final List<NodeProgressDto> nodeProgresses;
  final List<RoadmapTagDto> tags;

  factory PersonalRoadmapDto.fromJson(Map<String, dynamic> json) {
    final nodes = json['nodeProgresses'];
    final tags = json['tags'];
    return PersonalRoadmapDto(
      personalRoadmapId: (json['personalRoadmapId'] ?? json['id']).toString(),
      profileId: (json['profileId'] ?? '').toString(),
      careerRoadmapId: (json['careerRoadmapId'] ?? '').toString(),
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0,
      isActive: json['isActive'] as bool? ?? false,
      createdAt: (json['createdAt'] ?? '').toString(),
      note: json['note'] as String?,
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
    if (skill is Map) {
      return (skill['name'] ?? skill['skillName'] ?? skill['id'] ?? '')
          .toString();
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

  factory CategoryBreakdownDto.fromJson(Map<String, dynamic> json) =>
      CategoryBreakdownDto(
        category: (json['category'] ?? json['name'] ?? 'General').toString(),
        currentScore: _number(
          json['currentScore'] ??
              json['current'] ??
              json['yourScore'] ??
              json['yourLevel'],
        ),
        requiredScore: _number(
          json['requiredScore'] ?? json['required'] ?? json['requiredLevel'],
          fallback: 100,
        ),
      );

  static double _number(Object? value, {double fallback = 0}) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }
}
