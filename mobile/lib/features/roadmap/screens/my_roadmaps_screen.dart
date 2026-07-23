import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
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
            tooltip: 'Create personal roadmap',
            icon: const Icon(Icons.add_task_outlined),
            onPressed: _showRoadmapActionSheet,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRoadmapActionSheet,
        icon: const Icon(Icons.rocket_launch_outlined),
        label: const Text('Generate Roadmap'),
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
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
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
      builder: (_) => const _RoadmapGenerationSheet(
        mode: _RoadmapCreateMode.fromTemplate,
      ),
    );
  }

  Future<void> _showCreatePersonalRoadmapSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _RoadmapGenerationSheet(
        mode: _RoadmapCreateMode.personal,
      ),
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
      final title = _title(roadmap).toLowerCase();
      final description =
          (roadmap.careerRoadmap?.description ?? '').toLowerCase();
      final note = (roadmap.note ?? '').toLowerCase();
      final matchesSearch = _query.isEmpty ||
          title.contains(_query) ||
          description.contains(_query) ||
          note.contains(_query) ||
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

enum _RoadmapCreateMode { fromTemplate, personal }

enum _PersonalRoadmapStep { selectRole, confirm }

class _RoadmapGenerationSheet extends ConsumerStatefulWidget {
  const _RoadmapGenerationSheet({required this.mode});

  final _RoadmapCreateMode mode;

  @override
  ConsumerState<_RoadmapGenerationSheet> createState() =>
      _RoadmapGenerationSheetState();
}

class _RoadmapGenerationSheetState
    extends ConsumerState<_RoadmapGenerationSheet> {
  final _roleSearchController = TextEditingController();
  final _templateSearchController = TextEditingController();
  final _noteController = TextEditingController();
  CareerRoleDto? _selectedRole;
  String? _selectedRoadmapId;
  String _roleQuery = '';
  String _templateQuery = '';
  _PersonalRoadmapStep _personalStep = _PersonalRoadmapStep.selectRole;
  bool _isGenerating = false;

  bool get _isPersonal => widget.mode == _RoadmapCreateMode.personal;

  @override
  void dispose() {
    _roleSearchController.dispose();
    _templateSearchController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    final personalTemplates = _isPersonal
        ? ref.read(roadmapsBySelectedRoleProvider).valueOrNull
        : null;
    final careerRoadmapId = _selectedRoadmapId ??
        (personalTemplates == null || personalTemplates.isEmpty
            ? null
            : personalTemplates.first.careerRoadmapId);
    if (careerRoadmapId == null || _isGenerating) return;

    setState(() => _isGenerating = true);
    try {
      final profileId = await ref.read(profileIdProvider.future);
      final roadmap = await ref.read(roadmapRepositoryProvider).generateRoadmap(
            profileId,
            careerRoadmapId,
            note: _isPersonal ? _noteController.text : null,
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
                : _isPersonal
                    ? _buildPersonalFlow(roles, roadmaps)
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

  Widget _buildPersonalFlow(
    AsyncValue<List<CareerRoleDto>> roles,
    AsyncValue<List<CareerRoadmapDto>> roadmaps,
  ) {
    final selectedRole = _selectedRole;
    final roadmapCount = roadmaps.valueOrNull?.length;
    final canGenerate = selectedRole != null &&
        (roadmaps.isLoading || (roadmaps.valueOrNull?.isNotEmpty ?? false));

    if (_personalStep == _PersonalRoadmapStep.confirm && selectedRole != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SheetHeader(
            title: 'Create Personal Roadmap',
            subtitle: 'Review and confirm your selection',
            onClose: () => Navigator.of(context).pop(),
          ),
          const SizedBox(height: 16),
          const _StepIndicator(confirming: true),
          const SizedBox(height: 16),
          _SelectedPersonalRoleCard(
            role: selectedRole,
            roadmapCount: roadmapCount,
          ),
          const SizedBox(height: 16),
          Text('Personal note (optional)', style: AppTextStyles.titleSmall),
          const SizedBox(height: 8),
          TextField(
            controller: _noteController,
            minLines: 4,
            maxLines: 5,
            textInputAction: TextInputAction.newline,
            decoration: const InputDecoration(
              hintText: 'Add any specific goals or preferences...',
            ),
          ),
          if (roadmaps.hasError) ...[
            const SizedBox(height: 8),
            Text(
              'Could not load roadmap templates for this role.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
            ),
          ] else if (roadmaps.valueOrNull?.isEmpty ?? false) ...[
            const SizedBox(height: 8),
            Text(
              'No roadmap templates for this role.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
            ),
          ],
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Back',
                  variant: AppButtonVariant.text,
                  leadingIcon: const Icon(Icons.arrow_back),
                  onPressed: () => setState(
                    () => _personalStep = _PersonalRoadmapStep.selectRole,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppButton(
                  label: roadmaps.isLoading ? 'Loading...' : 'Generate Roadmap',
                  leadingIcon: const Icon(Icons.rocket_launch_outlined),
                  onPressed:
                      canGenerate && !roadmaps.isLoading ? _generate : null,
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SheetHeader(
          title: 'Create Personal Roadmap',
          subtitle: 'Select a career role to get started',
          onClose: () => Navigator.of(context).pop(),
        ),
        const SizedBox(height: 16),
        const _StepIndicator(confirming: false),
        const SizedBox(height: 16),
        _SearchField(
          controller: _roleSearchController,
          hintText: 'Search career roles...',
          onChanged: (value) => setState(() => _roleQuery = value),
        ),
        const SizedBox(height: 12),
        Expanded(child: _buildRoleGrid(roles, showRoadmapCount: true)),
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
                label: 'Next',
                leadingIcon: const Icon(Icons.chevron_right),
                onPressed: selectedRole == null
                    ? null
                    : () => setState(
                          () => _personalStep = _PersonalRoadmapStep.confirm,
                        ),
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

class _SheetHeader extends StatelessWidget {
  const _SheetHeader({
    required this.title,
    required this.subtitle,
    required this.onClose,
  });

  final String title;
  final String subtitle;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTextStyles.titleLarge),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Close',
          onPressed: onClose,
          icon: const Icon(Icons.close),
        ),
      ],
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.confirming});

  final bool confirming;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StepPill(
          label: 'Select Role',
          value: confirming ? Icons.check : null,
          active: true,
          complete: confirming,
        ),
        Expanded(
          child: Container(
            height: 1,
            color: confirming ? AppColors.success : AppColors.outlineVariant,
          ),
        ),
        _StepPill(
          label: 'Confirm',
          value: null,
          active: confirming,
          complete: false,
          number: 2,
        ),
      ],
    );
  }
}

class _StepPill extends StatelessWidget {
  const _StepPill({
    required this.label,
    required this.active,
    required this.complete,
    this.value,
    this.number = 1,
  });

  final String label;
  final bool active;
  final bool complete;
  final IconData? value;
  final int number;

  @override
  Widget build(BuildContext context) {
    final color = complete
        ? AppColors.success
        : active
            ? AppColors.primary
            : AppColors.outline;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active || complete ? color : Colors.transparent,
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 2),
          ),
          child: value == null
              ? Text(
                  number.toString(),
                  style: AppTextStyles.labelSmall.copyWith(
                    color: active || complete ? Colors.white : color,
                  ),
                )
              : Icon(value, size: 16, color: Colors.white),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(
            color: active || complete ? color : AppColors.onSurfaceVariant,
          ),
        ),
      ],
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

class _SelectedPersonalRoleCard extends StatelessWidget {
  const _SelectedPersonalRoleCard({
    required this.role,
    required this.roadmapCount,
  });

  final CareerRoleDto role;
  final int? roadmapCount;

  @override
  Widget build(BuildContext context) {
    const phases = ['Fundamentals', 'Core Skills', 'Projects'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer.withValues(alpha: 0.24),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.work_outline, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  role.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.titleSmall.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            roadmapCount == null
                ? 'Loading roadmap options...'
                : '$roadmapCount roadmap template${roadmapCount == 1 ? '' : 's'} available',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: phases
                .map(
                  (phase) => Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.outlineVariant),
                    ),
                    child: Text(phase, style: AppTextStyles.labelSmall),
                  ),
                )
                .toList(),
          ),
        ],
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
