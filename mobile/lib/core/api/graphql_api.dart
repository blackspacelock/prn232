import 'package:dio/dio.dart';

import '../models/app_exception.dart';
import 'dio_client.dart';

class GraphQLApi {
  GraphQLApi({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  Future<T> queryField<T>(
    String fieldName,
    String query, {
    Map<String, dynamic>? variables,
  }) async {
    try {
      final response = await _dio.post(
        '/graphql',
        data: {
          'query': query,
          if (variables != null) 'variables': variables,
        },
      );
      final body = response.data;
      if (body is! Map<String, dynamic>) {
        throw const ServerException('Invalid GraphQL response');
      }
      final errors = body['errors'];
      if (errors is List && errors.isNotEmpty) {
        throw ServerException(_firstGraphQLError(errors));
      }
      final data = body['data'];
      if (data is! Map<String, dynamic>) {
        throw const ServerException('Missing GraphQL data');
      }
      return data[fieldName] as T;
    } on DioException catch (e) {
      _throwMapped(e);
    }
  }

  Never _throwMapped(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    var message = e.message ?? 'GraphQL request failed';
    if (data is String && data.isNotEmpty) message = data;
    if (data is Map) {
      final errors = data['errors'];
      if (errors is List && errors.isNotEmpty) {
        message = _firstGraphQLError(errors);
      } else {
        message =
            (data['message'] ?? data['error'] ?? data.toString()).toString();
      }
    }
    if (status == 401) throw AuthException(message);
    if (status != null && status >= 400 && status < 500) {
      throw ValidationException(message);
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      throw const NetworkException();
    }
    throw ServerException(message, statusCode: status);
  }

  String _firstGraphQLError(List errors) {
    final first = errors.first;
    if (first is Map && first['message'] != null) {
      return first['message'].toString();
    }
    return first.toString();
  }
}
