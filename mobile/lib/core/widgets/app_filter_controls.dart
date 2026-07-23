import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class AppFilterOption<T> {
  const AppFilterOption({required this.value, required this.label});

  final T value;
  final String label;
}

class AppFilterBar extends StatelessWidget {
  const AppFilterBar({
    super.key,
    required this.children,
    this.spacing = 8,
    this.runSpacing = 8,
    this.minItemWidth = 150,
  });

  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final double minItemWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final columnCount = maxWidth >= 720
            ? 4
            : maxWidth >= (minItemWidth * 2 + spacing)
                ? 2
                : 1;
        final itemWidth =
            (maxWidth - (spacing * (columnCount - 1))) / columnCount;

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: [
            for (final child in children)
              SizedBox(width: itemWidth, child: child),
          ],
        );
      },
    );
  }
}

class AppFilterSelect<T> extends StatelessWidget {
  const AppFilterSelect({
    super.key,
    required this.label,
    required this.valueLabel,
    required this.icon,
    required this.options,
    required this.onSelected,
    this.enabled = true,
  });

  final String label;
  final String valueLabel;
  final IconData icon;
  final List<AppFilterOption<T>> options;
  final ValueChanged<T> onSelected;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<T>(
      enabled: enabled && options.isNotEmpty,
      tooltip: label,
      onSelected: onSelected,
      itemBuilder: (context) => [
        for (final option in options)
          PopupMenuItem<T>(
            value: option.value,
            child: Text(option.label),
          ),
      ],
      child: _FilterShell(
        label: label,
        value: valueLabel,
        icon: icon,
        trailing: Icons.keyboard_arrow_down_rounded,
        enabled: enabled && options.isNotEmpty,
      ),
    );
  }
}

class AppFilterButton extends StatelessWidget {
  const AppFilterButton({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.onPressed,
    this.trailing,
    this.enabled = true,
  });

  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onPressed;
  final IconData? trailing;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onPressed : null,
      borderRadius: BorderRadius.circular(8),
      child: _FilterShell(
        label: label,
        value: value,
        icon: icon,
        trailing: trailing,
        enabled: enabled,
      ),
    );
  }
}

class _FilterShell extends StatelessWidget {
  const _FilterShell({
    required this.label,
    required this.value,
    required this.icon,
    required this.enabled,
    this.trailing,
  });

  final String label;
  final String value;
  final IconData icon;
  final IconData? trailing;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final foreground =
        enabled ? AppColors.onSurface : AppColors.onSurfaceVariant;
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: enabled
            ? AppColors.surfaceContainerLowest
            : AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySmall.copyWith(color: foreground),
                ),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 4),
            Icon(trailing, size: 18, color: AppColors.onSurfaceVariant),
          ],
        ],
      ),
    );
  }
}
