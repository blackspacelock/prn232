import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
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
      appBar: AppBar(
        leading: const AppBackButton(),
        title: const Text('Skill Gap Analysis'),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: AppButton(
          label: 'Next: Choose Roadmap',
          leadingIcon: const Icon(Icons.arrow_forward),
          onPressed: selected == null ? null : _showRoadmapPicker,
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

  Future<void> _showRoadmapPicker() async {
    final selected = ref.read(selectedCareerRoleProvider);
    if (selected == null) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _SkillGapRoadmapSheet(
        careerRoleId: selected.careerRoleId,
        roleName: selected.name,
      ),
    );
  }
}

class _SkillGapRoadmapSheet extends ConsumerStatefulWidget {
  const _SkillGapRoadmapSheet({
    required this.careerRoleId,
    required this.roleName,
  });

  final String careerRoleId;
  final String roleName;

  @override
  ConsumerState<_SkillGapRoadmapSheet> createState() =>
      _SkillGapRoadmapSheetState();
}

class _SkillGapRoadmapSheetState extends ConsumerState<_SkillGapRoadmapSheet> {
  String? _selectedRoadmapId;

  @override
  Widget build(BuildContext context) {
    final roadmaps = ref.watch(roadmapsBySelectedRoleProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: roadmaps.when(
        loading: () => const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SkeletonCard(height: 84),
            SkeletonCard(height: 84),
          ],
        ),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load roadmap templates',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(roadmapsBySelectedRoleProvider),
        ),
        data: (roadmapOptions) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Roadmap for ${widget.roleName}',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Your skills will be compared with this roadmap template.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            if (roadmapOptions.isEmpty)
              const EmptyStateView(
                icon: Icons.route_outlined,
                title: 'No templates yet',
                subtitle: 'Try a different career role.',
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: roadmapOptions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final roadmap = roadmapOptions[index];
                    final selected =
                        _selectedRoadmapId == roadmap.careerRoadmapId;
                    return ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: selected
                              ? AppColors.primary
                              : AppColors.outlineVariant,
                          width: selected ? 2 : 1,
                        ),
                      ),
                      leading: Icon(
                        selected
                            ? Icons.radio_button_checked
                            : Icons.radio_button_unchecked,
                        color: selected
                            ? AppColors.primary
                            : AppColors.onSurfaceVariant,
                      ),
                      title: Text(roadmap.name),
                      subtitle: roadmap.description == null
                          ? null
                          : Text(
                              roadmap.description!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                      onTap: () => setState(
                        () => _selectedRoadmapId = roadmap.careerRoadmapId,
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Review Your Skills',
              leadingIcon: const Icon(Icons.arrow_forward),
              onPressed: _selectedRoadmapId == null
                  ? null
                  : () => context.go(
                        '/skill-gap/input?careerRoadmapId=$_selectedRoadmapId&careerRoleId=${widget.careerRoleId}',
                      ),
            ),
          ],
        ),
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
