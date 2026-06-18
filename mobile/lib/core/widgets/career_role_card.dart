import 'package:flutter/material.dart';
import '../models/roadmap_models.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class CareerRoleCard extends StatelessWidget {
  const CareerRoleCard({
    super.key,
    required this.role,
    required this.isSelected,
    required this.onTap,
  });

  final CareerRoleDto role;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFE8F0FE)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primaryContainer
                : AppColors.outlineVariant,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(_iconFor(role.iconName),
                    color: AppColors.primary, size: 32),
                const SizedBox(height: 12),
                Text(role.name, style: AppTextStyles.titleMedium),
                const SizedBox(height: 6),
                Text(
                  role.description ??
                      'Explore the skills and milestones for this role.',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            if (isSelected)
              const Positioned(
                top: 0,
                right: 0,
                child: Icon(Icons.check_circle, color: AppColors.primary),
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(String? iconName) {
    return switch (iconName) {
      'mobile' => Icons.phone_iphone,
      'data' => Icons.storage,
      'cloud' => Icons.cloud_outlined,
      'security' => Icons.security,
      'ai' => Icons.psychology_outlined,
      _ => Icons.code,
    };
  }
}
