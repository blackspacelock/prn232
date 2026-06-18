import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class LearningResourcesScreen extends StatelessWidget {
  const LearningResourcesScreen({super.key, required this.nodeId});

  final String nodeId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Learning Resources')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.library_books_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Learning Resources', style: AppTextStyles.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Sprint 3 — Coming soon',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
