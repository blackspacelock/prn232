class UpdateProfileDto {
  const UpdateProfileDto({
    this.bioDescription,
    this.phoneNumber,
    this.university,
    this.major,
    this.studiedYear,
  });

  final String? bioDescription;
  final String? phoneNumber;
  final String? university;
  final String? major;
  final int? studiedYear;

  Map<String, dynamic> toJson() => {
        'bioDescription': bioDescription,
        'phoneNumber': phoneNumber,
        'university': university,
        'major': major,
        'studiedYear': studiedYear,
      }..removeWhere((_, value) => value == null);
}

class ProfileDto {
  const ProfileDto({
    required this.profileId,
    required this.userId,
    this.bioDescription,
    this.phoneNumber,
    this.university,
    this.major,
    this.studiedYear,
  });

  final String profileId;
  final String userId;
  final String? bioDescription;
  final String? phoneNumber;
  final String? university;
  final String? major;
  final int? studiedYear;

  factory ProfileDto.fromJson(Map<String, dynamic> json) => ProfileDto(
        profileId: (json['profileId'] ?? json['id'] ?? '').toString(),
        userId: (json['userId'] ?? '').toString(),
        bioDescription: json['bioDescription'] as String?,
        phoneNumber: json['phoneNumber'] as String?,
        university: json['university'] as String?,
        major: json['major'] as String?,
        studiedYear: json['studiedYear'] as int?,
      );
}

class SkillDto {
  const SkillDto({
    required this.skillId,
    required this.profileId,
    required this.skillName,
    this.note,
  });

  final String skillId;
  final String profileId;
  final String skillName;
  final String? note;

  factory SkillDto.fromJson(Map<String, dynamic> json) => SkillDto(
        skillId: (json['skillId'] ?? json['id'] ?? '').toString(),
        profileId: (json['profileId'] ?? '').toString(),
        skillName: (json['skillName'] ?? json['name'] ?? '').toString(),
        note: json['note'] as String?,
      );
}

class TechnicalSkillDto {
  const TechnicalSkillDto({
    required this.technicalSkillId,
    required this.skillName,
    required this.category,
  });

  final String technicalSkillId;
  final String skillName;
  final String category;

  factory TechnicalSkillDto.fromJson(Map<String, dynamic> json) =>
      TechnicalSkillDto(
        technicalSkillId:
            (json['technicalSkillId'] ?? json['id'] ?? '').toString(),
        skillName: (json['skillName'] ?? json['name'] ?? '').toString(),
        category: (json['category'] ?? 'General').toString(),
      );
}
