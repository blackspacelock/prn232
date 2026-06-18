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
