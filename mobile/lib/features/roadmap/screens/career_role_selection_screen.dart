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
import '../providers/roadmap_providers.dart';

class CareerRoleSelectionScreen extends ConsumerStatefulWidget {
  const CareerRoleSelectionScreen({super.key});

  @override
  ConsumerState<CareerRoleSelectionScreen> createState() =>
      _CareerRoleSelectionScreenState();
}

class _CareerRoleSelectionScreenState
    extends ConsumerState<CareerRoleSelectionScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  String _query = '';

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim().toLowerCase());
    });
  }

  Future<void> _showTemplatePicker() async {
    final selected = ref.read(selectedCareerRoleProvider);
    if (selected == null) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _RoadmapTemplateSheet(roleName: selected.name),
    );
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);
    final selected = ref.watch(selectedCareerRoleProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Career Path')),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: AppButton(
          label: 'Next',
          onPressed: selected == null ? null : _showTemplatePicker,
          leadingIcon: const Icon(Icons.arrow_forward),
        ),
      ),
      body: roles.when(
        loading: () => const _RoleSkeleton(),
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
                  .where(
                    (role) =>
                        role.name.toLowerCase().contains(_query) ||
                        (role.description ?? '').toLowerCase().contains(_query),
                  )
                  .toList();

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              Text(
                'What role are you aiming for?',
                style: AppTextStyles.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Pick a target role and SECompass will prepare matching roadmap options.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              AppTextField(
                controller: _searchController,
                label: 'Search roles',
                prefixIcon: const Icon(Icons.search),
                textInputAction: TextInputAction.search,
                onChanged: _onSearchChanged,
              ),
              const SizedBox(height: 16),
              if (filtered.isEmpty)
                EmptyStateView(
                  icon: Icons.search_off,
                  title: 'No matching roles',
                  subtitle: 'Try another role name or skill keyword.',
                  actionLabel: 'Clear Search',
                  onAction: () {
                    _searchController.clear();
                    _searchDebounce?.cancel();
                    setState(() => _query = '');
                  },
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

class _RoadmapTemplateSheet extends ConsumerStatefulWidget {
  const _RoadmapTemplateSheet({required this.roleName});

  final String roleName;

  @override
  ConsumerState<_RoadmapTemplateSheet> createState() =>
      _RoadmapTemplateSheetState();
}

class _RoadmapTemplateSheetState extends ConsumerState<_RoadmapTemplateSheet> {
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
              'Select Roadmap Template for ${widget.roleName}',
              style: AppTextStyles.titleMedium,
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
                    return _RoadmapOptionTile(
                      title: roadmap.name,
                      subtitle: roadmap.description ?? '',
                      isSelected: _selectedRoadmapId == roadmap.careerRoadmapId,
                      onTap: () => setState(
                        () => _selectedRoadmapId = roadmap.careerRoadmapId,
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Generate Roadmap',
              onPressed: _selectedRoadmapId == null
                  ? null
                  : () => context.go(
                        '/career-roles/loading?careerRoadmapId=$_selectedRoadmapId&profileId=',
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
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.nodeStatusInProgressFill
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primaryContainer
                : AppColors.outlineVariant,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color:
                  isSelected ? AppColors.primaryContainer : AppColors.outline,
            ),
            const SizedBox(width: 4),
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
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            const _NodeCountBadge(),
          ],
        ),
      ),
    );
  }
}

class _NodeCountBadge extends StatelessWidget {
  const _NodeCountBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        'Template',
        style: AppTextStyles.labelSmall.copyWith(
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _RoleSkeleton extends StatelessWidget {
  const _RoleSkeleton();

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
