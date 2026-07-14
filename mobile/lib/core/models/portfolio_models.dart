import 'profile_models.dart';

class GitHubRepositoryDto {
  const GitHubRepositoryDto({
    required this.githubRepoId,
    required this.profileId,
    required this.repositoryName,
    required this.repoUrl,
    this.description,
    required this.isPrivate,
    required this.createdAt,
  });

  final String githubRepoId;
  final String profileId;
  final String repositoryName;
  final String repoUrl;
  final String? description;
  final bool isPrivate;
  final String createdAt;

  factory GitHubRepositoryDto.fromJson(Map<String, dynamic> json) =>
      GitHubRepositoryDto(
        githubRepoId:
            (json['githubRepoId'] ?? json['id'] ?? json['repoId'] ?? '')
                .toString(),
        profileId: (json['profileId'] ?? '').toString(),
        repositoryName:
            (json['repositoryName'] ?? json['name'] ?? json['repoName'] ?? '')
                .toString(),
        repoUrl: (json['repoUrl'] ?? json['url'] ?? json['repositoryUrl'] ?? '')
            .toString(),
        description: json['description'] as String?,
        isPrivate: json['isPrivate'] as bool? ?? false,
        createdAt:
            (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
      );
}

class RepoAnalysisDto {
  const RepoAnalysisDto({
    required this.repositoryName,
    required this.objective,
    required this.techStacks,
  });

  final String repositoryName;
  final String objective;
  final List<String> techStacks;

  factory RepoAnalysisDto.fromJson(Map<String, dynamic> json) =>
      RepoAnalysisDto(
        repositoryName:
            (json['repositoryName'] ?? json['name'] ?? '').toString(),
        objective: (json['objective'] ?? json['description'] ?? '').toString(),
        techStacks:
            (json['techStacks'] as List?)?.map((t) => t.toString()).toList() ??
                const [],
      );
}

class PortfolioAnalysisDto {
  const PortfolioAnalysisDto({
    this.summary,
    required this.strengths,
    required this.recommendations,
    this.repoAnalyses = const [],
  });

  final String? summary;
  final List<String> strengths;
  final List<String> recommendations;
  final List<RepoAnalysisDto> repoAnalyses;

  factory PortfolioAnalysisDto.fromJson(Map<String, dynamic> json) =>
      PortfolioAnalysisDto(
        summary:
            json['summary'] as String? ?? json['overallSummary'] as String?,
        strengths:
            (json['strengths'] as List?)?.map((s) => s.toString()).toList() ??
                const [],
        recommendations: (json['recommendations'] as List?)
                ?.map((r) => r.toString())
                .toList() ??
            const [],
        repoAnalyses: (json['repoAnalyses'] as List? ??
                    json['repositoryAnalyses'] as List?)
                ?.whereType<Map<String, dynamic>>()
                .map(RepoAnalysisDto.fromJson)
                .toList() ??
            const [],
      );
}

class PublicPortfolioDto {
  const PublicPortfolioDto({
    required this.publicPortfolioId,
    required this.profileId,
    this.headline,
    this.publicBio,
    this.location,
    this.websiteUrl,
    this.linkedInUrl,
    this.contactEmail,
    this.isPublic = true,
    this.lastAnalyzedAt,
    this.cachedPortfolioAnalysis,
  });

  final String publicPortfolioId;
  final String profileId;
  final String? headline;
  final String? publicBio;
  final String? location;
  final String? websiteUrl;
  final String? linkedInUrl;
  final String? contactEmail;
  final bool isPublic;
  final String? lastAnalyzedAt;
  final PortfolioAnalysisDto? cachedPortfolioAnalysis;

  factory PublicPortfolioDto.fromJson(Map<String, dynamic> json) =>
      PublicPortfolioDto(
        publicPortfolioId:
            (json['publicPortfolioId'] ?? json['id'] ?? '').toString(),
        profileId: (json['profileId'] ?? '').toString(),
        headline: json['headline'] as String?,
        publicBio: json['publicBio'] as String?,
        location: json['location'] as String?,
        websiteUrl: json['websiteUrl'] as String?,
        linkedInUrl: json['linkedInUrl'] as String?,
        contactEmail: json['contactEmail'] as String?,
        isPublic: json['isPublic'] as bool? ?? true,
        lastAnalyzedAt: json['lastAnalyzedAt']?.toString(),
        cachedPortfolioAnalysis:
            json['cachedPortfolioAnalysis'] is Map<String, dynamic>
                ? PortfolioAnalysisDto.fromJson(
                    json['cachedPortfolioAnalysis'] as Map<String, dynamic>,
                  )
                : null,
      );
}

class PublicPortfolioViewData {
  const PublicPortfolioViewData({
    required this.profile,
    required this.repositories,
    this.publicPortfolio,
  });

  final ProfileWithSkillsDto profile;
  final List<GitHubRepositoryDto> repositories;
  final PublicPortfolioDto? publicPortfolio;

  List<GitHubRepositoryDto> get publicRepositories =>
      repositories.where((repo) => !repo.isPrivate).toList();
}

class CreateRepoDto {
  const CreateRepoDto({
    required this.profileId,
    required this.repositoryName,
    required this.repoUrl,
    this.description,
    this.isPrivate = false,
  });

  final String profileId;
  final String repositoryName;
  final String repoUrl;
  final String? description;
  final bool isPrivate;

  Map<String, dynamic> toJson() => {
        'profileId': profileId,
        'repositoryName': repositoryName,
        'repoUrl': repoUrl,
        if (description != null) 'description': description,
        'isPrivate': isPrivate,
      };
}

class UpdateRepoDto {
  const UpdateRepoDto({
    this.repositoryName,
    this.repoUrl,
    this.description,
    this.isPrivate,
  });

  final String? repositoryName;
  final String? repoUrl;
  final String? description;
  final bool? isPrivate;

  Map<String, dynamic> toJson() => {
        if (repositoryName != null) 'repositoryName': repositoryName,
        if (repoUrl != null) 'repoUrl': repoUrl,
        if (description != null) 'description': description,
        if (isPrivate != null) 'isPrivate': isPrivate,
      };
}

class ProfileWithSkillsDto {
  const ProfileWithSkillsDto({
    required this.profileId,
    required this.userId,
    this.fullName,
    this.avatarUrl,
    this.bioDescription,
    this.phoneNumber,
    this.university,
    this.major,
    this.studiedYear,
    this.skills = const [],
  });

  final String profileId;
  final String userId;
  final String? fullName;
  final String? avatarUrl;
  final String? bioDescription;
  final String? phoneNumber;
  final String? university;
  final String? major;
  final int? studiedYear;
  final List<SkillDto> skills;

  factory ProfileWithSkillsDto.fromJson(Map<String, dynamic> json) {
    final skillsList = json['skills'] ?? json['profileSkills'];
    return ProfileWithSkillsDto(
      profileId:
          (json['profileId'] ?? json['id'] ?? json['userId'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      bioDescription: json['bioDescription'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      university: json['university'] as String?,
      major: json['major'] as String?,
      studiedYear: json['studiedYear'] as int?,
      skills: skillsList is List
          ? skillsList
              .whereType<Map<String, dynamic>>()
              .map(SkillDto.fromJson)
              .toList()
          : const [],
    );
  }
}

class UpdateUserDto {
  const UpdateUserDto({this.fullName, this.avatarUrl});

  final String? fullName;
  final String? avatarUrl;

  Map<String, dynamic> toJson() => {
        if (fullName != null) 'fullName': fullName,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      };
}
