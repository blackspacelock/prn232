class AuthResponseDto {
  final String accessToken;
  final String refreshToken;
  final UserDto user;

  const AuthResponseDto({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) =>
      AuthResponseDto(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: UserDto.fromJson(json['user'] as Map<String, dynamic>),
      );
}

class UserDto {
  final String id;
  final String email;
  final String? fullName;
  final int role;
  final bool hasProfile;

  const UserDto({
    required this.id,
    required this.email,
    this.fullName,
    required this.role,
    required this.hasProfile,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) => UserDto(
        id: json['id'] as String,
        email: json['email'] as String,
        fullName: json['fullName'] as String?,
        role: json['role'] as int? ?? 0,
        hasProfile: json['hasProfile'] as bool? ?? false,
      );
}
