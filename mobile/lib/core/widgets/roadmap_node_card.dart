import 'package:flutter/material.dart';
import '../models/roadmap_models.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'status_chip.dart';

class RoadmapNodeCard extends StatelessWidget {
  const RoadmapNodeCard({
    super.key,
    required this.nodeProgress,
    required this.onTap,
  });

  final NodeProgressDto nodeProgress;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors =
        nodeStatusColors[nodeProgress.status] ?? nodeStatusColors[0]!;
    final node = nodeProgress.node;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        constraints: const BoxConstraints(minHeight: 60),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            Container(width: 3, color: colors.stroke),
            Expanded(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: colors.stroke,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  node?.name ?? 'Roadmap milestone',
                                  style: AppTextStyles.titleSmall,
                                ),
                              ),
                              const SizedBox(width: 8),
                              StatusChip(status: nodeProgress.status),
                            ],
                          ),
                          if (node?.description != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              node!.description!,
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
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.chevron_right,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
