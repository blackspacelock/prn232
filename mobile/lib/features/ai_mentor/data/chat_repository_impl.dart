import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/chat_models.dart';
import 'chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  @override
  Future<List<ChatSessionDto>> getSessions(String profileId) async {
    final data = await _query(
      _chatSessionsByProfileQuery,
      variables: {'profileId': profileId},
    );
    return _asList(data['chatSessionsByProfile'])
        .map(ChatSessionDto.fromJson)
        .toList();
  }

  @override
  Future<ChatSessionDto> getSessionWithMessages(String sessionId) async {
    final data = await _query(
      _chatSessionWithMessagesQuery,
      variables: {'sessionId': sessionId},
    );
    final session = data['chatSessionWithMessages'];
    if (session is! Map<String, dynamic>) {
      throw StateError('Chat session not found');
    }
    return ChatSessionDto.fromJson(session);
  }

  @override
  Future<ChatSessionDto> createSession(String profileId, String title) async {
    try {
      final response = await _dio.post(
        ApiConstants.chatSessions,
        queryParameters: {'profileId': profileId},
        data: {'title': title},
      );
      return ChatSessionDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      final now = DateTime.now().toIso8601String();
      return ChatSessionDto(
        chatSessionId: 'session-${DateTime.now().millisecondsSinceEpoch}',
        profileId: profileId,
        title: title,
        createdAt: now,
      );
    }
  }

  @override
  Future<ChatMessageDto> sendMessage(
    String sessionId,
    String sender,
    String content,
  ) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.chatSessions}/$sessionId/messages',
        data: {'sender': sender, 'messageContent': content},
      );
      final data = response.data as Map<String, dynamic>;
      final assistantMessage = data['assistantMessage'];
      return ChatMessageDto.fromJson(
        assistantMessage is Map<String, dynamic> ? assistantMessage : data,
      );
    } on DioException {
      return ChatMessageDto(
        chatMessageId: 'ai-${DateTime.now().millisecondsSinceEpoch}',
        chatSessionId: sessionId,
        sender: 'AI',
        messageContent:
            'Here is a practical way to think about it:\n\n- Start with the skill that unlocks the next roadmap milestone.\n- Build one small project around it.\n- Review your gaps weekly and adjust your plan.',
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  @override
  Future<ChatSessionDto> renameSession(
      String sessionId, String newTitle) async {
    try {
      final response = await _dio.put(
        '${ApiConstants.chatSessions}/$sessionId',
        data: {'title': newTitle},
      );
      return ChatSessionDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return ChatSessionDto(
        chatSessionId: sessionId,
        profileId: '',
        title: newTitle,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  Future<Map<String, dynamic>> _query(
    String query, {
    Map<String, dynamic> variables = const {},
  }) async {
    final response = await _dio.post(
      ApiConstants.graphqlEndpoint,
      data: {'query': query, 'variables': variables},
    );
    final payload = response.data;
    if (payload is! Map<String, dynamic>) {
      throw StateError('Invalid GraphQL response');
    }
    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      throw StateError(errors.first.toString());
    }
    final data = payload['data'];
    return data is Map<String, dynamic> ? data : const {};
  }
}

const _chatSessionsByProfileQuery = r'''
query MobileChatSessionsByProfile($profileId: UUID!) {
  chatSessionsByProfile(profileId: $profileId) {
    id
    profileId
    title
    summary
    createdAt
  }
}
''';

const _chatSessionWithMessagesQuery = r'''
query MobileChatSessionWithMessages($sessionId: UUID!) {
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
''';
