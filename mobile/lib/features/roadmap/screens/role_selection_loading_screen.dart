import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
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
    setState(() => _error = null);
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
      if (!mounted) return;
      setState(() => _error = error.toString());
      AppSnackbar.showError(context, 'Roadmap generation failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/career-roles'),
        title: const Text('Generate Roadmap'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_error == null) ...[
                const Icon(
                  Icons.explore_outlined,
                  size: 72,
                  color: AppColors.primary,
                )
                    .animate(onPlay: (controller) => controller.repeat())
                    .rotate(duration: 1800.ms)
                    .then()
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.08, 1.08),
                      duration: 700.ms,
                    )
                    .then()
                    .scale(
                      begin: const Offset(1.08, 1.08),
                      end: const Offset(1, 1),
                      duration: 700.ms,
                    ),
                const SizedBox(height: 24),
                Text(
                  'Building your personalized roadmap...',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.titleMedium.copyWith(
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Analyzing skill requirements and learning milestones',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 24),
                const LinearProgressIndicator(),
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
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AppButton(
                      label: 'Back',
                      variant: AppButtonVariant.outlined,
                      onPressed: () => context.go('/career-roles'),
                      width: 116,
                    ),
                    const SizedBox(width: 12),
                    AppButton(
                      label: 'Try Again',
                      onPressed: _generate,
                      width: 132,
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
