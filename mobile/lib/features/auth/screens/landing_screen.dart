import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top App Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.explore, color: AppColors.primary, size: 28),
                    const SizedBox(width: 8),
                    Text(
                      'SECompass',
                      style: AppTextStyles.headlineMedium
                          .copyWith(color: AppColors.primary),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Sign In'),
                    ),
                  ],
                ),
              ),

              // Hero Section
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFFD8E2FF), AppColors.surface],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 48),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: AppColors.inversePrimary),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('✦', style: TextStyle(fontSize: 14)),
                          const SizedBox(width: 4),
                          Text(
                            'AI-Powered Career Platform',
                            style: AppTextStyles.labelLarge
                                .copyWith(color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Find your engineering\nnorth star.',
                      style: AppTextStyles.displayLarge
                          .copyWith(color: AppColors.onSurface, height: 1.2),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Go from generalist to job-ready.',
                      style: AppTextStyles.headlineMedium
                          .copyWith(color: AppColors.primary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'SECompass analyzes your skills, builds your roadmap, and connects you to an AI mentor.',
                      style: AppTextStyles.bodyLarge
                          .copyWith(color: AppColors.onSurfaceVariant),
                    ),
                    const SizedBox(height: 24),

                    // CTA Buttons
                    AppButton(
                      label: 'Start for free →',
                      onPressed: () => context.go('/register'),
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Sign In',
                      variant: AppButtonVariant.outlined,
                      onPressed: () => context.go('/login'),
                    ),

                    const SizedBox(height: 32),

                    // Social proof
                    Row(
                      children: [
                        _AvatarStack(),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: List.generate(
                                5,
                                (_) => const Icon(
                                  Icons.star,
                                  size: 14,
                                  color: Color(0xFFC55500),
                                ),
                              ),
                            ),
                            Text(
                              '4.9 rating from students',
                              style: AppTextStyles.labelSmall
                                  .copyWith(color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Feature highlights
              _FeatureSection(),

              // Stats section
              Container(
                width: double.infinity,
                color: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
                child: Column(
                  children: [
                    Text(
                      'Join thousands of engineers\naccelerating their careers',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.titleLarge.copyWith(color: AppColors.onPrimary),
                    ),
                    const SizedBox(height: 32),
                    const Row(
                      children: [
                        Expanded(child: _StatItem(value: '2,000+', label: 'Active Users')),
                        Expanded(child: _StatItem(value: '15+', label: 'Career Paths')),
                        Expanded(child: _StatItem(value: '500+', label: 'Resources')),
                      ],
                    ),
                  ],
                ),
              ),

              // Bottom CTA
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      'Ready to start your journey?',
                      style: AppTextStyles.headlineMedium
                          .copyWith(color: AppColors.onSurface),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: 'Create Free Account',
                      onPressed: () => context.go('/register'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Already have an account? Sign In'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AvatarStack extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      height: 32,
      child: Stack(
        children: List.generate(
          3,
          (i) => Positioned(
            left: i * 22.0,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.surfaceVariant,
                border: Border.all(color: AppColors.surface, width: 2),
              ),
              child: const Icon(Icons.person, size: 18, color: AppColors.onSurfaceVariant),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text(
            value,
            style: AppTextStyles.displayMedium.copyWith(color: AppColors.onPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTextStyles.bodyMedium
                .copyWith(color: AppColors.onPrimary.withValues(alpha: 0.8)),
            textAlign: TextAlign.center,
          ),
        ],
      );
}

class _FeatureSection extends StatelessWidget {
  final _features = const [
    _Feature(
      icon: Icons.map_outlined,
      title: 'Personalized Roadmaps',
      subtitle: 'AI-generated learning paths tailored to your goal role.',
    ),
    _Feature(
      icon: Icons.psychology_outlined,
      title: 'AI Mentor Chat',
      subtitle: 'Get instant answers from your personal AI career mentor.',
    ),
    _Feature(
      icon: Icons.analytics_outlined,
      title: 'Skill Gap Analysis',
      subtitle: 'Identify exactly what skills you need to land your next role.',
    ),
    _Feature(
      icon: Icons.trending_up_outlined,
      title: 'Market Pulse',
      subtitle: 'Real-time job market trends for SE roles in Vietnam.',
    ),
  ];

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
        child: Column(
          children: _features
              .map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(f.icon, color: AppColors.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(f.title, style: AppTextStyles.titleMedium),
                            const SizedBox(height: 4),
                            Text(
                              f.subtitle,
                              style: AppTextStyles.bodyMedium
                                  .copyWith(color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ),
      );
}

class _Feature {
  final IconData icon;
  final String title;
  final String subtitle;

  const _Feature({
    required this.icon,
    required this.title,
    required this.subtitle,
  });
}
