import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/graphql_api.dart';
import '../../../core/models/chat_models.dart';
import 'chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl({Dio? dio, GraphQLApi? graphQL})
      : _dio = dio ?? DioClient.instance,
        _graphQL = graphQL ?? GraphQLApi(dio: dio);

  final Dio _dio;
  final GraphQLApi _graphQL;

  @override
  Future<List<ChatSessionDto>> getSessions(String profileId) async {
    if (profileId.isEmpty) return const [];
    final data = await _graphQL.queryField<List<dynamic>>(
      'chatSessionsByProfile',
      r'''
      query GetChatSessionsByProfile($profileId: UUID!) {
        chatSessionsByProfile(profileId: $profileId) {
          id
          profileId
          title
          summary
          createdAt
        }
      }
      ''',
      variables: {'profileId': profileId},
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(ChatSessionDto.fromJson)
        .toList();
  }

  @override
  Future<ChatSessionDto> getSessionWithMessages(String sessionId) async {
    final data = await _graphQL.queryField<Map<String, dynamic>?>(
      'chatSessionWithMessages',
      r'''
      query GetChatSessionWithMessages($sessionId: UUID!) {
        chatSessionWithMessages(sessionId: $sessionId) {
          id
          profileId
          title
          summary
          createdAt
          messages {
            id
            chatSessionId
            sender
            messageContent
            createdAt
          }
        }
      }
      ''',
      variables: {'sessionId': sessionId},
    );
    if (data == null) throw StateError('Chat session not found');
    return ChatSessionDto.fromJson(data);
  }

  @override
  Future<ChatSessionDto> createSession(String profileId, String title) async {
    final response = await _dio.post(
      ApiConstants.chatSessions,
      data: {'profileId': profileId, 'title': title},
    );
    return ChatSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<ChatMessageDto> sendMessage(
    String sessionId,
    String sender,
    String content,
  ) async {
    final response = await _dio.post(
      '${ApiConstants.chatSessions}/$sessionId/messages',
      data: {'sender': sender, 'messageContent': content},
    );
    return ChatMessageDto.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<ChatSessionDto> renameSession(
      String sessionId, String newTitle) async {
    final response = await _dio.put(
      '${ApiConstants.chatSessions}/$sessionId',
      data: {'title': newTitle},
    );
    return ChatSessionDto.fromJson(response.data as Map<String, dynamic>);
  }
}
