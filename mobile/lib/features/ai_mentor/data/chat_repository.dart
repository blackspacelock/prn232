import '../../../core/models/chat_models.dart';

abstract class ChatRepository {
  Future<List<ChatSessionDto>> getSessions(String profileId);
  Future<ChatSessionDto> getSessionWithMessages(String sessionId);
  Future<ChatSessionDto> createSession(String profileId, String title);
  Future<ChatMessageDto> sendMessage(
    String sessionId,
    String sender,
    String content,
  );
  Future<ChatSessionDto> renameSession(String sessionId, String newTitle);
}
