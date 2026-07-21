import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/api/api_constants.dart';
import '../../../core/models/app_exception.dart';

class GoogleSignInService {
  GoogleSignInService._();

  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: ApiConstants.googleServerClientId,
  );

  static Future<String?> getIdToken() async {
    final account = await _googleSignIn.signIn();
    if (account == null) return null;

    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw const AuthException('Google sign-in did not return an ID token');
    }

    return idToken;
  }
}
