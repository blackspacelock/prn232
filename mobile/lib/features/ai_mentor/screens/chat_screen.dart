import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key, this.sessionId});

  final String? sessionId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Mentor')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.smart_toy_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('AI Mentor Chat', style: AppTextStyles.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Sprint 4 — Coming soon',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
