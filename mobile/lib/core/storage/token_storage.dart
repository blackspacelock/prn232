import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage._();

  static const _instance = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUserId = 'user_id';
  static const _keyProfileId = 'profile_id';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? userId,
    String? profileId,
  }) async {
    await Future.wait([
      _instance.write(key: _keyAccessToken, value: accessToken),
      _instance.write(key: _keyRefreshToken, value: refreshToken),
      if (userId != null) _instance.write(key: _keyUserId, value: userId),
      if (profileId != null)
        _instance.write(key: _keyProfileId, value: profileId),
    ]);
  }

  static Future<String?> getAccessToken() =>
      _instance.read(key: _keyAccessToken);

  static Future<String?> getRefreshToken() =>
      _instance.read(key: _keyRefreshToken);

  static Future<String?> getUserId() => _instance.read(key: _keyUserId);
  static Future<String?> getProfileId() => _instance.read(key: _keyProfileId);

  static Future<void> clearTokens() async {
    await Future.wait([
      _instance.delete(key: _keyAccessToken),
      _instance.delete(key: _keyRefreshToken),
      _instance.delete(key: _keyUserId),
      _instance.delete(key: _keyProfileId),
    ]);
  }

  static Future<bool> hasValidToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
