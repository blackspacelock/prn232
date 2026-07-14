class AuthResponseDto {
  final String accessToken;
  final String refreshToken;
  final UserDto user;

  const AuthResponseDto({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) {
    // Handle both nested { user: {...} } and flat { userId, email, ... } responses
    final userMap = json['user'] is Map<String, dynamic>
        ? json['user'] as Map<String, dynamic>
        : json;
    return AuthResponseDto(
      accessToken: (json['accessToken'] ?? '').toString(),
      refreshToken: (json['refreshToken'] ?? '').toString(),
      user: UserDto.fromJson(userMap),
    );
  }
}

class UserDto {
  final String id;
  final String email;
  final String? fullName;
  final int role;
  final bool hasProfile;
  final String? avatarUrl;
  final String? profileId;

  const UserDto({
    required this.id,
    required this.email,
    this.fullName,
    required this.role,
    required this.hasProfile,
    this.avatarUrl,
    this.profileId,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) => UserDto(
        id: (json['id'] ?? json['userId'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        fullName: json['fullName'] as String?,
        role: json['role'] as int? ?? 0,
        hasProfile: json['hasProfile'] as bool? ?? false,
        avatarUrl: json['avatarUrl'] as String?,
        profileId: json['profileId'] as String?,
      );

  UserDto copyWith({
    String? id,
    String? email,
    String? fullName,
    int? role,
    bool? hasProfile,
    String? avatarUrl,
    String? profileId,
  }) {
    return UserDto(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      role: role ?? this.role,
      hasProfile: hasProfile ?? this.hasProfile,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      profileId: profileId ?? this.profileId,
    );
  }
}
