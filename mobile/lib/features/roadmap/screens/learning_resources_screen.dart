import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/roadmap_providers.dart';

class LearningResourcesScreen extends ConsumerStatefulWidget {
  const LearningResourcesScreen({
    super.key,
    required this.personalRoadmapId,
    required this.nodeId,
  });

  final String personalRoadmapId;
  final String nodeId;

  @override
  ConsumerState<LearningResourcesScreen> createState() =>
      _LearningResourcesScreenState();
}

class _LearningResourcesScreenState
    extends ConsumerState<LearningResourcesScreen> {
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final resources = ref.watch(learningResourcesProvider(widget.nodeId));
    final recommended = ref.watch(recommendedResourcesProvider(widget.nodeId));
    final roadmap =
        ref.watch(personalRoadmapDetailProvider(widget.personalRoadmapId));
    final nodeName = _nodeNameFromRoadmap(roadmap.valueOrNull);

    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(),
        title: Text(nodeName),
      ),
      body: resources.when(
        loading: () => const _ResourcesSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load resources',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () =>
              ref.invalidate(learningResourcesProvider(widget.nodeId)),
        ),
        data: (items) {
          final filters = _buildFilters(items);
          final filtered = _filterResources(items, _filter);

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(learningResourcesProvider(widget.nodeId));
              ref.invalidate(recommendedResourcesProvider(widget.nodeId));
              await ref.read(learningResourcesProvider(widget.nodeId).future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                _FilterChips(
                  filters: filters,
                  selected: _filter,
                  onSelected: (value) => setState(() => _filter = value),
                ),
                const SizedBox(height: 16),
                if (items.isEmpty)
                  const EmptyStateView(
                    icon: Icons.menu_book_outlined,
                    title: 'No resources yet',
                    subtitle:
                        'Resources will appear as content is added by admins',
                  )
                else if (filtered.isEmpty)
                  EmptyStateView(
                    icon: Icons.filter_alt_off_outlined,
                    title: 'No matching resources',
                    subtitle: 'Try a different filter.',
                    actionLabel: 'Show All',
                    onAction: () => setState(() => _filter = 'All'),
                  )
                else
                  ...filtered.map(
                    (resource) => ResourceListTile(resource: resource),
                  ),
                recommended.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: SkeletonCard(height: 96),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (recommendedItems) {
                    if (recommendedItems.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return _RecommendedResources(resources: recommendedItems);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<String> _buildFilters(List<LearningResourceDto> resources) {
    final types = resources
        .map((resource) => resource.resourceType)
        .where((type) => type.trim().isNotEmpty)
        .map((type) => type.trim())
        .toSet()
        .toList()
      ..sort();
    return ['All', 'Free', 'Paid', ...types];
  }

  String _nodeNameFromRoadmap(PersonalRoadmapDto? roadmap) {
    if (roadmap == null) return 'Learning Resources';
    for (final progress in roadmap.nodeProgresses) {
      if (progress.nodeId == widget.nodeId) {
        return progress.node?.name ?? 'Learning Resources';
      }
    }
    return 'Learning Resources';
  }

  List<LearningResourceDto> _filterResources(
    List<LearningResourceDto> resources,
    String filter,
  ) {
    return switch (filter) {
      'All' => resources,
      'Free' => resources.where((resource) => resource.isFree).toList(),
      'Paid' => resources.where((resource) => !resource.isFree).toList(),
      _ => resources
          .where(
            (resource) =>
                resource.resourceType.toLowerCase() == filter.toLowerCase(),
          )
          .toList(),
    };
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({
    required this.filters,
    required this.selected,
    required this.onSelected,
  });

  final List<String> filters;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters
            .map(
              (filter) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(filter),
                  selected: selected == filter,
                  onSelected: (_) => onSelected(filter),
                  selectedColor: AppColors.primaryContainer,
                  checkmarkColor: AppColors.onPrimaryContainer,
                  labelStyle: AppTextStyles.labelMedium.copyWith(
                    color: selected == filter
                        ? AppColors.onPrimaryContainer
                        : AppColors.onSurfaceVariant,
                  ),
                  side: BorderSide(
                    color: selected == filter
                        ? AppColors.primaryContainer
                        : AppColors.outlineVariant,
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class ResourceListTile extends StatelessWidget {
  const ResourceListTile({super.key, required this.resource});

  final LearningResourceDto resource;

  Future<void> _open(BuildContext context) async {
    final uri = Uri.tryParse(resource.resourceUrl);
    if (uri == null ||
        !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (context.mounted) {
        AppSnackbar.showError(context, 'Could not open resource');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.outlineVariant),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(resource.resourceName, style: AppTextStyles.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _Badge(
                        label: resource.provider,
                        background: AppColors.surfaceContainer,
                        foreground: AppColors.onSurfaceVariant,
                      ),
                      _Badge(
                        label: resource.resourceType,
                        background: AppColors.nodeStatusInProgressFill,
                        foreground: AppColors.nodeStatusInProgressText,
                        monospace: true,
                      ),
                      _Badge(
                        label: resource.isFree ? 'Free' : 'Paid',
                        background: resource.isFree
                            ? AppColors.successContainer
                            : AppColors.warningContainer,
                        foreground: resource.isFree
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            AppButton(
              label: 'Open',
              variant: AppButtonVariant.tonal,
              width: 96,
              onPressed: () => _open(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecommendedResources extends StatelessWidget {
  const _RecommendedResources({required this.resources});

  final List<LearningResourceDto> resources;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recommended Resources', style: AppTextStyles.titleMedium),
          const SizedBox(height: 6),
          Text(
            'Picked for your current profile and this milestone.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          ...resources.map(
            (resource) => ResourceListTile(resource: resource),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.background,
    required this.foreground,
    this.monospace = false,
  });

  final String label;
  final Color background;
  final Color foreground;
  final bool monospace;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          color: foreground,
          fontFamily: monospace ? 'monospace' : null,
        ),
      ),
    );
  }
}

class _ResourcesSkeleton extends StatelessWidget {
  const _ResourcesSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 44),
        SkeletonCard(height: 96),
        SkeletonCard(height: 96),
        SkeletonCard(height: 96),
      ],
    );
  }
}
