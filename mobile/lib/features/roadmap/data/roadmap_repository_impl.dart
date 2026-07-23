import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/graphql_api.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/roadmap_models.dart';
import 'roadmap_repository.dart';

class RoadmapRepositoryImpl implements RoadmapRepository {
  RoadmapRepositoryImpl({Dio? dio, GraphQLApi? graphQL})
      : _dio = dio ?? DioClient.instance,
        _graphQL = graphQL ?? GraphQLApi(dio: dio);

  final Dio _dio;
  final GraphQLApi _graphQL;

  @override
  Future<List<CareerRoleDto>> getCareerRoles() async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'careerRoles',
      r'''
      query GetCareerRoles {
        careerRoles {
          id
          name
          description
        }
      }
      ''',
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(CareerRoleDto.fromJson)
        .toList();
  }

  @override
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'careerRoadmapsByRole',
      r'''
      query GetCareerRoadmapsByRole($careerRoleId: UUID!) {
        careerRoadmapsByRole(careerRoleId: $careerRoleId) {
          id
          careerRoleId
          name
          description
        }
      }
      ''',
      variables: {'careerRoleId': careerRoleId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(CareerRoadmapDto.fromJson)
        .toList();
  }

  @override
  Future<List<RoadmapNodeEdgeDto>> getRoadmapNodeEdges(
    String careerRoadmapId,
  ) async {
    if (careerRoadmapId.isEmpty) return const [];
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'careerRoadmapWithNodes',
      r'''
      query GetCareerRoadmapEdges($roadmapId: UUID!) {
        careerRoadmapWithNodes(roadmapId: $roadmapId) {
          edges {
            id
            careerRoadmapId
            fromRoadmapNodeId
            toRoadmapNodeId
            edgeType
          }
        }
      }
      ''',
      variables: {'roadmapId': careerRoadmapId},
    );
    final edges = data?['edges'];
    if (edges is! List) return const [];
    return edges
        .whereType<Map<String, dynamic>>()
        .map(RoadmapNodeEdgeDto.fromJson)
        .toList();
  }

  @override
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId) async {
    if (profileId.isEmpty) return const [];
    final data = await _graphQL.queryField<List<dynamic>>(
      'personalRoadmapsByProfile',
      r'''
      query GetPersonalRoadmapsByProfile($profileId: UUID!) {
        personalRoadmapsByProfile(profileId: $profileId) {
          id
          profileId
          careerRoadmapId
          careerRoadmapName
          careerRoadmapDescription
          note
          progressPercentage
          isActive
          createdAt
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(_personalRoadmapFromGraphQL)
        .toList();
  }

  @override
  Future<PersonalRoadmapDto> getPersonalRoadmapWithProgress(String id) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'personalRoadmapWithProgress',
      r'''
      query GetPersonalRoadmapWithProgress($personalRoadmapId: UUID!) {
        personalRoadmapWithProgress(personalRoadmapId: $personalRoadmapId) {
          id
          profileId
          careerRoadmapId
          careerRoadmapName
          careerRoadmapDescription
          note
          progressPercentage
          isActive
          createdAt
          nodeProgresses {
            id
            personalRoadmapId
            roadmapNodeId
            nodeId
            status
            note
            createdAt
            roadmapNode {
              id
              careerRoadmapId
              nodeId
              parentRoadmapNodeId
              order
              nodeType
              requirementType
              positionX
              positionY
            }
            node {
              id
              parentNodeId
              name
              description
              order
            }
          }
        }
      }
      ''',
      variables: {'personalRoadmapId': id},
    );
    if (data == null) {
      throw StateError('Personal roadmap not found');
    }
    return _personalRoadmapFromGraphQL(data);
  }

  @override
  Future<PersonalRoadmapDto> generateRoadmap(
    String profileId,
    String careerRoadmapId,
  ) async {
    if (profileId.isEmpty || careerRoadmapId.isEmpty) {
      throw const ValidationException(
        'Profile ID and Career Roadmap ID are required.',
      );
    }
    final response = await _dio.post(
      '${ApiConstants.personalRoadmaps}/generate',
      data: {
        'profileId': profileId,
        'careerRoadmapId': careerRoadmapId,
      },
    );
    return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<PersonalRoadmapDto> createCustomRoadmap(
    CustomPersonalRoadmapRequest request,
  ) async {
    if (request.profileId.isEmpty || request.careerRoleId.isEmpty) {
      throw const ValidationException(
        'Profile ID and Career Role ID are required.',
      );
    }
    final response = await _dio.post(
      '${ApiConstants.personalRoadmaps}/custom',
      data: request.toJson(),
    );
    return PersonalRoadmapDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> toggleActiveRoadmap(String personalRoadmapId) async {
    await _dio.put(
      '${ApiConstants.personalRoadmaps}/$personalRoadmapId/toggle-active',
    );
  }

  @override
  Future<void> deleteRoadmap(String personalRoadmapId) async {
    await _dio.delete('${ApiConstants.personalRoadmaps}/$personalRoadmapId');
  }

  @override
  Future<void> updateNodeStatus(
    String nodeProgressId,
    int status, {
    String? note,
  }) async {
    await _dio.put(
      '${ApiConstants.nodeProgress}/$nodeProgressId/status',
      data: {'status': status, if (note != null) 'note': note},
    );
  }

  @override
  Future<List<LearningResourceDto>> getResourcesByNode(String nodeId) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'learningResourcesByNode',
      r'''
      query GetLearningResourcesByNode($nodeId: UUID!) {
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
      ''',
      variables: {'nodeId': nodeId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(LearningResourceDto.fromJson)
        .toList();
  }

  @override
  Future<List<LearningResourceDto>> getRecommendedResources(
    String profileId,
    String nodeId,
  ) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'recommendedResources',
      r'''
      query GetRecommendedResources($profileId: UUID!, $nodeId: UUID!) {
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
      ''',
      variables: {'profileId': profileId, 'nodeId': nodeId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(LearningResourceDto.fromJson)
        .toList();
  }

  @override
  Future<SkillGapAnalysisDto> getSkillGapAnalysis(
    String profileId,
    String careerRoadmapId,
  ) async {
    if (careerRoadmapId.isEmpty) {
      return _getActiveRoadmapSkillGapAnalysis(profileId);
    }

    try {
      return await _getSelectedRoadmapSkillGapAnalysis(
        profileId,
        careerRoadmapId,
      );
    } on ValidationException catch (error) {
      if (!error.message.contains('careerRoadmapId')) rethrow;
      return _getActiveRoadmapSkillGapAnalysis(profileId);
    }
  }

  Future<SkillGapAnalysisDto> _getSelectedRoadmapSkillGapAnalysis(
    String profileId,
    String careerRoadmapId,
  ) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'skillGapAnalysis',
      r'''
      query GetSkillGapAnalysis($profileId: UUID!, $careerRoadmapId: UUID) {
        skillGapAnalysis(profileId: $profileId, careerRoadmapId: $careerRoadmapId) {
          profileId
          careerRoadmapId
          requiredSkills {
            id
            name
            category
          }
          coveragePercentage
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
          summary
        }
      }
      ''',
      variables: {
        'profileId': profileId,
        if (careerRoadmapId.isNotEmpty) 'careerRoadmapId': careerRoadmapId,
      },
    );
    return SkillGapAnalysisDto.fromJson(data ?? const {});
  }

  Future<SkillGapAnalysisDto> _getActiveRoadmapSkillGapAnalysis(
    String profileId,
  ) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'skillGapAnalysis',
      r'''
      query GetSkillGapAnalysis($profileId: UUID!) {
        skillGapAnalysis(profileId: $profileId) {
          profileId
          careerRoadmapId
          requiredSkills {
            id
            name
            category
          }
          coveragePercentage
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
          summary
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return SkillGapAnalysisDto.fromJson(data ?? const {});
  }

  @override
  Future<List<String>> getTrendingSkillRecommendations(String profileId) async {
    final data = await _graphQL.queryField<List<dynamic>>(
      'trendingSkillRecommendations',
      r'''
      query GetTrendingSkillRecommendations($profileId: UUID!) {
        trendingSkillRecommendations(profileId: $profileId)
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data.map((item) => item.toString()).toList();
  }

  PersonalRoadmapDto _personalRoadmapFromGraphQL(Map<String, dynamic> json) {
    final normalized = Map<String, dynamic>.from(json);
    if (normalized['careerRoadmap'] == null &&
        (normalized['careerRoadmapName'] != null ||
            normalized['careerRoadmapDescription'] != null)) {
      normalized['careerRoadmap'] = {
        'id': normalized['careerRoadmapId'],
        'name': normalized['careerRoadmapName'],
        'description': normalized['careerRoadmapDescription'],
      };
    }
    return PersonalRoadmapDto.fromJson(normalized);
  }
}
