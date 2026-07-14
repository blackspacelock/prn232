class JobTrendDto {
  const JobTrendDto({
    required this.jobTrendId,
    required this.techSkill,
    required this.trendScore,
    required this.snapshotDate,
    this.description,
    this.source,
    this.region,
  });

  final String jobTrendId;
  final String techSkill;
  final String? description;
  final String? source;
  final String? region;
  final double trendScore;
  final String snapshotDate;

  factory JobTrendDto.fromJson(Map<String, dynamic> json) => JobTrendDto(
        jobTrendId: (json['jobTrendId'] ?? json['id'] ?? '').toString(),
        techSkill:
            (json['techSkill'] ?? json['skillName'] ?? json['name'] ?? '')
                .toString(),
        description: json['description'] as String?,
        source: json['source'] as String?,
        region: json['region'] as String?,
        trendScore: (json['trendScore'] as num?)?.toDouble() ?? 0,
        snapshotDate: (json['snapshotDate'] ?? DateTime.now().toIso8601String())
            .toString(),
      );
}
