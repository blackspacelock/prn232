import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class RoleSelectionLoadingScreen extends StatelessWidget {
  const RoleSelectionLoadingScreen({
    super.key,
    required this.careerRoadmapId,
    required this.profileId,
  });

  final String careerRoadmapId;
  final String profileId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 24),
            Text('Building your roadmap…', style: AppTextStyles.titleMedium),
            const SizedBox(height: 8),
            Text(
              'This may take a moment',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
