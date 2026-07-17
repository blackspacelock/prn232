import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/roadmap_providers.dart';

enum _RoadmapSort { createdAt, name, progress }

enum _RoadmapStatusFilter { all, active, completed, inProgress, notStarted }

enum _RoadmapView { mine, shared }

class RoadmapsManageScreen extends ConsumerStatefulWidget {
  const RoadmapsManageScreen({super.key});

  @override
  ConsumerState<RoadmapsManageScreen> createState() =>
      _RoadmapsManageScreenState();
}

class _RoadmapsManageScreenState extends ConsumerState<RoadmapsManageScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  _RoadmapSort _sort = _RoadmapSort.createdAt;
  bool _sortDescending = true;
  _RoadmapStatusFilter _filter = _RoadmapStatusFilter.all;
  _RoadmapView _view = _RoadmapView.mine;
  final Set<String> _busyRoadmaps = {};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final roadmaps = _view == _RoadmapView.mine
        ? ref.watch(personalRoadmapsProvider)
        : ref.watch(sharedRoadmapsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('My Roadmaps'),
        actions: [
          IconButton(
            tooltip: 'Browse templates',
            onPressed: () => context.go('/catalog'),
            icon: const Icon(Icons.travel_explore_outlined),
          ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => _view == _RoadmapView.mine
                ? ref.invalidate(personalRoadmapsProvider)
                : ref.invalidate(sharedRoadmapsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'create-personal-roadmap',
            onPressed: _showCreateSheet,
            icon: const Icon(Icons.add),
            label: const Text('Create'),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'generate-roadmap',
            onPressed: _showGenerateSheet,
            icon: const Icon(Icons.rocket_launch_outlined),
            label: const Text('Generate'),
          ),
        ],
      ),
      body: roadmaps.when(
        loading: () => const _RoadmapListSkeleton(),
        error: (_, __) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load roadmaps',
          subtitle: 'Pull the latest roadmap data and try again.',
          actionLabel: 'Retry',
          onAction: () => _view == _RoadmapView.mine
              ? ref.invalidate(personalRoadmapsProvider)
              : ref.invalidate(sharedRoadmapsProvider),
        ),
        data: (items) {
          final visibleRoadmaps = _visibleRoadmaps(items);
          return RefreshIndicator(
            onRefresh: () async {
              if (_view == _RoadmapView.mine) {
                ref.invalidate(personalRoadmapsProvider);
                await ref.read(personalRoadmapsProvider.future);
              } else {
                ref.invalidate(sharedRoadmapsProvider);
                await ref.read(sharedRoadmapsProvider.future);
              }
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _RoadmapToolbar(
                    searchController: _searchController,
                    search: _search,
                    view: _view,
                    sort: _sort,
                    sortDescending: _sortDescending,
                    filter: _filter,
                    onSearchChanged: (value) => setState(() => _search = value),
                    onClearSearch: () {
                      _searchController.clear();
                      setState(() => _search = '');
                    },
                    onViewChanged: (value) => setState(() => _view = value),
                    onSortChanged: (value) => setState(() => _sort = value),
                    onToggleDirection: () =>
                        setState(() => _sortDescending = !_sortDescending),
                    onFilterChanged: (value) => setState(() => _filter = value),
                  ),
                ),
                if (visibleRoadmaps.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyStateView(
                      icon: Icons.map_outlined,
                      title: _search.isNotEmpty ||
                              _filter != _RoadmapStatusFilter.all
                          ? 'No roadmaps match your filters'
                          : 'No roadmaps yet',
                      subtitle: _search.isNotEmpty ||
                              _filter != _RoadmapStatusFilter.all
                          ? 'Try a different search, sort, or status filter.'
                          : 'Generate a personalized roadmap from a career role to begin tracking progress.',
                      actionLabel: 'Generate Roadmap',
                      onAction: _showGenerateSheet,
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                    sliver: SliverList.separated(
                      itemCount: visibleRoadmaps.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final roadmap = visibleRoadmaps[index];
                        return _RoadmapManageCard(
                          roadmap: roadmap,
                          isBusy: _busyRoadmaps.contains(
                            roadmap.personalRoadmapId,
                          ),
                          onOpen: () => context.go(
                            '/roadmap/${roadmap.personalRoadmapId}',
                          ),
                          onToggleActive: () => _toggleActive(roadmap),
                          onToggleShared: () => _toggleShared(roadmap),
                          onCopy: () => _copyShared(roadmap),
                          onManageTags: () => _showTagSheet(roadmap),
                          onDelete: () => _confirmDelete(roadmap),
                          readOnly: _view == _RoadmapView.shared,
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<PersonalRoadmapDto> _visibleRoadmaps(List<PersonalRoadmapDto> items) {
    final term = _search.trim().toLowerCase();
    final filtered = items.where((roadmap) {
      final progress = roadmap.progressPercentage.round();
      final matchesSearch = term.isEmpty ||
          roadmap.displayName.toLowerCase().contains(term) ||
          (roadmap.displayDescription ?? '').toLowerCase().contains(term) ||
          (roadmap.note ?? '').toLowerCase().contains(term) ||
          _formatDate(roadmap.createdAt).toLowerCase().contains(term) ||
          roadmap.tags.any((tag) => tag.name.toLowerCase().contains(term));

      final matchesStatus = switch (_filter) {
        _RoadmapStatusFilter.all => true,
        _RoadmapStatusFilter.active => roadmap.isActive,
        _RoadmapStatusFilter.completed => progress >= 100,
        _RoadmapStatusFilter.inProgress =>
          progress < 100 && (progress > 0 || roadmap.inProgressCount > 0),
        _RoadmapStatusFilter.notStarted =>
          progress == 0 && roadmap.inProgressCount == 0,
      };

      return matchesSearch && matchesStatus;
    }).toList();

    filtered.sort((a, b) {
      final comparison = switch (_sort) {
        _RoadmapSort.name => a.displayName.compareTo(b.displayName),
        _RoadmapSort.progress =>
          a.progressPercentage.compareTo(b.progressPercentage),
        _RoadmapSort.createdAt => a.createdAt.compareTo(b.createdAt),
      };
      return _sortDescending ? -comparison : comparison;
    });

    return filtered;
  }

  Future<void> _showGenerateSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _GenerateRoadmapSheet(),
    );
  }

  Future<void> _showCreateSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _CreatePersonalRoadmapSheet(),
    );
  }

  Future<void> _toggleActive(PersonalRoadmapDto roadmap) async {
    final id = roadmap.personalRoadmapId;
    setState(() => _busyRoadmaps.add(id));
    try {
      await ref.read(roadmapRepositoryProvider).toggleActiveRoadmap(id);
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (mounted) {
        AppSnackbar.showSuccess(
          context,
          roadmap.isActive ? 'Roadmap deactivated' : 'Roadmap activated',
        );
      }
    } finally {
      if (mounted) setState(() => _busyRoadmaps.remove(id));
    }
  }

  Future<void> _toggleShared(PersonalRoadmapDto roadmap) async {
    final id = roadmap.personalRoadmapId;
    setState(() => _busyRoadmaps.add(id));
    try {
      await ref.read(roadmapRepositoryProvider).toggleSharedRoadmap(id);
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(sharedRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (mounted) {
        AppSnackbar.showSuccess(
          context,
          roadmap.isShared ? 'Roadmap unshared' : 'Roadmap shared',
        );
      }
    } finally {
      if (mounted) setState(() => _busyRoadmaps.remove(id));
    }
  }

  Future<void> _copyShared(PersonalRoadmapDto roadmap) async {
    final id = roadmap.personalRoadmapId;
    setState(() => _busyRoadmaps.add(id));
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final copied =
          await ref.read(roadmapRepositoryProvider).copySharedRoadmap(
                profileId,
                id,
              );
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (!mounted) return;
      AppSnackbar.showSuccess(context, 'Roadmap copied');
      context.go('/roadmap/${copied.personalRoadmapId}');
    } finally {
      if (mounted) setState(() => _busyRoadmaps.remove(id));
    }
  }

  Future<void> _confirmDelete(PersonalRoadmapDto roadmap) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Roadmap?',
      message:
          'This roadmap will be removed from your list. Your profile data is not affected.',
      confirmLabel: 'Delete',
      isDanger: true,
    );
    if (confirmed != true) return;

    final id = roadmap.personalRoadmapId;
    setState(() => _busyRoadmaps.add(id));
    try {
      await ref.read(roadmapRepositoryProvider).deleteRoadmap(id);
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (mounted) AppSnackbar.showSuccess(context, 'Roadmap deleted');
    } finally {
      if (mounted) setState(() => _busyRoadmaps.remove(id));
    }
  }

  Future<void> _showTagSheet(PersonalRoadmapDto roadmap) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _RoadmapTagSheet(roadmap: roadmap),
    );
  }
}

class _RoadmapToolbar extends StatelessWidget {
	  const _RoadmapToolbar({
	    required this.searchController,
	    required this.search,
	    required this.view,
	    required this.sort,
    required this.sortDescending,
    required this.filter,
	    required this.onSearchChanged,
	    required this.onClearSearch,
	    required this.onViewChanged,
    required this.onSortChanged,
    required this.onToggleDirection,
    required this.onFilterChanged,
  });

	  final TextEditingController searchController;
	  final String search;
	  final _RoadmapView view;
  final _RoadmapSort sort;
  final bool sortDescending;
  final _RoadmapStatusFilter filter;
	  final ValueChanged<String> onSearchChanged;
	  final VoidCallback onClearSearch;
	  final ValueChanged<_RoadmapView> onViewChanged;
  final ValueChanged<_RoadmapSort> onSortChanged;
  final VoidCallback onToggleDirection;
  final ValueChanged<_RoadmapStatusFilter> onFilterChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Track and manage your personalized learning paths.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
	          ),
	          const SizedBox(height: 16),
	          SegmentedButton<_RoadmapView>(
	            segments: const [
	              ButtonSegment(
	                value: _RoadmapView.mine,
	                icon: Icon(Icons.map_outlined),
	                label: Text('Mine'),
	              ),
	              ButtonSegment(
	                value: _RoadmapView.shared,
	                icon: Icon(Icons.public),
	                label: Text('Shared'),
	              ),
	            ],
	            selected: {view},
	            onSelectionChanged: (values) => onViewChanged(values.first),
	          ),
	          const SizedBox(height: 12),
	          SearchBar(
            controller: searchController,
            hintText: 'Search roadmaps...',
            leading: const Icon(Icons.search),
            trailing: [
              if (search.isNotEmpty)
                IconButton(
                  tooltip: 'Clear search',
                  onPressed: onClearSearch,
                  icon: const Icon(Icons.close),
                ),
            ],
            onChanged: onSearchChanged,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MenuField<_RoadmapStatusFilter>(
                  icon: Icons.filter_list,
                  label: _filterLabel(filter),
                  values: _RoadmapStatusFilter.values,
                  selected: filter,
                  onSelected: onFilterChanged,
                  labelBuilder: _filterLabel,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _MenuField<_RoadmapSort>(
                  icon: Icons.sort,
                  label: _sortLabel(sort),
                  values: _RoadmapSort.values,
                  selected: sort,
                  onSelected: onSortChanged,
                  labelBuilder: _sortLabel,
                ),
              ),
              IconButton.filledTonal(
                tooltip: sortDescending ? 'Descending' : 'Ascending',
                onPressed: onToggleDirection,
                icon: Icon(
                  sortDescending ? Icons.south_outlined : Icons.north_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MenuField<T> extends StatelessWidget {
  const _MenuField({
    required this.icon,
    required this.label,
    required this.values,
    required this.selected,
    required this.onSelected,
    required this.labelBuilder,
  });

  final IconData icon;
  final String label;
  final List<T> values;
  final T selected;
  final ValueChanged<T> onSelected;
  final String Function(T value) labelBuilder;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<T>(
      initialValue: selected,
      onSelected: onSelected,
      itemBuilder: (context) => values
          .map(
            (value) => PopupMenuItem<T>(
              value: value,
              child: Row(
                children: [
                  if (value == selected) ...[
                    const Icon(Icons.check, size: 18),
                    const SizedBox(width: 8),
                  ] else
                    const SizedBox(width: 26),
                  Text(labelBuilder(value)),
                ],
              ),
            ),
          )
          .toList(),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.onSurfaceVariant),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.arrow_drop_down),
          ],
        ),
      ),
    );
  }
}

class _RoadmapManageCard extends StatelessWidget {
  const _RoadmapManageCard({
    required this.roadmap,
    required this.isBusy,
    required this.onOpen,
	    required this.onToggleActive,
	    required this.onToggleShared,
	    required this.onCopy,
	    required this.onManageTags,
	    required this.onDelete,
	    this.readOnly = false,
	  });

  final PersonalRoadmapDto roadmap;
  final bool isBusy;
  final VoidCallback onOpen;
	  final VoidCallback onToggleActive;
	  final VoidCallback onToggleShared;
	  final VoidCallback onCopy;
	  final VoidCallback onManageTags;
	  final VoidCallback onDelete;
	  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    final progress = roadmap.progressPercentage.round().clamp(0, 100);
    final progressColor = _progressColor(progress);

    return Card(
      margin: EdgeInsets.zero,
      elevation: 1,
      color: AppColors.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onOpen,
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
                          roadmap.displayName,
                          style: AppTextStyles.titleMedium,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (roadmap.displayDescription != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            roadmap.displayDescription!,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
	                  if (!readOnly)
	                    PopupMenuButton<_RoadmapAction>(
	                      enabled: !isBusy,
	                      onSelected: (action) {
	                        switch (action) {
	                          case _RoadmapAction.tags:
	                            onManageTags();
	                          case _RoadmapAction.share:
	                            onToggleShared();
	                          case _RoadmapAction.delete:
	                            onDelete();
	                        }
	                      },
	                      itemBuilder: (_) => [
	                        PopupMenuItem(
	                          value: _RoadmapAction.share,
	                          child: ListTile(
	                            dense: true,
	                            leading: const Icon(Icons.ios_share_outlined),
	                            title:
	                                Text(roadmap.isShared ? 'Unshare' : 'Share'),
	                          ),
	                        ),
	                        const PopupMenuItem(
	                          value: _RoadmapAction.tags,
	                          child: ListTile(
	                            dense: true,
	                            leading: Icon(Icons.sell_outlined),
	                            title: Text('Manage Tags'),
	                          ),
	                        ),
	                        const PopupMenuItem(
	                          value: _RoadmapAction.delete,
	                          child: ListTile(
	                            dense: true,
	                            leading: Icon(
	                              Icons.delete_outline,
	                              color: AppColors.error,
	                            ),
	                            title: Text('Delete'),
	                          ),
	                        ),
	                      ],
	                    ),
                ],
              ),
              if (roadmap.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: roadmap.tags
                      .map((tag) => _RoadmapTagChip(tag: tag))
                      .toList(),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(
                    'Progress',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '$progress%',
                    style: AppTextStyles.titleSmall.copyWith(
                      color: progressColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressBar(
                value: progress / 100,
                height: 8,
                color: progressColor,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _RoadmapStatusBadge(roadmap: roadmap),
                  if (roadmap.isActive) ...[
                    const SizedBox(width: 8),
                    const _ActiveBadge(),
                  ],
                  if (roadmap.isShared) ...[
                    const SizedBox(width: 8),
                    const _SharedBadge(),
                  ],
                  const Spacer(),
                  Text(
	                    readOnly && roadmap.ownerName != null
	                        ? 'By ${roadmap.ownerName}'
	                        : _formatDate(roadmap.createdAt),
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
	                  if (!readOnly) ...[
	                    Expanded(
	                      child: SwitchListTile.adaptive(
	                        contentPadding: EdgeInsets.zero,
	                        dense: true,
	                        title: const Text('Active'),
	                        value: roadmap.isActive,
	                        onChanged: isBusy ? null : (_) => onToggleActive(),
	                      ),
	                    ),
	                    const SizedBox(width: 8),
	                  ] else
	                    Expanded(
	                      child: OutlinedButton.icon(
	                        onPressed: isBusy ? null : onCopy,
	                        icon: const Icon(Icons.copy_outlined),
	                        label: Text(isBusy ? 'Copying...' : 'Copy'),
	                      ),
	                    ),
	                  if (readOnly) const SizedBox(width: 8),
	                  FilledButton.icon(
                    onPressed: onOpen,
                    icon: const Icon(Icons.folder_open_outlined),
                    label: const Text('Open'),
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

enum _RoadmapAction { tags, share, delete }

class _CreatePersonalRoadmapSheet extends ConsumerStatefulWidget {
  const _CreatePersonalRoadmapSheet();

  @override
  ConsumerState<_CreatePersonalRoadmapSheet> createState() =>
      _CreatePersonalRoadmapSheetState();
}

class _CreatePersonalRoadmapSheetState
    extends ConsumerState<_CreatePersonalRoadmapSheet> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _desireController = TextEditingController();
  final List<TextEditingController> _stepNames = [
    TextEditingController(),
    TextEditingController(),
    TextEditingController(),
  ];
  final List<TextEditingController> _stepDescriptions = [
    TextEditingController(),
    TextEditingController(),
    TextEditingController(),
  ];
  CareerRoleDto? _selectedRole;
  bool _creating = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _desireController.dispose();
    for (final controller in [..._stepNames, ..._stepDescriptions]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.86,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Create Personal Roadmap',
                  style: AppTextStyles.headlineMedium),
              const SizedBox(height: 4),
              Text(
                'Build a path from your own goal and learning steps.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  children: [
                    TextField(
                      controller: _nameController,
                      maxLength: 160,
                      decoration: const InputDecoration(
                        labelText: 'Roadmap name',
                        prefixIcon: Icon(Icons.map_outlined),
                      ),
                    ),
                    const SizedBox(height: 8),
                    roles.when(
                      loading: () => const LinearProgressIndicator(),
                      error: (_, __) => OutlinedButton.icon(
                        onPressed: () => ref.invalidate(careerRolesProvider),
                        icon: const Icon(Icons.refresh),
                        label: const Text('Reload roles'),
                      ),
                      data: (items) => DropdownButtonFormField<CareerRoleDto>(
                        initialValue: _selectedRole,
                        decoration: const InputDecoration(
                          labelText: 'Related role',
                          prefixIcon: Icon(Icons.work_outline),
                        ),
                        items: items
                            .map(
                              (role) => DropdownMenuItem(
                                value: role,
                                child: Text(role.name),
                              ),
                            )
                            .toList(),
                        onChanged: _creating
                            ? null
                            : (value) => setState(() => _selectedRole = value),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _descriptionController,
                      maxLength: 240,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        prefixIcon: Icon(Icons.short_text),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _desireController,
                      maxLength: 1000,
                      minLines: 3,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Your desire or goal',
                        prefixIcon: Icon(Icons.flag_outlined),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text('Learning steps', style: AppTextStyles.titleSmall),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: _creating ? null : _addStep,
                          icon: const Icon(Icons.add),
                          label: const Text('Add Step'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    for (var i = 0; i < _stepNames.length; i++)
                      _StepEditor(
                        index: i,
                        nameController: _stepNames[i],
                        descriptionController: _stepDescriptions[i],
                        canRemove: _stepNames.length > 1,
                        onRemove: _creating ? null : () => _removeStep(i),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _creating ? null : _create,
                  icon: _creating
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.add),
                  label: Text(_creating ? 'Creating...' : 'Create Roadmap'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _addStep() {
    setState(() {
      _stepNames.add(TextEditingController());
      _stepDescriptions.add(TextEditingController());
    });
  }

  void _removeStep(int index) {
    final name = _stepNames.removeAt(index);
    final description = _stepDescriptions.removeAt(index);
    name.dispose();
    description.dispose();
    setState(() {});
  }

  Future<void> _create() async {
    final name = _nameController.text.trim();
    final role = _selectedRole;
    final steps = <Map<String, String>>[];
    for (var i = 0; i < _stepNames.length; i++) {
      final stepName = _stepNames[i].text.trim();
      if (stepName.isEmpty) continue;
      final description = _stepDescriptions[i].text.trim();
      steps.add({
        'name': stepName,
        if (description.isNotEmpty) 'description': description,
      });
    }
    if (name.isEmpty || role == null || steps.isEmpty) {
      AppSnackbar.showError(
        context,
        'Add a name, related role, and at least one step.',
      );
      return;
    }

    setState(() => _creating = true);
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final roadmap =
          await ref.read(roadmapRepositoryProvider).createPersonalRoadmap(
                profileId: profileId,
                careerRoleId: role.careerRoleId,
                name: name,
                description: _descriptionController.text.trim(),
                desire: _desireController.text.trim(),
                steps: steps,
              );
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }
}

class _StepEditor extends StatelessWidget {
  const _StepEditor({
    required this.index,
    required this.nameController,
    required this.descriptionController,
    required this.canRemove,
    required this.onRemove,
  });

  final int index;
  final TextEditingController nameController;
  final TextEditingController descriptionController;
  final bool canRemove;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: AppColors.surfaceContainerLowest,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: AppColors.primaryContainer,
                  child: Text('${index + 1}', style: AppTextStyles.labelSmall),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: nameController,
                    maxLength: 140,
                    decoration: const InputDecoration(
                      counterText: '',
                      hintText: 'Step title',
                    ),
                  ),
                ),
                if (canRemove)
                  IconButton(
                    tooltip: 'Remove step',
                    onPressed: onRemove,
                    icon: const Icon(Icons.close),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: descriptionController,
              maxLength: 500,
              minLines: 2,
              maxLines: 3,
              decoration: const InputDecoration(
                counterText: '',
                hintText: 'Optional step details',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GenerateRoadmapSheet extends ConsumerStatefulWidget {
  const _GenerateRoadmapSheet();

  @override
  ConsumerState<_GenerateRoadmapSheet> createState() =>
      _GenerateRoadmapSheetState();
}

class _GenerateRoadmapSheetState extends ConsumerState<_GenerateRoadmapSheet> {
  CareerRoleDto? _selectedRole;
  CareerRoadmapDto? _selectedRoadmap;
  List<CareerRoadmapDto> _templates = const [];
  bool _loadingTemplates = false;
  bool _generating = false;

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.82,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Generate Roadmap', style: AppTextStyles.headlineMedium),
              const SizedBox(height: 4),
              Text(
                'Select a career role and roadmap template.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: roles.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (_, __) => EmptyStateView(
                    icon: Icons.error_outline,
                    title: 'Could not load roles',
                    actionLabel: 'Retry',
                    onAction: () => ref.invalidate(careerRolesProvider),
                  ),
                  data: (items) => ListView(
                    children: [
                      Text('1. Career Role', style: AppTextStyles.titleSmall),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: items
                            .map(
                              (role) => ChoiceChip(
                                label: Text(role.name),
                                selected: role.careerRoleId ==
                                    _selectedRole?.careerRoleId,
                                onSelected: _generating
                                    ? null
                                    : (_) => _selectRole(role),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '2. Roadmap Template',
                        style: AppTextStyles.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      if (_selectedRole == null)
                        Text(
                          'Choose a role first.',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        )
                      else if (_loadingTemplates)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (_templates.isEmpty)
                        Text(
                          'No roadmap templates for this role.',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        )
                      else
                        ..._templates.map(
                          (template) => _RoadmapTemplateTile(
                            template: template,
                            selected: template.careerRoadmapId ==
                                _selectedRoadmap?.careerRoadmapId,
                            enabled: !_generating,
                            onTap: () =>
                                setState(() => _selectedRoadmap = template),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _selectedRoadmap == null || _generating
                      ? null
                      : _generate,
                  icon: _generating
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.rocket_launch_outlined),
                  label:
                      Text(_generating ? 'Generating...' : 'Generate Roadmap'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectRole(CareerRoleDto role) async {
    setState(() {
      _selectedRole = role;
      _selectedRoadmap = null;
      _templates = const [];
      _loadingTemplates = true;
    });
    final templates = await ref
        .read(roadmapRepositoryProvider)
        .getRoadmapsByRole(role.careerRoleId);
    if (!mounted) return;
    setState(() {
      _templates = templates;
      _loadingTemplates = false;
    });
  }

  Future<void> _generate() async {
    final selected = _selectedRoadmap;
    if (selected == null) return;
    setState(() => _generating = true);
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final roadmap = await ref
          .read(roadmapRepositoryProvider)
          .generateRoadmap(profileId, selected.careerRoadmapId);
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }
}

class _RoadmapTemplateTile extends StatelessWidget {
  const _RoadmapTemplateTile({
    required this.template,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final CareerRoadmapDto template;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: selected
          ? AppColors.primaryContainer.withValues(alpha: 0.12)
          : AppColors.surfaceContainerLowest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.outlineVariant,
        ),
      ),
      child: ListTile(
        enabled: enabled,
        onTap: enabled ? onTap : null,
        leading: Icon(
          selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
          color: selected ? AppColors.primary : AppColors.onSurfaceVariant,
        ),
        title: Text(template.name),
        subtitle:
            template.description == null ? null : Text(template.description!),
      ),
    );
  }
}

class _RoadmapTagSheet extends ConsumerStatefulWidget {
  const _RoadmapTagSheet({required this.roadmap});

  final PersonalRoadmapDto roadmap;

  @override
  ConsumerState<_RoadmapTagSheet> createState() => _RoadmapTagSheetState();
}

class _RoadmapTagSheetState extends ConsumerState<_RoadmapTagSheet> {
  static const _colors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#3b82f6',
    '#64748b',
  ];

  late List<RoadmapTagDto> _tags;
  final _nameController = TextEditingController();
  String _selectedColor = _colors.first;
  RoadmapTagDto? _editingTag;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _tags = [...widget.roadmap.tags];
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.78,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Manage Tags',
                            style: AppTextStyles.headlineMedium),
                        Text(
                          widget.roadmap.displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_tags.isEmpty)
                Text(
                  'No tags yet.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _tags
                      .map(
                        (tag) => InputChip(
                          avatar: Icon(
                            Icons.sell_outlined,
                            size: 16,
                            color: _tagColor(tag),
                          ),
                          label: Text(tag.name),
                          selected:
                              tag.roadmapTagId == _editingTag?.roadmapTagId,
                          onSelected: (_) => _startEdit(tag),
                          onDeleted: _saving ? null : () => _deleteTag(tag),
                        ),
                      )
                      .toList(),
                ),
              const SizedBox(height: 20),
              Text(
                _editingTag == null ? 'Add a tag' : 'Edit tag',
                style: AppTextStyles.titleSmall,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nameController,
                maxLength: 100,
                decoration: const InputDecoration(
                  hintText: 'Tag name...',
                  prefixIcon: Icon(Icons.sell_outlined),
                ),
                onSubmitted: (_) => _saveTag(),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _colors
                    .map(
                      (color) => InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: () => setState(() => _selectedColor = color),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: _parseColor(color),
                            shape: BoxShape.circle,
                            border: Border.all(
                              width: _selectedColor == color ? 3 : 1,
                              color: _selectedColor == color
                                  ? AppColors.onSurface
                                  : Colors.transparent,
                            ),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const Spacer(),
              Row(
                children: [
                  if (_editingTag != null) ...[
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving ? null : _clearEditor,
                        child: const Text('Cancel Edit'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _saving ? null : _saveTag,
                      icon: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.add),
                      label: Text(_editingTag == null ? 'Add Tag' : 'Save Tag'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _startEdit(RoadmapTagDto tag) {
    setState(() {
      _editingTag = tag;
      _nameController.text = tag.name;
      _selectedColor = tag.color ?? _colors.first;
    });
  }

  void _clearEditor() {
    setState(() {
      _editingTag = null;
      _nameController.clear();
      _selectedColor = _colors.first;
    });
  }

  Future<void> _saveTag() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _saving = true);
    try {
      final repo = ref.read(roadmapRepositoryProvider);
      final roadmapId = widget.roadmap.personalRoadmapId;
      final editing = _editingTag;
      final saved = editing == null
          ? await repo.addTag(roadmapId, name, color: _selectedColor)
          : await repo.updateTag(
              roadmapId,
              editing.roadmapTagId,
              name: name,
              color: _selectedColor,
            );

      setState(() {
        if (editing == null) {
          _tags = [..._tags, saved];
        } else {
          _tags = _tags
              .map(
                  (tag) => tag.roadmapTagId == saved.roadmapTagId ? saved : tag)
              .toList();
        }
      });
      _clearEditor();
      _invalidateRoadmaps(roadmapId);
      if (mounted) AppSnackbar.showSuccess(context, 'Tag saved');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteTag(RoadmapTagDto tag) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Remove Tag?',
      message: 'Remove "${tag.name}" from this roadmap?',
      confirmLabel: 'Remove',
      isDanger: true,
    );
    if (confirmed != true) return;

    setState(() => _saving = true);
    try {
      final roadmapId = widget.roadmap.personalRoadmapId;
      await ref
          .read(roadmapRepositoryProvider)
          .deleteTag(roadmapId, tag.roadmapTagId);
      setState(() {
        _tags = _tags
            .where((item) => item.roadmapTagId != tag.roadmapTagId)
            .toList();
      });
      if (_editingTag?.roadmapTagId == tag.roadmapTagId) _clearEditor();
      _invalidateRoadmaps(roadmapId);
      if (mounted) AppSnackbar.showSuccess(context, 'Tag removed');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _invalidateRoadmaps(String roadmapId) {
    ref
      ..invalidate(personalRoadmapsProvider)
      ..invalidate(personalRoadmapDetailProvider(roadmapId))
      ..invalidate(dashboardDataProvider);
  }

  Color _tagColor(RoadmapTagDto tag) => _parseColor(tag.color ?? '#64748b');
}

class _RoadmapTagChip extends StatelessWidget {
  const _RoadmapTagChip({required this.tag});

  final RoadmapTagDto tag;

  @override
  Widget build(BuildContext context) {
    final color = _parseColor(tag.color ?? '#64748b');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sell_outlined, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            tag.name,
            style: AppTextStyles.labelSmall.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}

class _RoadmapStatusBadge extends StatelessWidget {
  const _RoadmapStatusBadge({required this.roadmap});

  final PersonalRoadmapDto roadmap;

  @override
  Widget build(BuildContext context) {
    final progress = roadmap.progressPercentage.round();
    final label = progress >= 100
        ? 'Completed'
        : progress > 0 || roadmap.inProgressCount > 0
            ? 'In Progress'
            : 'Not Started';
    final color = progress >= 100
        ? AppColors.success
        : progress > 0 || roadmap.inProgressCount > 0
            ? AppColors.primary
            : AppColors.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(color: color),
      ),
    );
  }
}

class _ActiveBadge extends StatelessWidget {
  const _ActiveBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.successContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'Active',
        style: AppTextStyles.labelSmall.copyWith(color: AppColors.success),
      ),
    );
  }
}

class _SharedBadge extends StatelessWidget {
  const _SharedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'Shared',
        style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary),
      ),
    );
  }
}

class _RoadmapListSkeleton extends StatelessWidget {
  const _RoadmapListSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => const SkeletonCard(height: 196),
    );
  }
}

String _sortLabel(_RoadmapSort sort) => switch (sort) {
      _RoadmapSort.createdAt => 'Date Added',
      _RoadmapSort.name => 'Name',
      _RoadmapSort.progress => 'Progress',
    };

String _filterLabel(_RoadmapStatusFilter filter) => switch (filter) {
      _RoadmapStatusFilter.all => 'All Statuses',
      _RoadmapStatusFilter.active => 'Active',
      _RoadmapStatusFilter.completed => 'Completed',
      _RoadmapStatusFilter.inProgress => 'In Progress',
      _RoadmapStatusFilter.notStarted => 'Not Started',
    };

String _formatDate(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value.isEmpty ? 'No date' : value;
  return DateFormat.yMMMd().format(parsed.toLocal());
}

Color _progressColor(int progress) {
  if (progress >= 70) return AppColors.success;
  if (progress >= 30) return AppColors.primary;
  return AppColors.onSurfaceVariant;
}

Color _parseColor(String value) {
  final hex = value.replaceFirst('#', '');
  final parsed = int.tryParse(hex.length == 6 ? 'FF$hex' : hex, radix: 16);
  return parsed == null ? AppColors.onSurfaceVariant : Color(parsed);
}
