import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/roadmap_models.dart';
import 'roadmap_repository.dart';

class RoadmapRepositoryImpl implements RoadmapRepository {
  RoadmapRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;
  static const _cascadeDeleteQuery = {'delete': true};

  @override
  Future<List<CareerRoleDto>> getCareerRoles() async {
    final data = await _query(_careerRolesQuery);
    return _asList(data['careerRoles']).map(CareerRoleDto.fromJson).toList();
  }

  @override
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId) async {
    final data = await _query(
      _careerRoadmapsByRoleQuery,
      variables: {'careerRoleId': careerRoleId},
    );
    return _asList(data['careerRoadmapsByRole'])
        .map(CareerRoadmapDto.fromJson)
        .toList();
  }

  @override
  Future<CareerRoadmapWithNodesDto> getCareerRoadmapWithNodes(
    String careerRoadmapId,
  ) async {
    final data = await _query(
      _careerRoadmapWithNodesQuery,
      variables: {'roadmapId': careerRoadmapId},
    );
    final roadmap = data['careerRoadmapWithNodes'];
    if (roadmap is Map<String, dynamic>) {
      return CareerRoadmapWithNodesDto.fromJson(roadmap);
    }
    throw StateError('Roadmap template not found');
  }

  @override
  Future<RoadmapTemplateNodeDto> assignRoadmapNode(
    String careerRoadmapId,
    CreateRoadmapNodeDto dto,
  ) async {
    final response = await _dio.post(
      '${ApiConstants.careerRoadmaps}/$careerRoadmapId/roadmap-nodes',
      data: dto.toJson(),
    );
    return RoadmapTemplateNodeDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  @override
  Future<RoadmapTemplateNodeDto> updateRoadmapNode(
    String careerRoadmapId,
    String roadmapNodeId,
    UpdateRoadmapNodeDto dto,
  ) async {
    final response = await _dio.put(
      '${ApiConstants.careerRoadmaps}/$careerRoadmapId/roadmap-nodes/$roadmapNodeId',
      data: dto.toJson(),
    );
    return RoadmapTemplateNodeDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  @override
  Future<void> deleteRoadmapNode(
    String careerRoadmapId,
    String roadmapNodeId,
  ) async {
    await _dio.delete(
      '${ApiConstants.careerRoadmaps}/$careerRoadmapId/roadmap-nodes/$roadmapNodeId',
      queryParameters: _cascadeDeleteQuery,
    );
  }

  @override
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId) async {
    if (profileId.isEmpty) return const [];
    final data = await _query(
      _personalRoadmapsByProfileQuery,
      variables: {'profileId': profileId},
    );
    return _asList(data['personalRoadmapsByProfile'])
        .map(PersonalRoadmapDto.fromJson)
        .toList();
  }

  @override
  Future<List<PersonalRoadmapDto>> getSharedRoadmaps() async {
    final response = await _dio.get('${ApiConstants.personalRoadmaps}/shared');
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(PersonalRoadmapDto.fromJson)
        .toList();
  }

  @override
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id) async {
    final data = await _query(
      _personalRoadmapWithProgressQuery,
      variables: {'personalRoadmapId': id},
    );
    final roadmap = data['personalRoadmapWithProgress'];
    if (roadmap is Map<String, dynamic>) {
      return PersonalRoadmapDto.fromJson(roadmap);
    }
    throw StateError('Roadmap not found');
  }

  @override
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  ) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.personalRoadmaps}/generate',
        data: {
          'profileId': profileId,
          'careerRoadmapId': careerRoadmapId,
        },
      );
      return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      rethrow;
    }
  }

  @override
  Future<PersonalRoadmapDto> copySharedRoadmap(
    String profileId,
    String sharedPersonalRoadmapId,
  ) async {
    final response = await _dio.post(
      '${ApiConstants.personalRoadmaps}/shared/$sharedPersonalRoadmapId/copy',
      data: {'profileId': profileId},
    );
    return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<PersonalRoadmapDto> createPersonalRoadmap({
    required String profileId,
    required String careerRoleId,
    required String name,
    String? description,
    String? desire,
    required List<Map<String, String>> steps,
  }) async {
    final response = await _dio.post(
      ApiConstants.personalRoadmaps,
      data: {
        'profileId': profileId,
        'careerRoleId': careerRoleId,
        'name': name,
        if (description != null && description.isNotEmpty)
          'description': description,
        if (desire != null && desire.isNotEmpty) 'desire': desire,
        'steps': steps,
      },
    );
    return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> deleteRoadmap(String personalRoadmapId) async {
    try {
      await _dio.delete(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId',
        queryParameters: _cascadeDeleteQuery,
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<void> toggleActiveRoadmap(String personalRoadmapId) async {
    try {
      await _dio.put(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/toggle-active',
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<void> toggleSharedRoadmap(String personalRoadmapId) async {
    await _dio.put(
      '${ApiConstants.personalRoadmaps}/$personalRoadmapId/toggle-shared',
    );
  }

  @override
  Future<RoadmapTagDto> addTag(
    String personalRoadmapId,
    String name, {
    String? color,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags',
        data: {'name': name, if (color != null) 'color': color},
      );
      return RoadmapTagDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return RoadmapTagDto(
        roadmapTagId: 'tag-${DateTime.now().millisecondsSinceEpoch}',
        personalRoadmapId: personalRoadmapId,
        name: name,
        color: color,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  @override
  Future<RoadmapTagDto> updateTag(
    String personalRoadmapId,
    String tagId, {
    String? name,
    String? color,
  }) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags/$tagId',
        data: {
          if (name != null) 'name': name,
          if (color != null) 'color': color,
        },
      );
      return RoadmapTagDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return RoadmapTagDto(
        roadmapTagId: tagId,
        personalRoadmapId: personalRoadmapId,
        name: name ?? 'Tag',
        color: color,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  @override
  Future<void> deleteTag(String personalRoadmapId, String tagId) async {
    try {
      await _dio.delete(
        '${ApiConstants.personalRoadmaps}/$personalRoadmapId/tags/$tagId',
        queryParameters: _cascadeDeleteQuery,
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<void> updateNodeStatus(
    String nodeProgressId,
    int status, {
    String? note,
  }) async {
    try {
      await _dio.put(
        '${ApiConstants.nodeProgress}/$nodeProgressId/status',
        data: {'status': status, if (note != null) 'note': note},
      );
    } on DioException {
      return;
    }
  }

  @override
  Future<List<LearningResourceDto>> getResourcesByNode(String nodeId) async {
    final data = await _query(
      _learningResourcesByNodeQuery,
      variables: {'nodeId': nodeId},
    );
    return _asList(data['learningResourcesByNode'])
        .map(LearningResourceDto.fromJson)
        .toList();
  }

  @override
  Future<List<LearningResourceDto>> getRecommendedResources(
    String profileId,
    String nodeId,
  ) async {
    final data = await _query(
      _recommendedResourcesQuery,
      variables: {'profileId': profileId, 'nodeId': nodeId},
    );
    return _asList(data['recommendedResources'])
        .map(LearningResourceDto.fromJson)
        .toList();
  }

  @override
  Future<SkillGapAnalysisDto> getSkillGapAnalysis(
    String profileId,
    String careerRoadmapId,
  ) async {
    final data = await _query(
      _skillGapAnalysisQuery,
      variables: {'profileId': profileId},
    );
    final analysis = data['skillGapAnalysis'];
    if (analysis is Map<String, dynamic>) {
      return SkillGapAnalysisDto.fromJson(analysis);
    }
    throw StateError('No skill gap analysis available');
  }

  @override
  Future<List<String>> getTrendingSkillRecommendations(String profileId) async {
    final data = await _query(
      _trendingSkillRecommendationsQuery,
      variables: {'profileId': profileId},
    );
    final recommendations = data['trendingSkillRecommendations'];
    if (recommendations is! List) return const [];
    return recommendations.map((skill) => skill.toString()).toList();
  }

  Future<Map<String, dynamic>> _query(
    String query, {
    Map<String, dynamic> variables = const {},
  }) async {
    final response = await _dio.post(
      ApiConstants.graphqlEndpoint,
      data: {'query': query, 'variables': variables},
    );
    final payload = response.data;
    if (payload is! Map<String, dynamic>) {
      throw StateError('Invalid GraphQL response');
    }
    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      throw StateError(errors.first.toString());
    }
    final data = payload['data'];
    if (data is Map<String, dynamic>) return data;
    return const {};
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }
}

const _careerRolesQuery = r'''
query MobileCareerRoles {
  careerRoles {
    id
    name
    description
  }
}
''';

const _careerRoadmapsByRoleQuery = r'''
query MobileCareerRoadmapsByRole($careerRoleId: UUID!) {
  careerRoadmapsByRole(careerRoleId: $careerRoleId) {
    id
    careerRoleId
    name
    description
    isCustom
    createdAt
  }
}
''';

const _careerRoadmapWithNodesQuery = r'''
query MobileCareerRoadmapWithNodes($roadmapId: UUID!) {
  careerRoadmapWithNodes(roadmapId: $roadmapId) {
    id
    careerRoleId
    name
    description
    isCustom
    nodes {
      id
      careerRoadmapId
      nodeId
      parentRoadmapNodeId
      order
      nodeType
      requirementType
      positionX
      positionY
      createdAt
      node {
        id
        parentNodeId
        name
        description
        order
        technicalSkills {
          id
          name
          category
        }
      }
    }
    edges {
      id
      careerRoadmapId
      fromRoadmapNodeId
      toRoadmapNodeId
      edgeType
      createdAt
    }
  }
}
''';

const _personalRoadmapsByProfileQuery = r'''
query MobilePersonalRoadmapsByProfile($profileId: UUID!) {
  personalRoadmapsByProfile(profileId: $profileId) {
    id
    profileId
    careerRoadmapId
    careerRoadmapName
    careerRoadmapDescription
    note
    progressPercentage
    inProgressCount
    isActive
    isShared
    sharedAt
    ownerName
    createdAt
    tags {
      id
      personalRoadmapId
      name
      color
      createdAt
    }
  }
}
''';

const _personalRoadmapWithProgressQuery = r'''
query MobilePersonalRoadmapWithProgress($personalRoadmapId: UUID!) {
  personalRoadmapWithProgress(personalRoadmapId: $personalRoadmapId) {
    id
    profileId
    careerRoadmapId
    careerRoadmapName
    careerRoadmapDescription
    note
    progressPercentage
    isActive
    isShared
    sharedAt
    ownerName
    createdAt
    tags {
      id
      personalRoadmapId
      name
      color
      createdAt
    }
    nodeProgresses {
      id
      personalRoadmapId
      roadmapNodeId
      nodeId
      status
      note
      createdAt
      node {
        id
        parentNodeId
        name
        description
        order
        technicalSkills {
          id
          name
          category
        }
      }
    }
  }
}
''';

const _learningResourcesByNodeQuery = r'''
query MobileLearningResourcesByNode($nodeId: UUID!) {
  learningResourcesByNode(nodeId: $nodeId) {
    id
    nodeId
    name
    resourceUrl
    resourceType
    provider
    isFree
  }
}
''';

const _recommendedResourcesQuery = r'''
query MobileRecommendedResources($profileId: UUID!, $nodeId: UUID!) {
  recommendedResources(profileId: $profileId, nodeId: $nodeId) {
    id
    nodeId
    name
    resourceUrl
    resourceType
    provider
    isFree
  }
}
''';

const _skillGapAnalysisQuery = r'''
query MobileSkillGapAnalysis($profileId: UUID!) {
  skillGapAnalysis(profileId: $profileId) {
    profileId
    careerRoadmapId
    requiredSkills {
      id
      name
      category
    }
    matchedSkills {
      id
      name
      category
    }
    missingSkills {
      id
      name
      category
    }
    categoryBreakdown {
      category
      yourLevel
      requiredLevel
    }
    coveragePercentage
    summary
  }
}
''';

const _trendingSkillRecommendationsQuery = r'''
query MobileTrendingSkillRecommendations($profileId: UUID!) {
  trendingSkillRecommendations(profileId: $profileId)
}
''';
