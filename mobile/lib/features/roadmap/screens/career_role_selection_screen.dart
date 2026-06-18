import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/career_role_card.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/roadmap_providers.dart';

class CareerRoleSelectionScreen extends ConsumerWidget {
  const CareerRoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(careerRolesProvider);
    final selected = ref.watch(selectedCareerRoleProvider);
    final roadmaps = ref.watch(roadmapsBySelectedRoleProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Career Path')),
      body: roles.when(
        loading: () => const _RoleSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load career roles',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(careerRolesProvider),
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('What role are you aiming for?',
                style: AppTextStyles.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Pick a target role and SECompass will prepare matching roadmap options.',
              style: AppTextStyles.bodyMedium
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.92,
              ),
              itemBuilder: (context, index) {
                final role = items[index];
                return CareerRoleCard(
                  role: role,
                  isSelected: selected?.careerRoleId == role.careerRoleId,
                  onTap: () => ref
                      .read(selectedCareerRoleProvider.notifier)
                      .state = role,
                );
              },
            ),
            const SizedBox(height: 24),
            Text('Roadmap options', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            if (selected == null)
              const EmptyStateView(
                icon: Icons.touch_app_outlined,
                title: 'Select a role',
                subtitle:
                    'Roadmap options appear here after you choose a career role.',
              )
            else
              roadmaps.when(
                loading: () => const SkeletonCard(height: 96),
                error: (error, _) => EmptyStateView(
                  icon: Icons.error_outline,
                  title: 'Could not load roadmaps',
                  subtitle: error.toString(),
                  actionLabel: 'Retry',
                  onAction: () =>
                      ref.invalidate(roadmapsBySelectedRoleProvider),
                ),
                data: (roadmapOptions) => Column(
                  children: roadmapOptions
                      .map(
                        (roadmap) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _RoadmapOptionTile(
                            title: roadmap.name,
                            subtitle: roadmap.description ?? '',
                            onTap: () => context.go(
                              '/career-roles/loading?careerRoadmapId=${roadmap.careerRoadmapId}&profileId=',
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RoadmapOptionTile extends StatelessWidget {
  const _RoadmapOptionTile({
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          const Icon(Icons.route_outlined, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.titleSmall),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          AppButton(label: 'Generate', onPressed: onTap, width: 116),
        ],
      ),
    );
  }
}

class _RoleSkeleton extends StatelessWidget {
  const _RoleSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SkeletonCard(height: 180),
        SkeletonCard(height: 180),
        SkeletonCard(height: 96),
      ],
    );
  }
}
