import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_filter_controls.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../../core/widgets/status_chip.dart';
import '../data/roadmap_repository.dart';
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
  String _tagFilter = '';
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
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton.icon(
              onPressed: _showRoadmapActionSheet,
              icon: const Icon(Icons.rocket_launch_outlined, size: 18),
              label: const Text('Generate Roadmap'),
            ),
          ),
        ],
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
          final tagOptions = _tagOptions(items);
          final visible = _applyListControls(items);
          final activeCount = items.where((roadmap) => roadmap.isActive).length;
          final averageProgress = items.isEmpty
              ? 0
              : (items
                          .map((roadmap) => roadmap.progressPercentage)
                          .reduce((a, b) => a + b) /
                      items.length)
                  .round();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(personalRoadmapsProvider);
              ref.invalidate(dashboardDataProvider);
              await ref.read(personalRoadmapsProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                _RoadmapOverviewPanel(
                  totalCount: items.length,
                  activeCount: activeCount,
                  averageProgress: averageProgress,
                ),
                const SizedBox(height: 14),
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
                  tagFilter: _tagFilter,
                  tagOptions: tagOptions,
                  onFilterChanged: (value) => setState(() => _filter = value),
                  onSortChanged: (value) => setState(() => _sort = value),
                  onTagFilterChanged: (value) =>
                      setState(() => _tagFilter = value),
                ),
                const SizedBox(height: 16),
                if (items.isEmpty)
                  EmptyStateView(
                    icon: Icons.rocket_launch_outlined,
                    title: 'No roadmaps yet',
                    subtitle:
                        'Generate a personalized roadmap from an available career role to begin tracking progress.',
                    actionLabel: 'Generate Roadmap',
                    onAction: _showTemplateRoadmapSheet,
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
                        onManageTags: () => _showTagManagerSheet(roadmap),
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

  Future<void> _showTemplateRoadmapSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _RoadmapGenerationSheet(),
    );
  }

  Future<void> _showCreatePersonalRoadmapSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _CustomPersonalRoadmapSheet(),
    );
  }

  Future<void> _showRoadmapActionSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Generate Roadmap', style: AppTextStyles.titleLarge),
              const SizedBox(height: 4),
              Text(
                'Choose how you want to start your next roadmap.',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              AppButton(
                label: 'Generate From Template',
                leadingIcon: const Icon(Icons.rocket_launch_outlined),
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  _showTemplateRoadmapSheet();
                },
              ),
              const SizedBox(height: 10),
              AppButton(
                label: 'Create Personal Roadmap',
                variant: AppButtonVariant.tonal,
                leadingIcon: const Icon(Icons.add_task_outlined),
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  _showCreatePersonalRoadmapSheet();
                },
              ),
            ],
          ),
        ),
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
      final matchesTag = _tagFilter.isEmpty ||
          roadmap.tags.any(
            (tag) => tag.name.toLowerCase() == _tagFilter.toLowerCase(),
          );
      final title = _title(roadmap).toLowerCase();
      final description =
          (roadmap.careerRoadmap?.description ?? '').toLowerCase();
      final note = (roadmap.note ?? '').toLowerCase();
      final tags = roadmap.tags.map((tag) => tag.name).join(' ').toLowerCase();
      final matchesSearch = _query.isEmpty ||
          title.contains(_query) ||
          description.contains(_query) ||
          note.contains(_query) ||
          tags.contains(_query) ||
          roadmap.createdAt.contains(_query);
      return matchesFilter && matchesTag && matchesSearch;
    }).toList();

    visible.sort((a, b) {
      final direction = _sort.descending ? -1 : 1;
      final result = switch (_sort.key) {
        _RoadmapSortKey.name => _title(a).compareTo(_title(b)),
        _RoadmapSortKey.progress =>
          a.progressPercentage.compareTo(b.progressPercentage),
        _RoadmapSortKey.tag => _firstTag(a).compareTo(_firstTag(b)),
        _RoadmapSortKey.createdAt => a.createdAt.compareTo(b.createdAt),
      };
      return result * direction;
    });
    return visible;
  }

  List<String> _tagOptions(List<PersonalRoadmapDto> roadmaps) {
    final names = <String, String>{};
    for (final roadmap in roadmaps) {
      for (final tag in roadmap.tags) {
        final name = tag.name.trim();
        if (name.isNotEmpty) {
          names.putIfAbsent(name.toLowerCase(), () => name);
        }
      }
    }
    final result = names.values.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return result;
  }

  Future<void> _showTagManagerSheet(PersonalRoadmapDto roadmap) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _TagManagerSheet(roadmap: roadmap),
    );
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
      message:
          'This roadmap will be removed from your list. Your account and profile data are not affected.',
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

class _RoadmapOverviewPanel extends StatelessWidget {
  const _RoadmapOverviewPanel({
    required this.totalCount,
    required this.activeCount,
    required this.averageProgress,
  });

  final int totalCount;
  final int activeCount;
  final int averageProgress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('My Roadmaps', style: AppTextStyles.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Track and manage your personalized learning paths.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _RoadmapStatTile(
                  label: 'Total',
                  value: totalCount.toString(),
                  icon: Icons.map_outlined,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _RoadmapStatTile(
                  label: 'Active',
                  value: activeCount.toString(),
                  icon: Icons.check_circle_outline,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _RoadmapStatTile(
                  label: 'Avg',
                  value: '$averageProgress%',
                  icon: Icons.trending_up_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RoadmapStatTile extends StatelessWidget {
  const _RoadmapStatTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(height: 8),
          Text(value, style: AppTextStyles.titleMedium),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelSmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoadmapGenerationSheet extends ConsumerStatefulWidget {
  const _RoadmapGenerationSheet();

  @override
  ConsumerState<_RoadmapGenerationSheet> createState() =>
      _RoadmapGenerationSheetState();
}

class _RoadmapGenerationSheetState
    extends ConsumerState<_RoadmapGenerationSheet> {
  final _roleSearchController = TextEditingController();
  final _templateSearchController = TextEditingController();
  CareerRoleDto? _selectedRole;
  String? _selectedRoadmapId;
  String _roleQuery = '';
  String _templateQuery = '';
  bool _isGenerating = false;

  @override
  void dispose() {
    _roleSearchController.dispose();
    _templateSearchController.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    final careerRoadmapId = _selectedRoadmapId;
    if (careerRoadmapId == null || _isGenerating) return;

    setState(() => _isGenerating = true);
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final roadmap = await ref.read(roadmapRepositoryProvider).generateRoadmap(
            profileId,
            careerRoadmapId,
          );
      ref.invalidate(personalRoadmapsProvider);
      ref.invalidate(dashboardDataProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);
    final roadmaps = _selectedRole == null
        ? const AsyncValue<List<CareerRoadmapDto>>.data([])
        : ref.watch(roadmapsBySelectedRoleProvider);
    return PopScope(
      canPop: !_isGenerating,
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            16,
            0,
            16,
            MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.78,
            child: _isGenerating
                ? const _GeneratingRoadmapView()
                : _buildTemplateFlow(roles, roadmaps),
          ),
        ),
      ),
    );
  }

  Widget _buildTemplateFlow(
    AsyncValue<List<CareerRoleDto>> roles,
    AsyncValue<List<CareerRoadmapDto>> roadmaps,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Generate Roadmap', style: AppTextStyles.titleLarge),
        const SizedBox(height: 4),
        Text(
          'Select a career role and roadmap template to get a personalized learning path.',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),
        Text('1. Select Career Role', style: AppTextStyles.titleSmall),
        const SizedBox(height: 8),
        _SearchField(
          controller: _roleSearchController,
          hintText: 'Search career roles...',
          onChanged: (value) => setState(() => _roleQuery = value),
        ),
        const SizedBox(height: 8),
        SizedBox(height: 168, child: _buildRoleGrid(roles)),
        if (_selectedRole != null) ...[
          const SizedBox(height: 16),
          Text('2. Select Roadmap Template', style: AppTextStyles.titleSmall),
          const SizedBox(height: 8),
          _SearchField(
            controller: _templateSearchController,
            hintText: 'Search roadmap templates...',
            onChanged: (value) => setState(() => _templateQuery = value),
          ),
          const SizedBox(height: 8),
          Expanded(child: _buildTemplateList(roadmaps)),
        ] else
          const Spacer(),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Cancel',
                variant: AppButtonVariant.text,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: 'Generate Roadmap',
                leadingIcon: const Icon(Icons.rocket_launch_outlined),
                onPressed: _selectedRoadmapId == null ? null : _generate,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRoleGrid(
    AsyncValue<List<CareerRoleDto>> roles, {
    bool showRoadmapCount = false,
  }) {
    return roles.when(
      loading: () => ListView(
        physics: const NeverScrollableScrollPhysics(),
        children: const [
          SkeletonCard(height: 40),
          SkeletonCard(height: 40),
          SkeletonCard(height: 40),
        ],
      ),
      error: (error, _) => EmptyStateView(
        icon: Icons.error_outline,
        title: 'Could not load career roles',
        subtitle: error.toString(),
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(careerRolesProvider),
      ),
      data: (items) {
        final filtered = _filterRoles(items);
        if (filtered.isEmpty) {
          return const EmptyStateView(
            icon: Icons.search_off_outlined,
            title: 'No roles found',
            subtitle: 'Try a different search term.',
          );
        }
        return GridView.builder(
          itemCount: filtered.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: showRoadmapCount ? 2 : 2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: showRoadmapCount ? 1.45 : 2.35,
          ),
          itemBuilder: (context, index) {
            final role = filtered[index];
            final selected = _selectedRole?.careerRoleId == role.careerRoleId;
            return _GenerateRoleTile(
              role: role,
              selected: selected,
              showRoadmapCount: showRoadmapCount,
              roadmapCount: selected
                  ? ref
                      .watch(roadmapsBySelectedRoleProvider)
                      .valueOrNull
                      ?.length
                  : null,
              onTap: () {
                setState(() {
                  _selectedRole = role;
                  _selectedRoadmapId = null;
                  _templateQuery = '';
                  _templateSearchController.clear();
                });
                ref.read(selectedCareerRoleProvider.notifier).state = role;
              },
            );
          },
        );
      },
    );
  }

  Widget _buildTemplateList(AsyncValue<List<CareerRoadmapDto>> roadmaps) {
    return roadmaps.when(
      loading: () => ListView(
        physics: const NeverScrollableScrollPhysics(),
        children: const [
          SkeletonCard(height: 54),
          SkeletonCard(height: 54),
        ],
      ),
      error: (error, _) => EmptyStateView(
        icon: Icons.error_outline,
        title: 'Could not load templates',
        subtitle: error.toString(),
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(roadmapsBySelectedRoleProvider),
      ),
      data: (items) {
        final filtered = _filterRoadmaps(items);
        if (filtered.isEmpty) {
          return const EmptyStateView(
            icon: Icons.search_off_outlined,
            title: 'No roadmap templates',
            subtitle: 'Try a different template search.',
          );
        }
        return ListView.separated(
          itemCount: filtered.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final roadmap = filtered[index];
            return _GenerateRoadmapTile(
              roadmap: roadmap,
              selected: _selectedRoadmapId == roadmap.careerRoadmapId,
              onTap: () => setState(
                () => _selectedRoadmapId = roadmap.careerRoadmapId,
              ),
            );
          },
        );
      },
    );
  }

  List<CareerRoleDto> _filterRoles(List<CareerRoleDto> roles) {
    final query = _roleQuery.trim().toLowerCase();
    if (query.isEmpty) return roles;
    return roles
        .where(
          (role) =>
              role.name.toLowerCase().contains(query) ||
              (role.description ?? '').toLowerCase().contains(query),
        )
        .toList();
  }

  List<CareerRoadmapDto> _filterRoadmaps(List<CareerRoadmapDto> roadmaps) {
    final query = _templateQuery.trim().toLowerCase();
    if (query.isEmpty) return roadmaps;
    return roadmaps
        .where(
          (roadmap) =>
              roadmap.name.toLowerCase().contains(query) ||
              (roadmap.description ?? '').toLowerCase().contains(query),
        )
        .toList();
  }
}

class _CustomPersonalRoadmapSheet extends ConsumerStatefulWidget {
  const _CustomPersonalRoadmapSheet();

  @override
  ConsumerState<_CustomPersonalRoadmapSheet> createState() =>
      _CustomPersonalRoadmapSheetState();
}

class _CustomPersonalRoadmapSheetState
    extends ConsumerState<_CustomPersonalRoadmapSheet> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _desireController = TextEditingController();
  CareerRoleDto? _selectedRole;
  final List<_CustomNodeDraft> _nodes = List.generate(
    3,
    (index) => _CustomNodeDraft.blank(order: index + 1),
  );
  final List<_CustomEdgeDraft> _edges = [];
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _desireController.dispose();
    super.dispose();
  }

  bool get _canCreate =>
      !_isSaving &&
      _selectedRole != null &&
      _nameController.text.trim().isNotEmpty &&
      _nodes.any((node) => node.name.trim().isNotEmpty);

  Future<void> _save() async {
    if (!_canCreate) return;
    setState(() => _isSaving = true);
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final roadmap =
          await ref.read(roadmapRepositoryProvider).createCustomRoadmap(
                CustomPersonalRoadmapRequest(
                  profileId: profileId,
                  careerRoleId: _selectedRole!.careerRoleId,
                  name: _nameController.text.trim(),
                  description: _descriptionController.text.trim(),
                  desire: _desireController.text.trim(),
                  steps: _buildStepRequests(),
                ),
              );
      ref.invalidate(personalRoadmapsProvider);
      ref.invalidate(dashboardDataProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _addOrEditNode({_CustomNodeDraft? node}) async {
    final existingIndex = node == null ? -1 : _nodes.indexOf(node);
    final result = await showModalBottomSheet<_CustomNodeDraft>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _CustomNodeEditorSheet(
        node: node,
        availableParents: _nodes.where((item) => item != node).toList(),
        order: existingIndex >= 0 ? node!.order : _nodes.length + 1,
      ),
    );
    if (result == null) return;

    setState(() {
      if (existingIndex >= 0) {
        _nodes[existingIndex] = result;
        _edges.removeWhere((edge) =>
            edge.fromClientId == result.clientId &&
            edge.toClientId == result.clientId);
      } else {
        _nodes.add(result);
        _CustomNodeDraft? previousRoot;
        for (final item in _nodes) {
          if (item.clientId != result.clientId && item.parentClientId == null) {
            previousRoot = item;
          }
        }
        if (result.parentClientId == null && previousRoot != null) {
          _edges.add(_CustomEdgeDraft(
            fromClientId: previousRoot.clientId,
            toClientId: result.clientId,
          ));
        }
      }
    });
  }

  void _removeNode(_CustomNodeDraft node) {
    setState(() {
      _nodes.remove(node);
      _edges.removeWhere((edge) =>
          edge.fromClientId == node.clientId ||
          edge.toClientId == node.clientId);
      for (final draft
          in _nodes.where((item) => item.parentClientId == node.clientId)) {
        draft.parentClientId = null;
      }
    });
  }

  List<CustomRoadmapStepRequest> _buildStepRequests() {
    final validNodes =
        _nodes.where((node) => node.name.trim().isNotEmpty).toList();
    return [
      for (var index = 0; index < validNodes.length; index++)
        validNodes[index].toRequest(
          previousStepIndex: _previousStepIndex(validNodes, validNodes[index]),
          branchStepIndex: _branchStepIndex(validNodes, validNodes[index]),
        ),
    ];
  }

  int? _previousStepIndex(
      List<_CustomNodeDraft> validNodes, _CustomNodeDraft node) {
    if (node.parentClientId != null) return null;
    for (final edge in _edges) {
      if (edge.toClientId != node.clientId) continue;
      final index = validNodes.indexWhere(
        (candidate) => candidate.clientId == edge.fromClientId,
      );
      if (index >= 0) return index;
    }
    return null;
  }

  int? _branchStepIndex(
      List<_CustomNodeDraft> validNodes, _CustomNodeDraft node) {
    final parentClientId = node.parentClientId;
    if (parentClientId == null) return null;
    final index = validNodes.indexWhere(
      (candidate) => candidate.clientId == parentClientId,
    );
    return index >= 0 ? index : null;
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);
    return PopScope(
      canPop: !_isSaving,
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            16,
            0,
            16,
            MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.82,
            child: _isSaving
                ? const _GeneratingRoadmapView()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Create Personal Roadmap',
                          style: AppTextStyles.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        'Shape a learning path around your own goal and steps.',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Expanded(
                        child: ListView(
                          children: [
                            TextField(
                              controller: _nameController,
                              onChanged: (_) => setState(() {}),
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(
                                labelText: 'Roadmap name',
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _descriptionController,
                              decoration: const InputDecoration(
                                labelText: 'Description',
                                hintText: 'Short summary for your path',
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _desireController,
                              minLines: 3,
                              maxLines: 4,
                              decoration: const InputDecoration(
                                labelText: 'Your desire or goal',
                                hintText:
                                    'What are you trying to become or build?',
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text('Career role',
                                style: AppTextStyles.titleSmall),
                            const SizedBox(height: 8),
                            roles.when(
                              loading: () => const SkeletonCard(height: 56),
                              error: (error, _) => EmptyStateView(
                                icon: Icons.error_outline,
                                title: 'Could not load career roles',
                                subtitle: error.toString(),
                                actionLabel: 'Retry',
                                onAction: () =>
                                    ref.invalidate(careerRolesProvider),
                              ),
                              data: (items) => DropdownMenu<CareerRoleDto>(
                                width: double.infinity,
                                initialSelection: _selectedRole,
                                label: const Text('Select role'),
                                onSelected: (value) =>
                                    setState(() => _selectedRole = value),
                                dropdownMenuEntries: items
                                    .map(
                                      (role) => DropdownMenuEntry(
                                        value: role,
                                        label: role.name,
                                      ),
                                    )
                                    .toList(),
                              ),
                            ),
                            const SizedBox(height: 18),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.primaryContainer
                                    .withValues(alpha: 0.45),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.25,
                                  ),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Start with Learning Step milestones',
                                    style: AppTextStyles.labelLarge.copyWith(
                                      color: AppColors.onPrimaryContainer,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Build the main roadmap path first. Add branch nodes for side topics, references, and optional details.',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 18),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Learning steps',
                                    style: AppTextStyles.titleSmall,
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: () => _addOrEditNode(),
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add Step'),
                                ),
                              ],
                            ),
                            if (_nodes.isEmpty)
                              const EmptyStateView(
                                icon: Icons.account_tree_outlined,
                                title: 'No steps yet',
                                subtitle:
                                    'Add learning steps or branch nodes to define your roadmap.',
                              )
                            else
                              ..._nodes.map(
                                (node) => _CustomNodeDraftCard(
                                  node: node,
                                  parentName: _parentName(node.parentClientId),
                                  onEdit: () => _addOrEditNode(node: node),
                                  onDelete: () => _removeNode(node),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: AppButton(
                              label: 'Cancel',
                              variant: AppButtonVariant.text,
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppButton(
                              label: 'Create Roadmap',
                              leadingIcon: const Icon(Icons.add_task_outlined),
                              onPressed: _canCreate ? _save : null,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  String? _parentName(String? parentClientId) {
    if (parentClientId == null) return null;
    for (final node in _nodes) {
      if (node.clientId == parentClientId) return node.name;
    }
    return null;
  }
}

class _CustomNodeDraft {
  _CustomNodeDraft({
    required this.clientId,
    this.parentClientId,
    required this.name,
    this.description,
    required this.order,
    this.skillIds = const [],
    this.resources = const [],
  });

  _CustomNodeDraft.blank({required this.order})
      : clientId = '${DateTime.now().microsecondsSinceEpoch}$order',
        parentClientId = null,
        name = '',
        description = null,
        skillIds = const [],
        resources = const [];

  final String clientId;
  String? parentClientId;
  final String name;
  final String? description;
  final int order;
  final List<String> skillIds;
  final List<_CustomResourceDraft> resources;

  CustomRoadmapStepRequest toRequest({
    int? previousStepIndex,
    int? branchStepIndex,
  }) =>
      CustomRoadmapStepRequest(
        name: name.trim(),
        description: description,
        previousStepIndex: previousStepIndex,
        branchStepIndex: branchStepIndex,
        positionX: parentClientId == null ? 120 : 360,
        positionY: order * 140,
        technicalSkillIds:
            skillIds.where((skillId) => skillId.trim().isNotEmpty).toList(),
        learningResources:
            resources.map((resource) => resource.toRequest()).toList(),
      );
}

class _CustomResourceDraft {
  const _CustomResourceDraft({
    required this.name,
    required this.url,
    this.type = 'Article',
  });

  final String name;
  final String url;
  final String type;

  CustomRoadmapResourceRequest toRequest() => CustomRoadmapResourceRequest(
        name: name.trim(),
        resourceUrl: url.trim(),
        resourceType: type.trim().isEmpty ? 'Article' : type.trim(),
      );
}

class _CustomEdgeDraft {
  const _CustomEdgeDraft({
    required this.fromClientId,
    required this.toClientId,
  });

  final String fromClientId;
  final String toClientId;
}

class _CustomNodeEditorSheet extends ConsumerStatefulWidget {
  const _CustomNodeEditorSheet({
    required this.availableParents,
    required this.order,
    this.node,
  });

  final _CustomNodeDraft? node;
  final List<_CustomNodeDraft> availableParents;
  final int order;

  @override
  ConsumerState<_CustomNodeEditorSheet> createState() =>
      _CustomNodeEditorSheetState();
}

class _CustomNodeEditorSheetState
    extends ConsumerState<_CustomNodeEditorSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _skillSearchController;
  late final TextEditingController _resourceNameController;
  late final TextEditingController _resourceUrlController;
  late final TextEditingController _resourceTypeController;
  String? _parentClientId;
  late List<String> _selectedSkills;
  late List<_CustomResourceDraft> _resources;
  String _skillQuery = '';

  @override
  void initState() {
    super.initState();
    final node = widget.node;
    _nameController = TextEditingController(text: node?.name ?? '');
    _descriptionController =
        TextEditingController(text: node?.description ?? '');
    _skillSearchController = TextEditingController();
    _resourceNameController = TextEditingController();
    _resourceUrlController = TextEditingController();
    _resourceTypeController = TextEditingController(text: 'Article');
    _parentClientId = node?.parentClientId;
    _selectedSkills = [...?node?.skillIds];
    _resources = [...?node?.resources];
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _skillSearchController.dispose();
    _resourceNameController.dispose();
    _resourceUrlController.dispose();
    _resourceTypeController.dispose();
    super.dispose();
  }

  void _toggleSkill(String skillId) {
    if (skillId.trim().isEmpty) return;
    setState(() {
      if (_selectedSkills.contains(skillId)) {
        _selectedSkills.remove(skillId);
      } else {
        _selectedSkills.add(skillId);
      }
      _skillSearchController.clear();
      _skillQuery = '';
    });
  }

  void _removeSkill(String skillId) {
    setState(() => _selectedSkills.remove(skillId));
  }

  void _addResource() {
    final name = _resourceNameController.text.trim();
    final url = _resourceUrlController.text.trim();
    if (name.isEmpty) return;
    setState(() {
      _resources.add(
        _CustomResourceDraft(
          name: name,
          url: url,
          type: _resourceTypeController.text.trim().isEmpty
              ? 'Article'
              : _resourceTypeController.text.trim(),
        ),
      );
      _resourceNameController.clear();
      _resourceUrlController.clear();
      _resourceTypeController.text = 'Article';
    });
  }

  void _save() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    Navigator.of(context).pop(
      _CustomNodeDraft(
        clientId: widget.node?.clientId ??
            DateTime.now().microsecondsSinceEpoch.toString(),
        parentClientId: _parentClientId,
        name: name,
        description: _descriptionController.text.trim(),
        order: widget.node?.order ?? widget.order,
        skillIds: _selectedSkills.toSet().toList(),
        resources: _resources,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final technicalSkills =
        ref.watch(technicalSkillsProvider).valueOrNull ?? const [];
    final selectedSkillItems = technicalSkills
        .where((skill) => _selectedSkills.contains(skill.technicalSkillId))
        .toList();
    final filteredSuggestions = _skillQuery.isEmpty
        ? const <TechnicalSkillDto>[]
        : technicalSkills
            .where((skill) {
              final query = _skillQuery.toLowerCase();
              return skill.skillName.toLowerCase().contains(query) ||
                  skill.category.toLowerCase().contains(query);
            })
            .take(6)
            .toList();

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          0,
          16,
          MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.76,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.node == null ? 'Add Node' : 'Edit Node',
                style: AppTextStyles.titleLarge,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  children: [
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Node name'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _descriptionController,
                      minLines: 2,
                      maxLines: 3,
                      decoration:
                          const InputDecoration(labelText: 'Description'),
                    ),
                    const SizedBox(height: 10),
                    DropdownMenu<String?>(
                      width: double.infinity,
                      initialSelection: _parentClientId,
                      label: const Text('Parent node'),
                      onSelected: (value) =>
                          setState(() => _parentClientId = value),
                      dropdownMenuEntries: [
                        const DropdownMenuEntry<String?>(
                          value: null,
                          label: 'No parent',
                        ),
                        ...widget.availableParents.map(
                          (node) => DropdownMenuEntry<String?>(
                            value: node.clientId,
                            label: node.name,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text('Technical skills', style: AppTextStyles.titleSmall),
                    const SizedBox(height: 8),
                    if (selectedSkillItems.isNotEmpty) ...[
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: selectedSkillItems
                            .map(
                              (skill) => InputChip(
                                label: Text(skill.skillName),
                                onDeleted: () =>
                                    _removeSkill(skill.technicalSkillId),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 10),
                    ],
                    TextField(
                      controller: _skillSearchController,
                      decoration: const InputDecoration(
                        labelText: 'Search and add skills...',
                        prefixIcon: Icon(Icons.search),
                        hintText: 'Type to search skills',
                      ),
                      onChanged: (value) =>
                          setState(() => _skillQuery = value.trim()),
                      onSubmitted: (value) {
                        if (filteredSuggestions.length == 1) {
                          _toggleSkill(
                            filteredSuggestions.first.technicalSkillId,
                          );
                        }
                      },
                    ),
                    if (filteredSuggestions.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Material(
                        color: AppColors.surfaceContainerLowest,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: const BorderSide(
                            color: AppColors.outlineVariant,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: filteredSuggestions.map(
                            (skill) {
                              final selected = _selectedSkills
                                  .contains(skill.technicalSkillId);
                              return ListTile(
                                dense: true,
                                title: Text(skill.skillName),
                                subtitle: Text(skill.category),
                                trailing:
                                    selected ? const Icon(Icons.check) : null,
                                selected: selected,
                                onTap: () => _toggleSkill(
                                  skill.technicalSkillId,
                                ),
                              );
                            },
                          ).toList(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Text('Learning resources', style: AppTextStyles.titleSmall),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _resourceNameController,
                      decoration:
                          const InputDecoration(labelText: 'Resource name'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _resourceUrlController,
                      keyboardType: TextInputType.url,
                      decoration:
                          const InputDecoration(labelText: 'Resource URL'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _resourceTypeController,
                      decoration:
                          const InputDecoration(labelText: 'Resource type'),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: _addResource,
                        icon: const Icon(Icons.add_link),
                        label: const Text('Add Resource'),
                      ),
                    ),
                    ..._resources.map(
                      (resource) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.link),
                        title: Text(resource.name),
                        subtitle: Text(resource.url),
                        trailing: IconButton(
                          tooltip: 'Remove resource',
                          icon: const Icon(Icons.close),
                          onPressed: () =>
                              setState(() => _resources.remove(resource)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AppButton(
                      label: 'Cancel',
                      variant: AppButtonVariant.text,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppButton(
                      label: 'Save Node',
                      onPressed:
                          _nameController.text.trim().isEmpty ? null : _save,
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
}

class _CustomNodeDraftCard extends StatelessWidget {
  const _CustomNodeDraftCard({
    required this.node,
    required this.onEdit,
    required this.onDelete,
    this.parentName,
  });

  final _CustomNodeDraft node;
  final String? parentName;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(
          parentName == null
              ? Icons.account_tree_outlined
              : Icons.subdirectory_arrow_right,
        ),
        title:
            Text(node.name.trim().isEmpty ? 'Step ${node.order}' : node.name),
        subtitle: Text(
          [
            if (parentName != null) 'Branch of $parentName',
            if (node.skillIds.isNotEmpty) '${node.skillIds.length} skills',
            if (node.resources.isNotEmpty) '${node.resources.length} resources',
          ].join(' · '),
        ),
        trailing: Wrap(
          spacing: 4,
          children: [
            IconButton(
              tooltip: 'Edit node',
              onPressed: onEdit,
              icon: const Icon(Icons.edit_outlined),
            ),
            IconButton(
              tooltip: 'Delete node',
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.controller,
    required this.hintText,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: const Icon(Icons.search),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      ),
    );
  }
}

class _GeneratingRoadmapView extends StatelessWidget {
  const _GeneratingRoadmapView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(strokeWidth: 4),
            ),
            SizedBox(height: 24),
            Text(
              'Building your roadmap...',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _GenerateRoleTile extends StatelessWidget {
  const _GenerateRoleTile({
    required this.role,
    required this.selected,
    required this.onTap,
    this.showRoadmapCount = false,
    this.roadmapCount,
  });

  final CareerRoleDto role;
  final bool selected;
  final VoidCallback onTap;
  final bool showRoadmapCount;
  final int? roadmapCount;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primaryContainer.withValues(alpha: 0.24)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.outline,
            width: 2,
          ),
        ),
        alignment: Alignment.centerLeft,
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (showRoadmapCount) ...[
                    Icon(
                      Icons.work_outline,
                      color: selected ? AppColors.primary : AppColors.onSurface,
                    ),
                    const SizedBox(height: 6),
                  ],
                  Text(
                    role.name,
                    maxLines: showRoadmapCount ? 2 : 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign:
                        showRoadmapCount ? TextAlign.center : TextAlign.start,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: selected ? AppColors.primary : AppColors.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (showRoadmapCount) ...[
                    const SizedBox(height: 4),
                    Text(
                      roadmapCount == null
                          ? 'Roadmaps'
                          : '$roadmapCount roadmaps',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (selected)
              const Positioned(
                top: 0,
                right: 0,
                child: Icon(
                  Icons.check_circle,
                  size: 18,
                  color: AppColors.primary,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _GenerateRoadmapTile extends StatelessWidget {
  const _GenerateRoadmapTile({
    required this.roadmap,
    required this.selected,
    required this.onTap,
  });

  final CareerRoadmapDto roadmap;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primaryContainer.withValues(alpha: 0.24)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.outline,
            width: 2,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              roadmap.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodyMedium.copyWith(
                color: selected ? AppColors.primary : AppColors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            if ((roadmap.description ?? '').isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                roadmap.description!,
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
    );
  }
}

class _RoadmapControls extends StatelessWidget {
  const _RoadmapControls({
    required this.filter,
    required this.sort,
    required this.tagFilter,
    required this.tagOptions,
    required this.onFilterChanged,
    required this.onSortChanged,
    required this.onTagFilterChanged,
  });

  final _RoadmapFilter filter;
  final _RoadmapSort sort;
  final String tagFilter;
  final List<String> tagOptions;
  final ValueChanged<_RoadmapFilter> onFilterChanged;
  final ValueChanged<_RoadmapSort> onSortChanged;
  final ValueChanged<String> onTagFilterChanged;

  @override
  Widget build(BuildContext context) {
    return AppFilterBar(
      children: [
        AppFilterSelect<_RoadmapFilter>(
          label: 'Status',
          valueLabel: filter.label,
          icon: Icons.tune_outlined,
          onSelected: onFilterChanged,
          options: _RoadmapFilter.values
              .map(
                (value) => AppFilterOption(
                  value: value,
                  label: value.label,
                ),
              )
              .toList(),
        ),
        AppFilterSelect<_RoadmapSort>(
          label: 'Sort',
          valueLabel: sort.label,
          icon: Icons.sort_outlined,
          onSelected: onSortChanged,
          options: _RoadmapSort.values
              .map(
                (value) => AppFilterOption(
                  value: value,
                  label: value.label,
                ),
              )
              .toList(),
        ),
        AppFilterSelect<String>(
          label: 'Tag',
          valueLabel: tagFilter.isEmpty ? 'All Tags' : tagFilter,
          icon: Icons.sell_outlined,
          onSelected: onTagFilterChanged,
          options: [
            const AppFilterOption(value: '', label: 'All Tags'),
            ...tagOptions.map(
              (value) => AppFilterOption(value: value, label: value),
            ),
          ],
        ),
      ],
    );
  }
}

class _RoadmapTagWrap extends StatelessWidget {
  const _RoadmapTagWrap({required this.tags});

  final List<RoadmapTagDto> tags;

  @override
  Widget build(BuildContext context) {
    if (tags.isEmpty) {
      return Text(
        'No tags',
        style: AppTextStyles.labelSmall.copyWith(
          color: AppColors.onSurfaceVariant,
        ),
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: tags.map((tag) => _RoadmapTagChip(tag: tag)).toList(),
    );
  }
}

class _RoadmapTagChip extends StatelessWidget {
  const _RoadmapTagChip({required this.tag, this.onDeleted});

  final RoadmapTagDto tag;
  final VoidCallback? onDeleted;

  @override
  Widget build(BuildContext context) {
    final color = _tagColor(tag.color);
    final foreground = color ?? AppColors.onSurfaceVariant;
    final background = color?.withValues(alpha: 0.14) ??
        AppColors.surfaceContainerHighest.withValues(alpha: 0.7);
    final border = color?.withValues(alpha: 0.38) ?? AppColors.outlineVariant;

    return Container(
      padding: EdgeInsets.fromLTRB(8, 4, onDeleted == null ? 8 : 4, 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sell_outlined, size: 13, color: foreground),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 160),
            child: Text(
              tag.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.labelSmall.copyWith(color: foreground),
            ),
          ),
          if (onDeleted != null) ...[
            const SizedBox(width: 2),
            InkWell(
              onTap: onDeleted,
              borderRadius: BorderRadius.circular(999),
              child: Padding(
                padding: const EdgeInsets.all(2),
                child: Icon(Icons.close, size: 13, color: foreground),
              ),
            ),
          ],
        ],
      ),
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
    required this.onManageTags,
  });

  final PersonalRoadmapDto roadmap;
  final bool isMutating;
  final VoidCallback onOpen;
  final VoidCallback onToggleActive;
  final VoidCallback onDelete;
  final VoidCallback onManageTags;

  @override
  Widget build(BuildContext context) {
    final progress = roadmap.progressPercentage.round();
    final progressColor = _progressColor(progress);
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
                        if ((roadmap.note ?? '').isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainer,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.edit_note_outlined,
                                  size: 18,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    roadmap.note!,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    enabled: !isMutating,
                    onSelected: (value) {
                      if (value == 'tags') onManageTags();
                      if (value == 'delete') onDelete();
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'tags',
                        child: Row(
                          children: [
                            Icon(Icons.sell_outlined),
                            SizedBox(width: 8),
                            Text('Manage Tags'),
                          ],
                        ),
                      ),
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
                  Text(
                    '$progress%',
                    style: AppTextStyles.titleSmall.copyWith(
                      color: progressColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressBar(value: progress / 100, color: progressColor),
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
              const SizedBox(height: 10),
              _RoadmapTagWrap(tags: roadmap.tags),
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

Color _progressColor(int progress) {
  if (progress >= 70) return AppColors.success;
  if (progress >= 30) return AppColors.primary;
  return AppColors.onSurfaceVariant;
}

class _TagManagerSheet extends ConsumerStatefulWidget {
  const _TagManagerSheet({required this.roadmap});

  final PersonalRoadmapDto roadmap;

  @override
  ConsumerState<_TagManagerSheet> createState() => _TagManagerSheetState();
}

class _TagManagerSheetState extends ConsumerState<_TagManagerSheet> {
  late List<RoadmapTagDto> _tags;
  final _controller = TextEditingController();
  String _selectedColor = _tagPalette.first;
  bool _isSaving = false;
  String? _deletingId;

  @override
  void initState() {
    super.initState();
    _tags = [...widget.roadmap.tags];
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _addTag() async {
    final name = _controller.text.trim();
    if (name.isEmpty || _isSaving) return;

    setState(() => _isSaving = true);
    try {
      final tag = await ref.read(roadmapRepositoryProvider).addRoadmapTag(
            widget.roadmap.personalRoadmapId,
            name: name,
            color: _selectedColor,
          );
      setState(() {
        _tags = [..._tags, tag];
        _controller.clear();
      });
      _refreshRoadmaps();
      if (mounted) AppSnackbar.showSuccess(context, 'Tag added');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _deleteTag(RoadmapTagDto tag) async {
    if (_deletingId != null) return;

    setState(() => _deletingId = tag.roadmapTagId);
    try {
      await ref.read(roadmapRepositoryProvider).deleteRoadmapTag(
            widget.roadmap.personalRoadmapId,
            tag.roadmapTagId,
          );
      setState(() {
        _tags = _tags
            .where((item) => item.roadmapTagId != tag.roadmapTagId)
            .toList();
      });
      _refreshRoadmaps();
      if (mounted) AppSnackbar.showSuccess(context, 'Tag removed');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _deletingId = null);
    }
  }

  void _refreshRoadmaps() {
    ref.invalidate(personalRoadmapsProvider);
    ref.invalidate(dashboardDataProvider);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          0,
          16,
          MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Manage Tags', style: AppTextStyles.titleLarge),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              Text(
                _title(widget.roadmap),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 14),
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
                        (tag) => Opacity(
                          opacity: _deletingId == tag.roadmapTagId ? 0.5 : 1,
                          child: _RoadmapTagChip(
                            tag: tag,
                            onDeleted: () => _deleteTag(tag),
                          ),
                        ),
                      )
                      .toList(),
                ),
              const SizedBox(height: 18),
              TextField(
                controller: _controller,
                maxLength: 100,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                  labelText: 'Tag name',
                  prefixIcon: Icon(Icons.sell_outlined),
                ),
                onSubmitted: (_) => _addTag(),
              ),
              const SizedBox(height: 8),
              Text(
                'Color',
                style: AppTextStyles.labelMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _tagPalette.map((color) {
                  final selected = color == _selectedColor;
                  return InkWell(
                    onTap: () => setState(() => _selectedColor = color),
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: _tagColor(color),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: selected ? AppColors.onSurface : Colors.white,
                          width: selected ? 3 : 2,
                        ),
                      ),
                      child: selected
                          ? const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 18,
                            )
                          : null,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              AppButton(
                label: _isSaving ? 'Adding...' : 'Add Tag',
                leadingIcon: const Icon(Icons.sell_outlined),
                onPressed: _isSaving ? null : _addTag,
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

enum _RoadmapSortKey { name, progress, tag, createdAt }

enum _RoadmapSort {
  createdNewest('Date Added: Newest', _RoadmapSortKey.createdAt, true),
  createdOldest('Date Added: Oldest', _RoadmapSortKey.createdAt, false),
  nameAsc('Name: A-Z', _RoadmapSortKey.name, false),
  tagAsc('Tag: A-Z', _RoadmapSortKey.tag, false),
  progressDesc('Progress: High-Low', _RoadmapSortKey.progress, true),
  progressAsc('Progress: Low-High', _RoadmapSortKey.progress, false);

  const _RoadmapSort(this.label, this.key, this.descending);
  final String label;
  final _RoadmapSortKey key;
  final bool descending;
}

String _title(PersonalRoadmapDto roadmap) =>
    roadmap.careerRoadmap?.name ?? 'Personal Roadmap';

String _firstTag(PersonalRoadmapDto roadmap) {
  if (roadmap.tags.isEmpty) return 'zzzz';
  final tags = roadmap.tags.map((tag) => tag.name.toLowerCase()).toList()
    ..sort();
  return tags.first;
}

const _tagPalette = [
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

Color? _tagColor(String? value) {
  final normalized = value?.trim().replaceFirst('#', '');
  if (normalized == null || normalized.length != 6) return null;
  final colorValue = int.tryParse(normalized, radix: 16);
  if (colorValue == null) return null;
  return Color(0xFF000000 | colorValue);
}

String _dateLabel(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return '';
  return '${parsed.day}/${parsed.month}/${parsed.year}';
}
