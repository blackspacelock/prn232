class ChatSessionDto {
  const ChatSessionDto({
    required this.chatSessionId,
    required this.profileId,
    required this.title,
    required this.createdAt,
    this.messages = const [],
  });

  final String chatSessionId;
  final String profileId;
  final String title;
  final String createdAt;
  final List<ChatMessageDto> messages;

  factory ChatSessionDto.fromJson(Map<String, dynamic> json) {
    final messages = json['messages'];
    return ChatSessionDto(
      chatSessionId: (json['chatSessionId'] ?? json['id']).toString(),
      profileId: (json['profileId'] ?? '').toString(),
      title: (json['title'] ?? 'New Chat').toString(),
      createdAt:
          (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
      messages: messages is List
          ? messages
              .whereType<Map<String, dynamic>>()
              .map(ChatMessageDto.fromJson)
              .toList()
          : const [],
    );
  }

  ChatSessionDto copyWith({
    String? chatSessionId,
    String? profileId,
    String? title,
    String? createdAt,
    List<ChatMessageDto>? messages,
  }) {
    return ChatSessionDto(
      chatSessionId: chatSessionId ?? this.chatSessionId,
      profileId: profileId ?? this.profileId,
      title: title ?? this.title,
      createdAt: createdAt ?? this.createdAt,
      messages: messages ?? this.messages,
    );
  }
}

class ChatMessageDto {
  const ChatMessageDto({
    required this.chatMessageId,
    required this.chatSessionId,
    required this.sender,
    required this.messageContent,
    required this.createdAt,
  });

  final String chatMessageId;
  final String chatSessionId;
  final String sender;
  final String messageContent;
  final String createdAt;

  bool get isAi => sender.toUpperCase() == 'AI';

  factory ChatMessageDto.fromJson(Map<String, dynamic> json) => ChatMessageDto(
        chatMessageId: (json['chatMessageId'] ?? json['id']).toString(),
        chatSessionId: (json['chatSessionId'] ?? '').toString(),
        sender: (json['sender'] ?? '').toString(),
        messageContent:
            (json['messageContent'] ?? json['content'] ?? json['message'] ?? '')
                .toString(),
        createdAt:
            (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
      );
}

class ChatState {
  const ChatState({
    required this.sessions,
    this.activeSession,
    this.isSending = false,
  });

  final List<ChatSessionDto> sessions;
  final ChatSessionDto? activeSession;
  final bool isSending;

  ChatState copyWith({
    List<ChatSessionDto>? sessions,
    ChatSessionDto? activeSession,
    bool? clearActiveSession,
    bool? isSending,
  }) {
    return ChatState(
      sessions: sessions ?? this.sessions,
      activeSession: clearActiveSession == true
          ? null
          : activeSession ?? this.activeSession,
      isSending: isSending ?? this.isSending,
    );
  }
}
