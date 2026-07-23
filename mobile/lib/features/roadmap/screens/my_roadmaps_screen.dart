import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../../core/widgets/status_chip.dart';
import '../providers/roadmap_providers.dart';

class MyRoadmapsScreen extends ConsumerStatefulWidget {
  const MyRoadmapsScreen({super.key});

  @override
  ConsumerState<MyRoadmapsScreen> createState() => _MyRoadmapsScreenState();
}

class _MyRoadmapsScreenState extends ConsumerState<MyRoadmapsScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  _RoadmapSort _sort = _RoadmapSort.createdNewest;
  _RoadmapFilter _filter = _RoadmapFilter.all;
  String? _mutatingId;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final roadmaps = ref.watch(personalRoadmapsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Roadmaps'),
        actions: [
          IconButton(
            tooltip: 'Create roadmap',
            icon: const Icon(Icons.add_road_outlined),
            onPressed: () => context.go('/career-roles'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/career-roles'),
        icon: const Icon(Icons.rocket_launch_outlined),
        label: const Text('Create Roadmap'),
      ),
      body: roadmaps.when(
        loading: () => const _RoadmapListSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Failed to load roadmaps',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(personalRoadmapsProvider),
        ),
        data: (items) {
          final visible = _applyListControls(items);

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(personalRoadmapsProvider);
              ref.invalidate(dashboardDataProvider);
              await ref.read(personalRoadmapsProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              children: [
                Text(
                  'Track and manage your personalized learning paths.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                SearchBar(
                  controller: _searchController,
                  hintText: 'Search roadmaps...',
                  leading: const Icon(Icons.search),
                  onChanged: (value) => setState(
                    () => _query = value.trim().toLowerCase(),
                  ),
                ),
                const SizedBox(height: 12),
                _RoadmapControls(
                  filter: _filter,
                  sort: _sort,
                  onFilterChanged: (value) => setState(() => _filter = value),
                  onSortChanged: (value) => setState(() => _sort = value),
                ),
                const SizedBox(height: 16),
                if (items.isEmpty)
                  EmptyStateView(
                    icon: Icons.rocket_launch_outlined,
                    title: 'No roadmaps yet',
                    subtitle:
                        'Generate a personalized roadmap from an available career role to begin tracking progress.',
                    actionLabel: 'Create Roadmap',
                    onAction: () => context.go('/career-roles'),
                  )
                else if (visible.isEmpty)
                  const EmptyStateView(
                    icon: Icons.search_off_outlined,
                    title: 'No roadmaps match your filters',
                    subtitle: 'Try adjusting your search or status filter.',
                  )
                else
                  ...visible.map(
                    (roadmap) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _RoadmapManagementCard(
                        roadmap: roadmap,
                        isMutating: _mutatingId == roadmap.personalRoadmapId,
                        onOpen: () =>
                            context.go('/roadmap/${roadmap.personalRoadmapId}'),
                        onToggleActive: () => _toggleActive(roadmap),
                        onDelete: () => _deleteRoadmap(roadmap),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<PersonalRoadmapDto> _applyListControls(
    List<PersonalRoadmapDto> roadmaps,
  ) {
    var visible = roadmaps.where((roadmap) {
      final progress = roadmap.progressPercentage.round();
      final matchesFilter = switch (_filter) {
        _RoadmapFilter.all => true,
        _RoadmapFilter.active => roadmap.isActive,
        _RoadmapFilter.completed => progress >= 100,
        _RoadmapFilter.inProgress => progress > 0 && progress < 100,
        _RoadmapFilter.notStarted => progress == 0,
      };
      final title = _title(roadmap).toLowerCase();
      final description =
          (roadmap.careerRoadmap?.description ?? '').toLowerCase();
      final matchesSearch = _query.isEmpty ||
          title.contains(_query) ||
          description.contains(_query) ||
          roadmap.createdAt.contains(_query);
      return matchesFilter && matchesSearch;
    }).toList();

    visible.sort((a, b) {
      final direction = _sort.descending ? -1 : 1;
      final result = switch (_sort.key) {
        _RoadmapSortKey.name => _title(a).compareTo(_title(b)),
        _RoadmapSortKey.progress =>
          a.progressPercentage.compareTo(b.progressPercentage),
        _RoadmapSortKey.createdAt => a.createdAt.compareTo(b.createdAt),
      };
      return result * direction;
    });
    return visible;
  }

  Future<void> _toggleActive(PersonalRoadmapDto roadmap) async {
    setState(() => _mutatingId = roadmap.personalRoadmapId);
    try {
      await ref
          .read(roadmapRepositoryProvider)
          .toggleActiveRoadmap(roadmap.personalRoadmapId);
      ref.invalidate(personalRoadmapsProvider);
      ref.invalidate(dashboardDataProvider);
      if (mounted) AppSnackbar.showSuccess(context, 'Roadmap updated');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _mutatingId = null);
    }
  }

  Future<void> _deleteRoadmap(PersonalRoadmapDto roadmap) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Roadmap?',
      message: 'This roadmap will be removed from your list.',
      confirmLabel: 'Delete',
      isDanger: true,
    );
    if (confirmed != true) return;

    setState(() => _mutatingId = roadmap.personalRoadmapId);
    try {
      await ref
          .read(roadmapRepositoryProvider)
          .deleteRoadmap(roadmap.personalRoadmapId);
      ref.invalidate(personalRoadmapsProvider);
      ref.invalidate(dashboardDataProvider);
      if (mounted) AppSnackbar.showSuccess(context, 'Roadmap deleted');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _mutatingId = null);
    }
  }
}

class _RoadmapControls extends StatelessWidget {
  const _RoadmapControls({
    required this.filter,
    required this.sort,
    required this.onFilterChanged,
    required this.onSortChanged,
  });

  final _RoadmapFilter filter;
  final _RoadmapSort sort;
  final ValueChanged<_RoadmapFilter> onFilterChanged;
  final ValueChanged<_RoadmapSort> onSortChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        DropdownMenu<_RoadmapFilter>(
          initialSelection: filter,
          label: const Text('Status'),
          onSelected: (value) {
            if (value != null) onFilterChanged(value);
          },
          dropdownMenuEntries: _RoadmapFilter.values
              .map(
                (value) => DropdownMenuEntry(
                  value: value,
                  label: value.label,
                ),
              )
              .toList(),
        ),
        DropdownMenu<_RoadmapSort>(
          initialSelection: sort,
          label: const Text('Sort'),
          onSelected: (value) {
            if (value != null) onSortChanged(value);
          },
          dropdownMenuEntries: _RoadmapSort.values
              .map(
                (value) => DropdownMenuEntry(
                  value: value,
                  label: value.label,
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _RoadmapManagementCard extends StatelessWidget {
  const _RoadmapManagementCard({
    required this.roadmap,
    required this.isMutating,
    required this.onOpen,
    required this.onToggleActive,
    required this.onDelete,
  });

  final PersonalRoadmapDto roadmap;
  final bool isMutating;
  final VoidCallback onOpen;
  final VoidCallback onToggleActive;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final progress = roadmap.progressPercentage.round();
    final status = progress >= 100
        ? (label: 'Completed', value: 4)
        : progress > 0
            ? (label: 'In Progress', value: 1)
            : (label: 'Not Started', value: 0);

    return Card(
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _title(roadmap),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.titleMedium,
                        ),
                        if ((roadmap.careerRoadmap?.description ?? '')
                            .isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            roadmap.careerRoadmap!.description!,
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
                  PopupMenuButton<String>(
                    enabled: !isMutating,
                    onSelected: (value) {
                      if (value == 'delete') onDelete();
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline, color: AppColors.error),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Text('Progress', style: AppTextStyles.bodySmall),
                  const Spacer(),
                  Text('$progress%', style: AppTextStyles.titleSmall),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressBar(value: progress / 100),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (roadmap.isActive)
                    const StatusChip(status: 1, label: 'Active'),
                  StatusChip(status: status.value, label: status.label),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    _dateLabel(roadmap.createdAt),
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const Spacer(),
                  Text('Active', style: AppTextStyles.labelMedium),
                  const SizedBox(width: 8),
                  Switch(
                    value: roadmap.isActive,
                    onChanged: isMutating ? null : (_) => onToggleActive(),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'Open roadmap',
                    onPressed: onOpen,
                    icon: const Icon(Icons.folder_open_outlined),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoadmapListSkeleton extends StatelessWidget {
  const _RoadmapListSkeleton();

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

enum _RoadmapFilter {
  all('All Statuses'),
  active('Active'),
  completed('Completed'),
  inProgress('In Progress'),
  notStarted('Not Started');

  const _RoadmapFilter(this.label);
  final String label;
}

enum _RoadmapSortKey { name, progress, createdAt }

enum _RoadmapSort {
  createdNewest('Date Added: Newest', _RoadmapSortKey.createdAt, true),
  createdOldest('Date Added: Oldest', _RoadmapSortKey.createdAt, false),
  nameAsc('Name: A-Z', _RoadmapSortKey.name, false),
  progressDesc('Progress: High-Low', _RoadmapSortKey.progress, true),
  progressAsc('Progress: Low-High', _RoadmapSortKey.progress, false);

  const _RoadmapSort(this.label, this.key, this.descending);
  final String label;
  final _RoadmapSortKey key;
  final bool descending;
}

String _title(PersonalRoadmapDto roadmap) =>
    roadmap.careerRoadmap?.name ?? 'Personal Roadmap';

String _dateLabel(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return '';
  return '${parsed.day}/${parsed.month}/${parsed.year}';
}
