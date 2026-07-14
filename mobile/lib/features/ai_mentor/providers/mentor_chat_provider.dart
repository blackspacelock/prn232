import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/chat_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/chat_repository.dart';
import '../data/chat_repository_impl.dart';

final chatRepositoryProvider = Provider<ChatRepository>(
  (_) => ChatRepositoryImpl(),
);

final mentorChatProvider =
    AsyncNotifierProviderFamily<MentorChatNotifier, ChatState, String?>(
  MentorChatNotifier.new,
);

class MentorChatNotifier extends FamilyAsyncNotifier<ChatState, String?> {
  @override
  Future<ChatState> build(String? arg) async {
    final profileId = await _profileId();
    final sessions =
        await ref.read(chatRepositoryProvider).getSessions(profileId);
    if (arg == null || arg.isEmpty) {
      return ChatState(sessions: sessions);
    }
    final active =
        await ref.read(chatRepositoryProvider).getSessionWithMessages(arg);
    return ChatState(sessions: sessions, activeSession: active);
  }

  Future<void> createSession() async {
    final previous = state.valueOrNull ?? const ChatState(sessions: []);
    state = AsyncData(previous.copyWith(isSending: true));
    final session = await ref
        .read(chatRepositoryProvider)
        .createSession(await _profileId(), 'New Chat');
    state = AsyncData(
      previous.copyWith(
        sessions: [session, ...previous.sessions],
        activeSession: session,
        isSending: false,
      ),
    );
  }

  Future<void> selectSession(String sessionId) async {
    final previous = state.valueOrNull ?? const ChatState(sessions: []);
    state = const AsyncLoading();
    final active = await ref
        .read(chatRepositoryProvider)
        .getSessionWithMessages(sessionId);
    state =
        AsyncData(previous.copyWith(activeSession: active, isSending: false));
  }

  Future<void> renameSession(String sessionId, String title) async {
    final previous = state.valueOrNull;
    if (previous == null) return;
    final renamed =
        await ref.read(chatRepositoryProvider).renameSession(sessionId, title);
    state = AsyncData(
      previous.copyWith(
        sessions: previous.sessions
            .map((session) =>
                session.chatSessionId == sessionId ? renamed : session)
            .toList(),
        activeSession: previous.activeSession?.chatSessionId == sessionId
            ? previous.activeSession!.copyWith(title: renamed.title)
            : previous.activeSession,
      ),
    );
  }

  Future<void> sendMessage(String content) async {
    final current = state.valueOrNull;
    final active = current?.activeSession;
    if (current == null || active == null || content.trim().isEmpty) return;

    final userId = await TokenStorage.getUserId() ?? 'user';
    final now = DateTime.now().toIso8601String();
    final userMessage = ChatMessageDto(
      chatMessageId: 'local-user-${DateTime.now().millisecondsSinceEpoch}',
      chatSessionId: active.chatSessionId,
      sender: userId,
      messageContent: content.trim(),
      createdAt: now,
    );

    final optimistic = active.copyWith(
      messages: [...active.messages, userMessage],
    );
    state = AsyncData(
      current.copyWith(activeSession: optimistic, isSending: true),
    );

    try {
      final aiMessage = await ref.read(chatRepositoryProvider).sendMessage(
            active.chatSessionId,
            userId,
            content.trim(),
          );
      final latest = state.valueOrNull?.activeSession ?? optimistic;
      state = AsyncData(
        (state.valueOrNull ?? current).copyWith(
          activeSession: latest.copyWith(
            messages: [...latest.messages, aiMessage],
          ),
          isSending: false,
        ),
      );
    } catch (_) {
      state = AsyncData(current.copyWith(isSending: false));
      rethrow;
    }
  }

  Future<String> _profileId() async {
    final user = ref.read(authProvider).valueOrNull;
    final authProfileId = user?.profileId;
    if (authProfileId != null && authProfileId.isNotEmpty) {
      return authProfileId;
    }

    final storedProfileId = await TokenStorage.getProfileId();
    if (storedProfileId != null && storedProfileId.isNotEmpty) {
      return storedProfileId;
    }

    return user?.id ?? await TokenStorage.getUserId() ?? '';
  }
}
