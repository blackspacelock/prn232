sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'Network error. Please try again.']);
}

class AuthException extends AppException {
  const AuthException([super.message = 'Authentication failed.']);
}

class ServerException extends AppException {
  final int? statusCode;
  const ServerException(super.message, {this.statusCode});
}

class ValidationException extends AppException {
  const ValidationException(super.message);
}
