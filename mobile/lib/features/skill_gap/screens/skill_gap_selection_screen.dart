import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/career_role_card.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../roadmap/providers/roadmap_providers.dart';

class SkillGapSelectionScreen extends ConsumerStatefulWidget {
  const SkillGapSelectionScreen({super.key});

  @override
  ConsumerState<SkillGapSelectionScreen> createState() =>
      _SkillGapSelectionScreenState();
}

class _SkillGapSelectionScreenState
    extends ConsumerState<SkillGapSelectionScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim().toLowerCase());
    });
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);
    final selected = ref.watch(selectedCareerRoleProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Skill Gap Analysis')),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: AppButton(
          label: 'Next: Review Your Skills',
          leadingIcon: const Icon(Icons.arrow_forward),
          onPressed: selected == null
              ? null
              : () => context.go(
                    '/skill-gap/input?careerRoleId=${selected.careerRoleId}',
                  ),
        ),
      ),
      body: roles.when(
        loading: () => const _SelectionSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load career roles',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(careerRolesProvider),
        ),
        data: (items) {
          final filtered = _query.isEmpty
              ? items
              : items
                  .where((role) =>
                      role.name.toLowerCase().contains(_query) ||
                      (role.description ?? '').toLowerCase().contains(_query))
                  .toList();
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              Text('1. Choose a Target Role', style: AppTextStyles.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Select the career role to compare your skills against.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              AppTextField(
                controller: _searchController,
                label: 'Search roles',
                prefixIcon: const Icon(Icons.search),
                onChanged: _onSearchChanged,
              ),
              const SizedBox(height: 16),
              if (filtered.isEmpty)
                const EmptyStateView(
                  icon: Icons.search_off,
                  title: 'No matching roles',
                  subtitle: 'Try another role name or skill keyword.',
                )
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.92,
                  ),
                  itemBuilder: (context, index) {
                    final role = filtered[index];
                    return CareerRoleCard(
                      role: role,
                      isSelected: selected?.careerRoleId == role.careerRoleId,
                      onTap: () => ref
                          .read(selectedCareerRoleProvider.notifier)
                          .state = role,
                    );
                  },
                ),
            ],
          );
        },
      ),
    );
  }
}

class _SelectionSkeleton extends StatelessWidget {
  const _SelectionSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 64),
        SkeletonCard(height: 180),
        SkeletonCard(height: 180),
      ],
    );
  }
}
