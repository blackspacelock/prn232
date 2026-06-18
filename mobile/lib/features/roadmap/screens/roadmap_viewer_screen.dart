import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/roadmap_node_card.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/roadmap_providers.dart';

class RoadmapViewerScreen extends ConsumerWidget {
  const RoadmapViewerScreen({super.key, required this.personalRoadmapId});

  final String personalRoadmapId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roadmap = ref.watch(personalRoadmapDetailProvider(personalRoadmapId));

    return Scaffold(
      body: roadmap.when(
        loading: () => const _RoadmapSkeleton(),
        error: (error, _) => CustomScrollView(
          slivers: [
            const SliverAppBar(title: Text('Roadmap')),
            SliverFillRemaining(
              child: EmptyStateView(
                icon: Icons.error_outline,
                title: 'Could not load roadmap',
                subtitle: error.toString(),
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(
                  personalRoadmapDetailProvider(personalRoadmapId),
                ),
              ),
            ),
          ],
        ),
        data: (data) {
          final nodes = [
            ...data.nodeProgresses,
          ]..sort((a, b) => (a.node?.order ?? 0).compareTo(b.node?.order ?? 0));
          final completed = nodes.where((node) => node.status == 4).length;
          final phases = _buildPhases(nodes);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 210,
                title: Text(data.careerRoadmap?.name ?? 'Roadmap'),
                flexibleSpace: FlexibleSpaceBar(
                  background: _RoadmapHeader(
                    roadmap: data,
                    completedNodes: completed,
                    totalNodes: nodes.length,
                  ),
                ),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(8),
                  child: LinearProgressBar(
                    value: nodes.isEmpty ? 0 : completed / nodes.length,
                    height: 8,
                  ),
                ),
              ),
              if (nodes.isEmpty)
                const SliverFillRemaining(
                  child: EmptyStateView(
                    icon: Icons.map_outlined,
                    title: 'No nodes found',
                    subtitle:
                        'This roadmap does not have milestones to display.',
                  ),
                )
              else
                SliverList.separated(
                  itemCount: phases.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final phase = phases[index];
                    return Padding(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        index == 0 ? 16 : 0,
                        16,
                        index == phases.length - 1 ? 24 : 0,
                      ),
                      child: _PhaseExpansionTile(
                        phase: phase,
                        onNodeTap: (node) => _showNodeSheet(context, ref, node),
                      ),
                    );
                  },
                ),
            ],
          );
        },
      ),
    );
  }

  void _showNodeSheet(
    BuildContext context,
    WidgetRef ref,
    NodeProgressDto nodeProgress,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.68,
        minChildSize: 0.6,
        maxChildSize: 0.92,
        builder: (context, scrollController) => _NodeDetailSheet(
          personalRoadmapId: personalRoadmapId,
          nodeProgress: nodeProgress,
          scrollController: scrollController,
        ),
      ),
    );
  }
}

class _RoadmapHeader extends StatelessWidget {
  const _RoadmapHeader({
    required this.roadmap,
    required this.completedNodes,
    required this.totalNodes,
  });

  final PersonalRoadmapDto roadmap;
  final int completedNodes;
  final int totalNodes;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 88, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            roadmap.careerRoadmap?.name ?? 'Personal Roadmap',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.titleLarge,
          ),
          const SizedBox(height: 6),
          Text(
            roadmap.careerRoadmap?.careerRole?.name ??
                roadmap.careerRoadmap?.description ??
                'Personalized learning path',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const Spacer(),
          Text(
            '$completedNodes of $totalNodes nodes completed',
            style: AppTextStyles.labelLarge.copyWith(
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _PhaseExpansionTile extends StatelessWidget {
  const _PhaseExpansionTile({
    required this.phase,
    required this.onNodeTap,
  });

  final _RoadmapPhase phase;
  final ValueChanged<NodeProgressDto> onNodeTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: ExpansionTile(
        initiallyExpanded: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        collapsedShape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(phase.name, style: AppTextStyles.titleMedium),
        subtitle: Text(
          '${phase.completedCount} of ${phase.nodes.length} completed',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        children: phase.nodes
            .map(
              (node) => Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: RoadmapNodeCard(
                  nodeProgress: node,
                  onTap: () => onNodeTap(node),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _NodeDetailSheet extends ConsumerStatefulWidget {
  const _NodeDetailSheet({
    required this.personalRoadmapId,
    required this.nodeProgress,
    required this.scrollController,
  });

  final String personalRoadmapId;
  final NodeProgressDto nodeProgress;
  final ScrollController scrollController;

  @override
  ConsumerState<_NodeDetailSheet> createState() => _NodeDetailSheetState();
}

class _NodeDetailSheetState extends ConsumerState<_NodeDetailSheet> {
  late int _status;
  late final TextEditingController _noteController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.nodeProgress.status;
    _noteController = TextEditingController(text: widget.nodeProgress.note);
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      final note = _noteController.text.trim();
      await ref.read(roadmapRepositoryProvider).updateNodeStatus(
            widget.nodeProgress.nodeProgressId,
            _status,
            note: note.isEmpty ? null : note,
          );
      ref.invalidate(
        personalRoadmapDetailProvider(widget.personalRoadmapId),
      );
      ref.invalidate(dashboardDataProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      AppSnackbar.showSuccess(context, 'Milestone updated');
    } catch (error) {
      if (!mounted) return;
      AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final node = widget.nodeProgress.node;

    return ListView(
      controller: widget.scrollController,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Text(
          node?.name ?? 'Roadmap milestone',
          style: AppTextStyles.headlineMedium,
        ),
        if (node?.description != null) ...[
          const SizedBox(height: 8),
          Text(
            node!.description!,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 24),
        Text('Status', style: AppTextStyles.titleSmall),
        const SizedBox(height: 10),
        _NodeStatusSegmentedButton(
          selectedStatus: _status,
          onChanged: (status) => setState(() => _status = status),
        ),
        const SizedBox(height: 20),
        AppTextField(
          controller: _noteController,
          label: 'Note',
          minLines: 3,
          maxLines: 5,
          textInputAction: TextInputAction.newline,
        ),
        const SizedBox(height: 20),
        AppButton(
          label: 'Learning Resources',
          variant: AppButtonVariant.outlined,
          leadingIcon: const Icon(Icons.menu_book_outlined),
          onPressed: () {
            Navigator.of(context).pop();
            context.go(
              '/roadmap/${widget.personalRoadmapId}/node/${widget.nodeProgress.nodeId}/resources',
            );
          },
        ),
        const SizedBox(height: 12),
        AppButton(
          label: 'Save',
          isLoading: _isSaving,
          onPressed: _isSaving ? null : _save,
        ),
      ],
    );
  }
}

class _NodeStatusSegmentedButton extends StatelessWidget {
  const _NodeStatusSegmentedButton({
    required this.selectedStatus,
    required this.onChanged,
  });

  final int selectedStatus;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: nodeStatusColors.entries.map((entry) {
          final selected = selectedStatus == entry.key;
          final colors = entry.value;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => onChanged(entry.key),
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(
                  color: selected ? colors.fill : Colors.transparent,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: selected ? colors.stroke : AppColors.outlineVariant,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (selected) ...[
                      Icon(Icons.check, size: 16, color: colors.text),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      colors.label,
                      style: AppTextStyles.labelMedium.copyWith(
                        color:
                            selected ? colors.text : AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _RoadmapSkeleton extends StatelessWidget {
  const _RoadmapSkeleton();

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverAppBar(title: Text('Roadmap')),
        SliverList.list(
          children: const [
            Padding(
              padding: EdgeInsets.all(16),
              child: SkeletonCard(height: 160),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: SkeletonCard(height: 118),
            ),
            Padding(
              padding: EdgeInsets.all(16),
              child: SkeletonCard(height: 118),
            ),
          ],
        ),
      ],
    );
  }
}

List<_RoadmapPhase> _buildPhases(List<NodeProgressDto> nodes) {
  final parentNodes = nodes
      .where((node) => node.node?.parentNodeId == null)
      .where((node) =>
          nodes.any((child) => child.node?.parentNodeId == node.nodeId))
      .toList();

  if (parentNodes.isEmpty) {
    return [_RoadmapPhase(name: 'Phase 1', nodes: nodes)];
  }

  final phases = <_RoadmapPhase>[];
  final groupedNodeIds = <String>{};
  for (final parent in parentNodes) {
    final children = nodes
        .where((node) => node.node?.parentNodeId == parent.nodeId)
        .toList()
      ..sort((a, b) => (a.node?.order ?? 0).compareTo(b.node?.order ?? 0));
    groupedNodeIds.add(parent.nodeId);
    groupedNodeIds.addAll(children.map((node) => node.nodeId));
    phases.add(
      _RoadmapPhase(
        name: parent.node?.name ?? 'Phase ${phases.length + 1}',
        nodes: children.isEmpty ? [parent] : children,
      ),
    );
  }

  final ungrouped =
      nodes.where((node) => !groupedNodeIds.contains(node.nodeId)).toList();
  if (ungrouped.isNotEmpty) {
    phases.add(_RoadmapPhase(name: 'Additional Milestones', nodes: ungrouped));
  }

  return phases;
}

class _RoadmapPhase {
  const _RoadmapPhase({
    required this.name,
    required this.nodes,
  });

  final String name;
  final List<NodeProgressDto> nodes;

  int get completedCount => nodes.where((node) => node.status == 4).length;
}
