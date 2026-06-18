import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status, this.label});

  final int status;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final colors = nodeStatusColors[status] ?? nodeStatusColors[0]!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.fill,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.stroke),
      ),
      child: Text(
        label ?? colors.label,
        style: AppTextStyles.labelSmall.copyWith(color: colors.text),
      ),
    );
  }
}
