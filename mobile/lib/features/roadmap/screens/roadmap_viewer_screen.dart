import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class RoadmapViewerScreen extends StatelessWidget {
  const RoadmapViewerScreen({super.key, required this.personalRoadmapId});

  final String personalRoadmapId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Roadmap')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.route_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Roadmap Viewer', style: AppTextStyles.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Sprint 2 — Coming soon',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
