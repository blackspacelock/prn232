import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.explore, color: AppColors.primary),
            const SizedBox(width: 8),
            Text('SECompass', style: AppTextStyles.titleLarge.copyWith(color: AppColors.primary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primaryContainer,
              child: Icon(Icons.person, size: 18, color: Colors.white),
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A73E8), Color(0xFF0D47A1)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back! 👋',
                    style: AppTextStyles.titleLarge.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Continue your engineering journey',
                    style: AppTextStyles.bodyMedium
                        .copyWith(color: Colors.white.withValues(alpha: 0.85)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Stats row
            const Row(
              children: [
                Expanded(child: _StatCard(label: 'Roadmaps', value: '—')),
                SizedBox(width: 12),
                Expanded(child: _StatCard(label: 'Completed', value: '—')),
                SizedBox(width: 12),
                Expanded(child: _StatCard(label: 'Skills', value: '—')),
              ],
            ),
            const SizedBox(height: 24),

            Text('Quick Actions', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _QuickAction(
                  icon: Icons.map_outlined,
                  label: 'Career Roadmap',
                  color: AppColors.primaryContainer,
                  onTap: () => context.go('/career-roles'),
                ),
                _QuickAction(
                  icon: Icons.analytics_outlined,
                  label: 'Skill Gap',
                  color: const Color(0xFFFEF7E0),
                  onTap: () => context.go('/skill-gap/select'),
                ),
                _QuickAction(
                  icon: Icons.smart_toy_outlined,
                  label: 'AI Mentor',
                  color: const Color(0xFFE8F0FE),
                  onTap: () => context.go('/mentor'),
                ),
                _QuickAction(
                  icon: Icons.trending_up_outlined,
                  label: 'Market Pulse',
                  color: const Color(0xFFE6F4EA),
                  onTap: () => context.go('/market-pulse'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('My Roadmaps', style: AppTextStyles.titleMedium),
                TextButton(
                  onPressed: () => context.go('/career-roles'),
                  child: const Text('+ New'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Empty state placeholder
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.outlineVariant),
              ),
              child: Column(
                children: [
                  const Icon(Icons.map_outlined, size: 48, color: AppColors.onSurfaceVariant),
                  const SizedBox(height: 12),
                  Text(
                    'No roadmaps yet',
                    style: AppTextStyles.titleSmall.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                  const SizedBox(height: 8),
                  AppButton(
                    label: 'Generate My Roadmap',
                    onPressed: () => context.go('/career-roles'),
                    width: 200,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: AppTextStyles.labelSmall.copyWith(color: AppColors.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: AppColors.primary, size: 28),
              Text(label, style: AppTextStyles.labelLarge),
            ],
          ),
        ),
      );
}
