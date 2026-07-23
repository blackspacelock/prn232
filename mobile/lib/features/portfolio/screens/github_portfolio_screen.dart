import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';

class GithubPortfolioScreen extends StatelessWidget {
  const GithubPortfolioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/portfolio'),
        title: const Text('Portfolio'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.folder_special_outlined,
                size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('GitHub Portfolio', style: AppTextStyles.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Sprint 5 — Coming soon',
              style: AppTextStyles.bodyMedium
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
