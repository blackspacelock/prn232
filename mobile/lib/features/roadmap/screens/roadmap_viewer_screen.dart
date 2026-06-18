import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
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
      appBar: AppBar(title: const Text('Roadmap')),
      body: roadmap.when(
        loading: () => const _RoadmapSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load roadmap',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(
            personalRoadmapDetailProvider(personalRoadmapId),
          ),
        ),
        data: (data) {
          final nodes = [
            ...data.nodeProgresses
          ]..sort((a, b) => (a.node?.order ?? 0).compareTo(b.node?.order ?? 0));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _RoadmapHeader(roadmap: data),
              const SizedBox(height: 24),
              Text('Milestones', style: AppTextStyles.titleMedium),
              const SizedBox(height: 12),
              if (nodes.isEmpty)
                const EmptyStateView(
                  icon: Icons.route_outlined,
                  title: 'No roadmap nodes yet',
                  subtitle: 'This roadmap does not have milestones to display.',
                )
              else
                ...nodes.map(
                  (node) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: RoadmapNodeCard(
                      nodeProgress: node,
                      onTap: () => _showNodeSheet(context, ref, node),
                    ),
                  ),
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
      showDragHandle: true,
      builder: (context) => _NodeDetailSheet(
        nodeProgress: nodeProgress,
        onStatusChanged: (status) async {
          await ref.read(roadmapRepositoryProvider).updateNodeStatus(
                nodeProgress.nodeProgressId,
                status,
              );
          ref.invalidate(personalRoadmapDetailProvider(personalRoadmapId));
          ref.invalidate(dashboardDataProvider);
        },
      ),
    );
  }
}

class _RoadmapHeader extends StatelessWidget {
  const _RoadmapHeader({required this.roadmap});

  final PersonalRoadmapDto roadmap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            roadmap.careerRoadmap?.name ?? 'Personal Roadmap',
            style: AppTextStyles.titleLarge,
          ),
          if (roadmap.careerRoadmap?.description != null) ...[
            const SizedBox(height: 8),
            Text(
              roadmap.careerRoadmap!.description!,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: LinearProgressBar(
                  value: roadmap.progressPercentage / 100,
                  height: 8,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '${roadmap.progressPercentage.round()}%',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NodeDetailSheet extends StatelessWidget {
  const _NodeDetailSheet({
    required this.nodeProgress,
    required this.onStatusChanged,
  });

  final NodeProgressDto nodeProgress;
  final ValueChanged<int> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final node = nodeProgress.node;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(node?.name ?? 'Roadmap milestone',
              style: AppTextStyles.titleLarge),
          if (node?.description != null) ...[
            const SizedBox(height: 8),
            Text(
              node!.description!,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text('Update status', style: AppTextStyles.titleSmall),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: nodeStatusColors.entries.map((entry) {
              return ChoiceChip(
                label: Text(entry.value.label),
                selected: nodeProgress.status == entry.key,
                onSelected: (_) {
                  onStatusChanged(entry.key);
                  Navigator.of(context).pop();
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _RoadmapSkeleton extends StatelessWidget {
  const _RoadmapSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SkeletonCard(height: 160),
        SkeletonCard(height: 82),
        SkeletonCard(height: 82),
        SkeletonCard(height: 82),
      ],
    );
  }
}
