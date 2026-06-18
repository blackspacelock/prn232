import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../providers/roadmap_providers.dart';

class RoleSelectionLoadingScreen extends ConsumerStatefulWidget {
  const RoleSelectionLoadingScreen({
    super.key,
    required this.careerRoadmapId,
    required this.profileId,
  });

  final String careerRoadmapId;
  final String profileId;

  @override
  ConsumerState<RoleSelectionLoadingScreen> createState() =>
      _RoleSelectionLoadingScreenState();
}

class _RoleSelectionLoadingScreenState
    extends ConsumerState<RoleSelectionLoadingScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_generate);
  }

  Future<void> _generate() async {
    try {
      final profileId = widget.profileId.isNotEmpty
          ? widget.profileId
          : await ref.read(profileIdProvider.future);
      final roadmap = await ref.read(roadmapRepositoryProvider).generateRoadmap(
            profileId,
            widget.careerRoadmapId,
          );
      ref.invalidate(personalRoadmapsProvider);
      ref.invalidate(dashboardDataProvider);
      if (!mounted) return;
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_error == null) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text('Building your roadmap...',
                    style: AppTextStyles.titleMedium),
                const SizedBox(height: 8),
                Text(
                  'This may take a moment',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ] else ...[
                const Icon(Icons.error_outline,
                    size: 56, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Roadmap generation failed',
                    style: AppTextStyles.titleMedium),
                const SizedBox(height: 8),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                AppButton(label: 'Try Again', onPressed: _generate),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
