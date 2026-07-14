import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  static const _features = [
    _LandingFeature(Icons.map_outlined, 'Personalized SE roadmaps'),
    _LandingFeature(
        Icons.insights_outlined, 'Skill gaps translated into next steps'),
    _LandingFeature(
        Icons.smart_toy_outlined, 'AI mentor help when you get stuck'),
    _LandingFeature(
        Icons.trending_up_outlined, 'Market trends for job-ready skills'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFD8E2FF),
                    AppColors.surface,
                    Color(0xFFE8F0FE),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _LogoHeader(),
                  const Spacer(),
                  Text(
                    'From Generalist\nto Job-Ready',
                    style: AppTextStyles.displayLarge.copyWith(
                      color: AppColors.onSurface,
                      height: 1.08,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Build a focused software engineering path with roadmaps, skill analysis, and AI mentoring.',
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 28),
                  ..._features.map(
                    (feature) {
                      final index = _features.indexOf(feature);
                      return _FeatureBullet(feature: feature)
                          .animate()
                          .fadeIn(
                            delay: Duration(milliseconds: 90 * index),
                            duration: 280.ms,
                          )
                          .slideY(begin: 0.15, end: 0);
                    },
                  ),
                  const Spacer(),
                  AppButton(
                    label: 'Get Started',
                    onPressed: () => context.go('/register'),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'Sign In',
                    variant: AppButtonVariant.outlined,
                    onPressed: () => context.go('/login'),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'Browse Roadmaps',
                    variant: AppButtonVariant.text,
                    leadingIcon: const Icon(Icons.travel_explore_outlined),
                    onPressed: () => context.go('/explore/roles'),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      '2,000+ students already navigating their careers',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LogoHeader extends StatelessWidget {
  const _LogoHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.explore, color: AppColors.onPrimary),
        ),
        const SizedBox(width: 12),
        Text(
          'SECompass',
          style: AppTextStyles.headlineMedium.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FeatureBullet extends StatelessWidget {
  const _FeatureBullet({required this.feature});

  final _LandingFeature feature;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.outlineVariant),
            ),
            child: Icon(feature.icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              feature.text,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LandingFeature {
  const _LandingFeature(this.icon, this.text);

  final IconData icon;
  final String text;
}
