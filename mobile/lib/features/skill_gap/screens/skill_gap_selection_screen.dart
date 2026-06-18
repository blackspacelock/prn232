import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class SkillGapSelectionScreen extends StatelessWidget {
  const SkillGapSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Skill Gap Analysis')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.analytics_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Skill Gap Selection', style: AppTextStyles.titleLarge),
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
