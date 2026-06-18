import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _universityCtrl = TextEditingController();
  final _majorCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  int _studiedYear = 1;
  bool _loading = false;

  @override
  void dispose() {
    _universityCtrl.dispose();
    _majorCtrl.dispose();
    _phoneCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final userId = await TokenStorage.getUserId();
      await DioClient.instance.put(
        '${ApiConstants.profiles}/$userId',
        data: {
          'university': _universityCtrl.text.trim(),
          'major': _majorCtrl.text.trim(),
          'studiedYear': _studiedYear,
          'phoneNumber': _phoneCtrl.text.trim(),
          'bioDescription': _bioCtrl.text.trim(),
        },
      );
      if (!mounted) return;
      context.go('/dashboard');
    } on DioException catch (e) {
      final msg = e.response?.data?.toString() ?? 'Failed to save profile';
      if (mounted) AppSnackbar.showError(context, msg);
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Profile Setup'),
        actions: [
          TextButton(
            onPressed: () => context.go('/dashboard'),
            child: const Text('Skip'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.outlineVariant),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.person_add_outlined,
                        size: 48, color: AppColors.primary),
                    const SizedBox(height: 12),
                    Text('Complete Your Profile',
                        style: AppTextStyles.titleLarge),
                    const SizedBox(height: 4),
                    Text(
                      'Help us personalize your career roadmap',
                      style: AppTextStyles.bodyMedium
                          .copyWith(color: AppColors.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text('Academic Information', style: AppTextStyles.titleMedium),
              const SizedBox(height: 16),
              AppTextField(
                label: 'University',
                controller: _universityCtrl,
                prefixIcon: const Icon(Icons.school_outlined),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Major / Field of Study',
                controller: _majorCtrl,
                prefixIcon: const Icon(Icons.book_outlined),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Year selector
              Text('Year of Study', style: AppTextStyles.bodyMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: List.generate(
                  5,
                  (i) => ChoiceChip(
                    label: Text('Year ${i + 1}'),
                    selected: _studiedYear == i + 1,
                    onSelected: (_) => setState(() => _studiedYear = i + 1),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Text('Contact & Bio', style: AppTextStyles.titleMedium),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Phone Number (optional)',
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                prefixIcon: const Icon(Icons.phone_outlined),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Bio (optional)',
                controller: _bioCtrl,
                maxLines: 4,
                minLines: 3,
                maxLength: 300,
                prefixIcon: const Icon(Icons.notes_outlined),
                textInputAction: TextInputAction.done,
              ),
              const SizedBox(height: 32),

              AppButton(
                label: 'Complete Setup',
                onPressed: _submit,
                isLoading: _loading,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Skip for now',
                variant: AppButtonVariant.text,
                onPressed: () => context.go('/dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
