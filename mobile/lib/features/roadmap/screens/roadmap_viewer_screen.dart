import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/linear_progress_bar.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../../core/widgets/status_chip.dart';
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
            SliverAppBar(
              title: const Text('Roadmap'),
              leading: IconButton(
                tooltip: 'Back',
                icon: const Icon(Icons.arrow_back),
                onPressed: () => _backToRoadmaps(context),
              ),
            ),
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
          ]..sort(
              (a, b) => (a.roadmapNode?.order ?? a.node?.order ?? 0)
                  .compareTo(b.roadmapNode?.order ?? b.node?.order ?? 0),
            );
          final completed = nodes.where((node) => node.status == 4).length;
          final edges =
              ref.watch(roadmapNodeEdgesProvider(data.careerRoadmapId));

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 210,
                leading: IconButton(
                  tooltip: 'Back',
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => _backToRoadmaps(context),
                ),
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
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 16, 0, 24),
                    child: _RoadmapGraphSection(
                      nodes: nodes,
                      edges: edges.valueOrNull ?? const [],
                      onNodeTap: (node) => _showNodeSheet(context, ref, node),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _backToRoadmaps(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go('/roadmaps');
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

class _RoadmapGraphSection extends StatefulWidget {
  const _RoadmapGraphSection({
    required this.nodes,
    required this.edges,
    required this.onNodeTap,
  });

  final List<NodeProgressDto> nodes;
  final List<RoadmapNodeEdgeDto> edges;
  final ValueChanged<NodeProgressDto> onNodeTap;

  @override
  State<_RoadmapGraphSection> createState() => _RoadmapGraphSectionState();
}

class _RoadmapGraphSectionState extends State<_RoadmapGraphSection> {
  static const _minZoom = 0.72;
  static const _maxZoom = 1.35;
  double _zoom = 1;

  void _changeZoom(double delta) {
    setState(() => _zoom = (_zoom + delta).clamp(_minZoom, _maxZoom));
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportWidth = constraints.maxWidth;
        final canvasWidth = viewportWidth < 640 ? 760.0 : viewportWidth;
        final layout = _layoutRoadmapNodes(widget.nodes, canvasWidth);
        final positions = layout.positions;
        final baseCanvasHeight = positions.values.fold<double>(
          520,
          (height, position) =>
              position.dy + _GraphNodeCard.height + 80 > height
                  ? position.dy + _GraphNodeCard.height + 80
                  : height,
        );
        final scaledWidth = canvasWidth * _zoom;
        final scaledHeight = baseCanvasHeight * _zoom;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Flexible(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.outlineVariant),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.swipe, size: 16),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                layout.usedStoredPositions
                                    ? 'Template layout'
                                    : 'Generated roadmap layout',
                                overflow: TextOverflow.ellipsis,
                                style: AppTextStyles.labelSmall,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _ZoomButton(
                    icon: Icons.remove,
                    tooltip: 'Zoom out',
                    onPressed:
                        _zoom <= _minZoom ? null : () => _changeZoom(-0.12),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      '${(_zoom * 100).round()}%',
                      style: AppTextStyles.labelMedium,
                    ),
                  ),
                  _ZoomButton(
                    icon: Icons.add,
                    tooltip: 'Zoom in',
                    onPressed:
                        _zoom >= _maxZoom ? null : () => _changeZoom(0.12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: scaledWidth,
                height: scaledHeight,
                child: Transform.scale(
                  scale: _zoom,
                  alignment: Alignment.topLeft,
                  child: SizedBox(
                    width: canvasWidth,
                    height: baseCanvasHeight,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _RoadmapConnectorPainter(
                              nodes: widget.nodes,
                              edges: widget.edges,
                              positions: positions,
                            ),
                          ),
                        ),
                        ...widget.nodes.map((node) {
                          final position =
                              positions[node._graphId] ?? Offset.zero;
                          return Positioned(
                            left: position.dx,
                            top: position.dy,
                            width: _GraphNodeCard.width,
                            height: _GraphNodeCard.height,
                            child: _GraphNodeCard(
                              nodeProgress: node,
                              onTap: () => widget.onNodeTap(node),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ZoomButton extends StatelessWidget {
  const _ZoomButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton.filledTonal(
      tooltip: tooltip,
      icon: Icon(icon),
      onPressed: onPressed,
      constraints: const BoxConstraints.tightFor(width: 40, height: 40),
    );
  }
}

class _GraphNodeCard extends StatelessWidget {
  const _GraphNodeCard({
    required this.nodeProgress,
    required this.onTap,
  });

  static const width = 232.0;
  static const height = 86.0;

  final NodeProgressDto nodeProgress;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final node = nodeProgress.node;
    final roadmapNode = nodeProgress.roadmapNode;
    final style = _graphNodeStyle(nodeProgress);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: style.fill,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: style.stroke, width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22111827),
                offset: Offset(3, 3),
                blurRadius: 0,
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                left: -16,
                top: 31,
                child: _ConnectorDot(color: style.dot),
              ),
              Positioned(
                right: -16,
                top: 31,
                child: _ConnectorDot(color: style.dot),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    node?.name ?? 'Roadmap milestone',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.titleSmall.copyWith(
                      color: style.text,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          [
                            roadmapNode?.nodeType,
                            roadmapNode?.requirementType,
                          ].whereType<String>().where((v) => v.isNotEmpty).join(
                                ' / ',
                              ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.labelSmall.copyWith(
                            color: style.text.withValues(alpha: 0.78),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      StatusChip(status: nodeProgress.status),
                    ],
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

class _ConnectorDot extends StatelessWidget {
  const _ConnectorDot({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
    );
  }
}

({Color fill, Color stroke, Color text, Color dot}) _graphNodeStyle(
  NodeProgressDto nodeProgress,
) {
  final statusColors =
      nodeStatusColors[nodeProgress.status] ?? nodeStatusColors[0]!;
  final nodeType = nodeProgress.roadmapNode?.nodeType?.toLowerCase() ?? '';
  final requirementType =
      nodeProgress.roadmapNode?.requirementType?.toLowerCase() ?? '';
  final isMain = nodeType.contains('group') || nodeType.contains('milestone');
  final isOptional = requirementType.contains('optional');
  final isRecommended = requirementType.contains('recommended');

  if (nodeProgress.status != 0) {
    return (
      fill: statusColors.fill,
      stroke: statusColors.stroke,
      text: statusColors.text,
      dot: statusColors.stroke,
    );
  }

  if (isMain) {
    return (
      fill: const Color(0xFFFFF200),
      stroke: const Color(0xFF111827),
      text: const Color(0xFF111827),
      dot: const Color(0xFF2563EB),
    );
  }
  if (isOptional) {
    return (
      fill: Colors.white,
      stroke: const Color(0xFF111827),
      text: const Color(0xFF111827),
      dot: const Color(0xFF8B5CF6),
    );
  }
  if (isRecommended) {
    return (
      fill: const Color(0xFFDFF7DF),
      stroke: const Color(0xFF111827),
      text: const Color(0xFF111827),
      dot: const Color(0xFF22C55E),
    );
  }
  return (
    fill: const Color(0xFFFFDF8A),
    stroke: const Color(0xFF111827),
    text: const Color(0xFF111827),
    dot: const Color(0xFF2563EB),
  );
}

class _RoadmapConnectorPainter extends CustomPainter {
  const _RoadmapConnectorPainter({
    required this.nodes,
    required this.edges,
    required this.positions,
  });

  final List<NodeProgressDto> nodes;
  final List<RoadmapNodeEdgeDto> edges;
  final Map<String, Offset> positions;

  @override
  void paint(Canvas canvas, Size size) {
    final byRoadmapNodeId = {
      for (final node in nodes)
        if ((node.roadmapNode?.roadmapNodeId ?? '').isNotEmpty)
          node.roadmapNode!.roadmapNodeId: node,
    };
    final byNodeId = {for (final node in nodes) node.nodeId: node};
    final parentPaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 2.2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final edgePaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (final node in nodes) {
      final from = _parentFor(node, byRoadmapNodeId, byNodeId);
      if (from == null) continue;

      final fromPosition = positions[from._graphId];
      final toPosition = positions[node._graphId];
      if (fromPosition == null || toPosition == null) continue;

      _drawDashedPath(
        canvas,
        _branchPath(fromPosition, toPosition),
        parentPaint,
      );
    }

    for (final edge in edges) {
      final from = byRoadmapNodeId[edge.fromRoadmapNodeId];
      final to = byRoadmapNodeId[edge.toRoadmapNodeId];
      if (from == null || to == null) continue;

      final fromPosition = positions[from._graphId];
      final toPosition = positions[to._graphId];
      if (fromPosition == null || toPosition == null) continue;

      final path = _edgePath(fromPosition, toPosition);
      canvas.drawPath(path, edgePaint);
      _drawArrowHead(canvas, fromPosition, toPosition, edgePaint);
    }
  }

  NodeProgressDto? _parentFor(
    NodeProgressDto node,
    Map<String, NodeProgressDto> byRoadmapNodeId,
    Map<String, NodeProgressDto> byNodeId,
  ) {
    final parentRoadmapNodeId = node.roadmapNode?.parentRoadmapNodeId;
    if (parentRoadmapNodeId != null &&
        byRoadmapNodeId.containsKey(parentRoadmapNodeId)) {
      return byRoadmapNodeId[parentRoadmapNodeId];
    }
    final parentNodeId = node.node?.parentNodeId;
    if (parentNodeId != null && byNodeId.containsKey(parentNodeId)) {
      return byNodeId[parentNodeId];
    }
    return null;
  }

  Path _branchPath(Offset fromPosition, Offset toPosition) {
    final isLeftBranch = toPosition.dx < fromPosition.dx;
    final start = fromPosition +
        Offset(
          isLeftBranch ? 0 : _GraphNodeCard.width,
          _GraphNodeCard.height / 2,
        );
    final end = toPosition +
        Offset(
          isLeftBranch ? _GraphNodeCard.width : 0,
          _GraphNodeCard.height / 2,
        );
    final direction = isLeftBranch ? -1.0 : 1.0;
    final branchGap = ((end.dx - start.dx).abs() * 0.28).clamp(36.0, 72.0);
    final busX = start.dx + direction * branchGap;
    return Path()
      ..moveTo(start.dx, start.dy)
      ..lineTo(busX, start.dy)
      ..lineTo(busX, end.dy)
      ..lineTo(end.dx, end.dy);
  }

  Path _edgePath(Offset fromPosition, Offset toPosition) {
    final start = fromPosition +
        const Offset(_GraphNodeCard.width / 2, _GraphNodeCard.height);
    final end = toPosition + const Offset(_GraphNodeCard.width / 2, 0);
    final midY = (start.dy + end.dy) / 2;
    return Path()
      ..moveTo(start.dx, start.dy)
      ..cubicTo(start.dx, midY, end.dx, midY, end.dx, end.dy);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    const dashLength = 2.0;
    const gapLength = 6.0;
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = math.min(distance + dashLength, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + gapLength;
      }
    }
  }

  void _drawArrowHead(
    Canvas canvas,
    Offset fromPosition,
    Offset toPosition,
    Paint paint,
  ) {
    final end = toPosition + const Offset(_GraphNodeCard.width / 2, 0);
    final control = fromPosition +
        Offset(
          _GraphNodeCard.width / 2,
          ((toPosition.dy - fromPosition.dy) / 2).clamp(28.0, 96.0),
        );
    final angle = math.atan2(end.dy - control.dy, end.dx - control.dx);
    const arrowSize = 11.0;
    final left = end -
        Offset(
          math.cos(angle - math.pi / 6) * arrowSize,
          math.sin(angle - math.pi / 6) * arrowSize,
        );
    final right = end -
        Offset(
          math.cos(angle + math.pi / 6) * arrowSize,
          math.sin(angle + math.pi / 6) * arrowSize,
        );
    final path = Path()
      ..moveTo(end.dx, end.dy)
      ..lineTo(left.dx, left.dy)
      ..moveTo(end.dx, end.dy)
      ..lineTo(right.dx, right.dy);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _RoadmapConnectorPainter oldDelegate) {
    return oldDelegate.nodes != nodes ||
        oldDelegate.edges != edges ||
        oldDelegate.positions != positions;
  }
}

_RoadmapGraphLayout _layoutRoadmapNodes(
  List<NodeProgressDto> nodes,
  double canvasWidth,
) {
  final byId = {
    for (final node in nodes)
      if (node._graphId.isNotEmpty) node._graphId: node,
  };
  final childrenByParent = <String, List<NodeProgressDto>>{};
  for (final node in nodes) {
    final parentId = node.roadmapNode?.parentRoadmapNodeId;
    if (parentId == null || !byId.containsKey(parentId)) continue;
    (childrenByParent[parentId] ??= []).add(node);
  }
  for (final children in childrenByParent.values) {
    children.sort(_compareRoadmapNodes);
  }

  final positioned = nodes
      .where((node) =>
          node.roadmapNode?.positionX != null &&
          node.roadmapNode?.positionY != null)
      .toList();
  final minimumPositionedNodes = nodes.length < 3
      ? nodes.length
      : (nodes.length * 0.6).ceil().clamp(3, nodes.length);
  final shouldUseStoredPositions = positioned.length >= minimumPositionedNodes;

  if (shouldUseStoredPositions && nodes.isNotEmpty) {
    final xs = positioned.map((node) => node.roadmapNode!.positionX!).toList();
    final ys = positioned.map((node) => node.roadmapNode!.positionY!).toList();
    final minX = xs.reduce((a, b) => a < b ? a : b);
    final maxX = xs.reduce((a, b) => a > b ? a : b);
    final minY = ys.reduce((a, b) => a < b ? a : b);
    final maxY = ys.reduce((a, b) => a > b ? a : b);
    final usableWidth = canvasWidth - _GraphNodeCard.width - 48;
    final usableHeight = (nodes.length * 116).clamp(520, 1800).toDouble();
    final fallback = _treeLayout(nodes, byId, childrenByParent, canvasWidth);
    final positions = Map<String, Offset>.from(fallback);
    for (final node in positioned) {
      positions[node._graphId] = Offset(
        _scale(node.roadmapNode!.positionX!, minX, maxX, 24, usableWidth),
        _scale(node.roadmapNode!.positionY!, minY, maxY, 56, usableHeight),
      );
    }
    return _RoadmapGraphLayout(
      positions: positions,
      usedStoredPositions: true,
    );
  }

  return _RoadmapGraphLayout(
    positions: _treeLayout(nodes, byId, childrenByParent, canvasWidth),
    usedStoredPositions: false,
  );
}

Map<String, Offset> _treeLayout(
  List<NodeProgressDto> nodes,
  Map<String, NodeProgressDto> byId,
  Map<String, List<NodeProgressDto>> childrenByParent,
  double canvasWidth,
) {
  const startX = 264.0;
  const startY = 48.0;
  const xGap = 248.0;
  const yGap = 116.0;
  final depthById = <String, int>{};
  final positions = <String, Offset>{};
  var row = 0;

  int resolveDepth(NodeProgressDto node, [Set<String>? visiting]) {
    if (depthById.containsKey(node._graphId)) return depthById[node._graphId]!;
    final seen = visiting ?? <String>{};
    final parentId = node.roadmapNode?.parentRoadmapNodeId;
    if (parentId == null ||
        !byId.containsKey(parentId) ||
        seen.contains(node._graphId)) {
      depthById[node._graphId] = 0;
      return 0;
    }
    seen.add(node._graphId);
    final depth = resolveDepth(byId[parentId]!, seen) + 1;
    depthById[node._graphId] = depth;
    return depth;
  }

  Offset layoutNode(NodeProgressDto node) {
    final existing = positions[node._graphId];
    if (existing != null) return existing;

    final children =
        childrenByParent[node._graphId] ?? const <NodeProgressDto>[];
    final childPositions = children.map(layoutNode).toList();
    final depth = resolveDepth(node);
    final y = childPositions.isNotEmpty
        ? childPositions.map((p) => p.dy).reduce((a, b) => a + b) /
            childPositions.length
        : startY + row++ * yGap;
    final direction = depth == 0 ? 0 : (depth.isEven ? 1 : -1);
    final x = (startX + direction * ((depth + 1) ~/ 2) * xGap)
        .clamp(24.0, canvasWidth - _GraphNodeCard.width - 24);
    final position = Offset(x, y);
    positions[node._graphId] = position;
    return position;
  }

  final roots = nodes.where((node) {
    final parentId = node.roadmapNode?.parentRoadmapNodeId;
    return parentId == null || !byId.containsKey(parentId);
  }).toList()
    ..sort(_compareRoadmapNodes);
  for (final node in roots) {
    layoutNode(node);
  }
  for (final node in [...nodes]..sort(_compareRoadmapNodes)) {
    layoutNode(node);
  }
  return positions;
}

int _compareRoadmapNodes(NodeProgressDto a, NodeProgressDto b) {
  final order = (a.roadmapNode?.order ?? a.node?.order ?? 0)
      .compareTo(b.roadmapNode?.order ?? b.node?.order ?? 0);
  if (order != 0) return order;
  return (a.node?.name ?? '').compareTo(b.node?.name ?? '');
}

class _RoadmapGraphLayout {
  const _RoadmapGraphLayout({
    required this.positions,
    required this.usedStoredPositions,
  });

  final Map<String, Offset> positions;
  final bool usedStoredPositions;
}

double _scale(
  double value,
  double min,
  double max,
  double targetMin,
  double targetMax,
) {
  if (max - min == 0) return (targetMin + targetMax) / 2;
  return targetMin + ((value - min) / (max - min)) * (targetMax - targetMin);
}

extension on NodeProgressDto {
  String get _graphId {
    final roadmapNodeId = roadmapNode?.roadmapNodeId;
    return roadmapNodeId == null || roadmapNodeId.isEmpty
        ? nodeProgressId
        : roadmapNodeId;
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
    final directResources =
        ref.watch(learningResourcesProvider(widget.nodeProgress.nodeId));
    final recommendedResources =
        ref.watch(recommendedResourcesProvider(widget.nodeProgress.nodeId));

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
        const SizedBox(height: 20),
        Text('Learning Resources', style: AppTextStyles.titleSmall),
        const SizedBox(height: 10),
        directResources.when(
          loading: () => const SkeletonCard(height: 88),
          error: (_, __) => Text(
            'Could not load resources.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          data: (items) => _InlineResourceList(
            resources: items,
            emptyText: 'No resources for this milestone.',
          ),
        ),
        const SizedBox(height: 16),
        Text('Recommended For You', style: AppTextStyles.titleSmall),
        const SizedBox(height: 10),
        recommendedResources.when(
          loading: () => const SkeletonCard(height: 88),
          error: (_, __) => const SizedBox.shrink(),
          data: (items) => _InlineResourceList(
            resources: items,
            emptyText: 'No personalized recommendations yet.',
          ),
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

class _InlineResourceList extends StatelessWidget {
  const _InlineResourceList({
    required this.resources,
    required this.emptyText,
  });

  final List<LearningResourceDto> resources;
  final String emptyText;

  @override
  Widget build(BuildContext context) {
    if (resources.isEmpty) {
      return Text(
        emptyText,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.onSurfaceVariant,
        ),
      );
    }

    return Column(
      children: resources
          .take(3)
          .map(
            (resource) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                leading: const Icon(Icons.menu_book_outlined),
                title: Text(
                  resource.resourceName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${resource.provider} - ${resource.resourceType}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.open_in_new, size: 18),
                onTap: () => _openResource(context, resource.resourceUrl),
              ),
            ),
          )
          .toList(),
    );
  }

  Future<void> _openResource(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !await canLaunchUrl(uri)) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _RoadmapSkeleton extends StatelessWidget {
  const _RoadmapSkeleton();

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          title: const Text('Roadmap'),
          leading: IconButton(
            tooltip: 'Back',
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (context.canPop()) {
                context.pop();
                return;
              }
              context.go('/roadmaps');
            },
          ),
        ),
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
