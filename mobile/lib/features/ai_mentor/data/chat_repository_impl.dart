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
    try {
      final response = await _dio.get(
        ApiConstants.chatSessions,
        queryParameters: {'profileId': profileId},
      );
      final data = _asList(response.data);
      return data.map(ChatSessionDto.fromJson).toList();
    } on DioException {
      return _mockSessions(profileId);
    }
  }

  @override
  Future<ChatSessionDto> getSessionWithMessages(String sessionId) async {
    try {
      final response =
          await _dio.get('${ApiConstants.chatSessions}/$sessionId');
      return ChatSessionDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return _mockSessionDetail(sessionId);
    }
  }

  @override
  Future<ChatSessionDto> createSession(String profileId, String title) async {
    try {
      final response = await _dio.post(
        ApiConstants.chatSessions,
        data: {'profileId': profileId, 'title': title},
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
      return ChatMessageDto.fromJson(response.data as Map<String, dynamic>);
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
      return _mockSessionDetail(sessionId).copyWith(title: newTitle);
    }
  }

  List<Map<String, dynamic>> _asList(Object? data) {
    final value = data is Map<String, dynamic> && data['data'] is List
        ? data['data']
        : data;
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  List<ChatSessionDto> _mockSessions(String profileId) => [
        ChatSessionDto(
          chatSessionId: 'mentor-roadmap',
          profileId: profileId,
          title: 'Roadmap planning',
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];

  ChatSessionDto _mockSessionDetail(String sessionId) => ChatSessionDto(
        chatSessionId: sessionId,
        profileId: 'demo-profile',
        title: 'Roadmap planning',
        createdAt: DateTime.now().toIso8601String(),
        messages: [
          ChatMessageDto(
            chatMessageId: '$sessionId-1',
            chatSessionId: sessionId,
            sender: 'AI',
            messageContent:
                'Hi, I am your SECompass mentor. Tell me what career goal you are aiming for and where you feel stuck.',
            createdAt: DateTime.now().toIso8601String(),
          ),
        ],
      );
}
