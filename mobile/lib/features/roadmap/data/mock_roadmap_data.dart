import '../../../core/models/roadmap_models.dart';

const mockCareerRoles = [
  CareerRoleDto(
    careerRoleId: 'frontend',
    name: 'Frontend Engineer',
    description:
        'Build accessible, polished product interfaces with modern web stacks.',
    iconName: 'mobile',
  ),
  CareerRoleDto(
    careerRoleId: 'backend',
    name: 'Backend Engineer',
    description:
        'Design APIs, services, databases, and scalable server-side systems.',
    iconName: 'cloud',
  ),
  CareerRoleDto(
    careerRoleId: 'data',
    name: 'Data Engineer',
    description:
        'Create reliable data pipelines, warehouses, and analytics foundations.',
    iconName: 'data',
  ),
  CareerRoleDto(
    careerRoleId: 'ai',
    name: 'AI Engineer',
    description:
        'Ship ML-powered features with practical model and product judgment.',
    iconName: 'ai',
  ),
];

List<CareerRoadmapDto> mockRoadmapsForRole(String roleId) {
  final role = mockCareerRoles.firstWhere(
    (role) => role.careerRoleId == roleId,
    orElse: () => mockCareerRoles.first,
  );
  return [
    CareerRoadmapDto(
      careerRoadmapId: '${role.careerRoleId}-starter',
      name: '${role.name} Starter Roadmap',
      description:
          'A practical first path from fundamentals to portfolio-ready work.',
      careerRole: role,
    ),
    CareerRoadmapDto(
      careerRoadmapId: '${role.careerRoleId}-interview',
      name: '${role.name} Interview Prep',
      description:
          'Focused milestones for job-readiness and interview confidence.',
      careerRole: role,
    ),
  ];
}

PersonalRoadmapDto mockPersonalRoadmap({
  String id = 'demo-roadmap',
  String profileId = 'demo-profile',
  String careerRoadmapId = 'frontend-starter',
}) {
  final careerRoadmap = mockRoadmapsForRole('frontend').first;
  return PersonalRoadmapDto(
    personalRoadmapId: id,
    profileId: profileId,
    careerRoadmapId: careerRoadmapId,
    progressPercentage: 32,
    isActive: true,
    createdAt: DateTime.now().toIso8601String(),
    careerRoadmap: careerRoadmap,
    nodeProgresses: [
      NodeProgressDto(
        nodeProgressId: '$id-1',
        personalRoadmapId: id,
        nodeId: 'html-css',
        status: 4,
        node: const NodeDto(
          nodeId: 'html-css',
          name: 'HTML, CSS, and responsive layouts',
          order: 1,
          description:
              'Practice semantic structure, responsive grids, and component styling.',
        ),
      ),
      NodeProgressDto(
        nodeProgressId: '$id-2',
        personalRoadmapId: id,
        nodeId: 'dart-flutter',
        status: 1,
        node: const NodeDto(
          nodeId: 'dart-flutter',
          name: 'Flutter UI fundamentals',
          order: 2,
          description:
              'Master widgets, state, routing, forms, and Material 3 patterns.',
        ),
      ),
      NodeProgressDto(
        nodeProgressId: '$id-3',
        personalRoadmapId: id,
        nodeId: 'api-integration',
        status: 0,
        node: const NodeDto(
          nodeId: 'api-integration',
          name: 'API integration and error states',
          order: 3,
          description:
              'Connect screens to REST/GraphQL data with loading and retry UX.',
        ),
      ),
      NodeProgressDto(
        nodeProgressId: '$id-4',
        personalRoadmapId: id,
        nodeId: 'portfolio',
        status: 0,
        node: const NodeDto(
          nodeId: 'portfolio',
          name: 'Portfolio project polish',
          order: 4,
          description:
              'Ship a focused project with documentation, screenshots, and tests.',
        ),
      ),
    ],
  );
}

List<LearningResourceDto> mockLearningResources(String nodeId) => [
      LearningResourceDto(
        learningResourceId: '$nodeId-docs',
        nodeId: nodeId,
        resourceName: 'Official documentation guide',
        resourceUrl: 'https://docs.flutter.dev/',
        resourceType: 'Article',
        provider: 'Flutter Docs',
        isFree: true,
      ),
      LearningResourceDto(
        learningResourceId: '$nodeId-video',
        nodeId: nodeId,
        resourceName: 'Practical crash course',
        resourceUrl: 'https://www.youtube.com/',
        resourceType: 'Video',
        provider: 'YouTube',
        isFree: true,
      ),
      LearningResourceDto(
        learningResourceId: '$nodeId-course',
        nodeId: nodeId,
        resourceName: 'Project-based learning path',
        resourceUrl: 'https://www.udemy.com/',
        resourceType: 'Course',
        provider: 'Udemy',
        isFree: false,
      ),
    ];

List<LearningResourceDto> mockRecommendedResources(String nodeId) => [
      LearningResourceDto(
        learningResourceId: '$nodeId-recommended',
        nodeId: nodeId,
        resourceName: 'Recommended hands-on project',
        resourceUrl: 'https://github.com/',
        resourceType: 'Project',
        provider: 'GitHub',
        isFree: true,
      ),
    ];
