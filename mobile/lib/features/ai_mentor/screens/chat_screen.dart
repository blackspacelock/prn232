import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/chat_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/mentor_chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, this.sessionId});

  final String? sessionId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send(String content) async {
    if (content.trim().isEmpty) return;
    _messageController.clear();
    try {
      await ref
          .read(mentorChatProvider(widget.sessionId).notifier)
          .sendMessage(content);
      _scrollToBottom();
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = ref.watch(mentorChatProvider(widget.sessionId));
    final state = chat.valueOrNull;
    final active = state?.activeSession;

    return Scaffold(
      appBar: AppBar(
        leading: widget.sessionId == null
            ? null
            : const AppBackButton(fallbackLocation: '/mentor'),
        title: Text(active?.title ?? 'AI Mentor'),
        actions: [
          IconButton(
            tooltip: 'Sessions',
            icon: const Icon(Icons.menu),
            onPressed: state == null ? null : () => _showSessionsSheet(state),
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: state == null
                ? null
                : () async {
                    await ref
                        .read(mentorChatProvider(widget.sessionId).notifier)
                        .createSession();
                    final created = ref
                        .read(mentorChatProvider(widget.sessionId))
                        .valueOrNull;
                    final id = created?.activeSession?.chatSessionId;
                    if (!mounted || id == null) return;
                    GoRouter.of(this.context).go('/mentor/$id');
                  },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'rename' && active != null) {
                _showRenameDialog(active);
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'rename', child: Text('Rename')),
            ],
          ),
        ],
      ),
      body: chat.when(
        loading: () => const _ChatSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load mentor chat',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(mentorChatProvider(widget.sessionId)),
        ),
        data: (data) {
          final messages = data.activeSession?.messages ?? const [];
          _scrollToBottom();
          return Column(
            children: [
              Expanded(
                child: data.activeSession == null
                    ? EmptyStateView(
                        icon: Icons.smart_toy_outlined,
                        title: 'Start a mentor session',
                        subtitle:
                            'Create or select a chat to get guidance on your roadmap.',
                        actionLabel: 'New Chat',
                        onAction: () => ref
                            .read(mentorChatProvider(widget.sessionId).notifier)
                            .createSession(),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                        itemCount: messages.length + (data.isSending ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == messages.length) {
                            return const _TypingBubble();
                          }
                          return _ChatBubble(message: messages[index]);
                        },
                      ),
              ),
              if (data.activeSession != null && messages.isEmpty)
                _SuggestedQuestions(onSend: _send),
              _InputBar(
                controller: _messageController,
                enabled: data.activeSession != null && !data.isSending,
                isSending: data.isSending,
                onSend: _send,
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _showSessionsSheet(ChatState state) {
    final rootContext = context;
    return showModalBottomSheet<void>(
      context: rootContext,
      showDragHandle: true,
      builder: (sheetContext) => _SessionsSheet(
        state: state,
        onNewChat: () async {
          Navigator.of(sheetContext).pop();
          await ref
              .read(mentorChatProvider(widget.sessionId).notifier)
              .createSession();
          final id = ref
              .read(mentorChatProvider(widget.sessionId))
              .valueOrNull
              ?.activeSession
              ?.chatSessionId;
          if (!rootContext.mounted || id == null) return;
          rootContext.go('/mentor/$id');
        },
        onSelect: (session) async {
          Navigator.of(sheetContext).pop();
          await ref
              .read(mentorChatProvider(widget.sessionId).notifier)
              .selectSession(session.chatSessionId);
          if (!rootContext.mounted) return;
          rootContext.go('/mentor/${session.chatSessionId}');
        },
        onRename: _showRenameDialog,
      ),
    );
  }

  Future<void> _showRenameDialog(ChatSessionDto session) async {
    final controller = TextEditingController(text: session.title);
    final title = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rename session'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Title'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (title == null || title.isEmpty) return;
    await ref
        .read(mentorChatProvider(widget.sessionId).notifier)
        .renameSession(session.chatSessionId, title);
  }
}

class _SessionsSheet extends StatelessWidget {
  const _SessionsSheet({
    required this.state,
    required this.onNewChat,
    required this.onSelect,
    required this.onRename,
  });

  final ChatState state;
  final VoidCallback onNewChat;
  final ValueChanged<ChatSessionDto> onSelect;
  final ValueChanged<ChatSessionDto> onRename;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        shrinkWrap: true,
        children: [
          AppButton(
            label: 'New Chat',
            leadingIcon: const Icon(Icons.add),
            onPressed: onNewChat,
          ),
          const SizedBox(height: 12),
          ...state.sessions.map(
            (session) {
              final active =
                  state.activeSession?.chatSessionId == session.chatSessionId;
              return ListTile(
                selected: active,
                selectedTileColor: AppColors.nodeStatusInProgressFill,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                title: Text(
                  session.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(_dateLabel(session.createdAt)),
                leading: const Icon(Icons.chat_bubble_outline),
                onTap: () => onSelect(session),
                onLongPress: () => onRename(session),
              );
            },
          ),
        ],
      ),
    );
  }

  String _dateLabel(String value) {
    final date = DateTime.tryParse(value);
    if (date == null) return '';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final sessionDay = DateTime(date.year, date.month, date.day);
    final diff = today.difference(sessionDay).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final ChatMessageDto message;

  @override
  Widget build(BuildContext context) {
    final isAi = message.isAi;
    return Align(
      alignment: isAi ? Alignment.centerLeft : Alignment.centerRight,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          mainAxisAlignment:
              isAi ? MainAxisAlignment.start : MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isAi) ...[
              const CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.primary,
                child: Icon(Icons.smart_toy, size: 16, color: Colors.white),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isAi
                      ? AppColors.surfaceContainerLowest
                      : AppColors.nodeStatusInProgressFill,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isAi ? 4 : 18),
                    bottomRight: Radius.circular(isAi ? 18 : 4),
                  ),
                  boxShadow: isAi
                      ? const [
                          BoxShadow(
                            blurRadius: 6,
                            offset: Offset(0, 2),
                            color: Color(0x1F000000),
                          ),
                        ]
                      : null,
                ),
                child: isAi
                    ? MarkdownBody(
                        data: message.messageContent,
                        styleSheet: MarkdownStyleSheet(
                          p: AppTextStyles.bodyMedium,
                          codeblockDecoration: BoxDecoration(
                            color: const Color(0xFF202124),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          code: const TextStyle(color: Colors.white),
                        ),
                      )
                    : Text(message.messageContent,
                        style: AppTextStyles.bodyMedium),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return const Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.primary,
              child: Icon(Icons.smart_toy, size: 16, color: Colors.white),
            ),
            SizedBox(width: 8),
            DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                borderRadius: BorderRadius.all(Radius.circular(18)),
              ),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Text('Mentor is typing...'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuggestedQuestions extends StatelessWidget {
  const _SuggestedQuestions({required this.onSend});

  final ValueChanged<String> onSend;

  static const questions = [
    'What skills should I learn first?',
    'How do I prepare for frontend interviews?',
    'Review my current roadmap progress',
    'What are the top hiring trends?',
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: questions
            .map(
              (question) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(question),
                  onPressed: () => onSend(question),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _InputBar extends StatefulWidget {
  const _InputBar({
    required this.controller,
    required this.enabled,
    required this.isSending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool enabled;
  final bool isSending;
  final ValueChanged<String> onSend;

  @override
  State<_InputBar> createState() => _InputBarState();
}

class _InputBarState extends State<_InputBar> {
  @override
  Widget build(BuildContext context) {
    final canSend = widget.enabled && widget.controller.text.trim().isNotEmpty;
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: AppTextField(
              controller: widget.controller,
              label: widget.enabled
                  ? 'Ask your mentor...'
                  : 'Create or select a session first',
              minLines: 1,
              maxLines: 3,
              enabled: widget.enabled,
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) {
                if (canSend) widget.onSend(widget.controller.text);
              },
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 48,
            height: 48,
            child: FilledButton(
              onPressed: canSend && !widget.isSending
                  ? () => widget.onSend(widget.controller.text)
                  : null,
              style: FilledButton.styleFrom(
                padding: EdgeInsets.zero,
                shape: const CircleBorder(),
              ),
              child: widget.isSending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatSkeleton extends StatelessWidget {
  const _ChatSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 72),
        SkeletonCard(height: 120),
        SkeletonCard(height: 72),
      ],
    );
  }
}
