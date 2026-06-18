import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class SkillInputScreen extends StatelessWidget {
  const SkillInputScreen({super.key, required this.careerRoadmapId});

  final String careerRoadmapId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your Skills')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.psychology_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Skill Input', style: AppTextStyles.titleLarge),
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
