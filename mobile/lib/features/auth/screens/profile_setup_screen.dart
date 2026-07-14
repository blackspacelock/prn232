import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../profile/providers/profile_provider.dart';

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
  int? _studiedYear;

  @override
  void initState() {
    super.initState();
    _bioCtrl.addListener(() => setState(() {}));
  }

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

    final dto = UpdateProfileDto(
      university: _emptyToNull(_universityCtrl.text),
      major: _emptyToNull(_majorCtrl.text),
      studiedYear: _studiedYear,
      phoneNumber: _emptyToNull(_phoneCtrl.text),
      bioDescription: _emptyToNull(_bioCtrl.text),
    );

    try {
      await ref.read(profileSetupProvider.notifier).updateProfile(dto);
      if (!mounted) return;
      AppSnackbar.showSuccess(context, 'Profile setup complete');
      context.go('/dashboard');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } catch (_) {
      if (mounted) AppSnackbar.showError(context, 'Failed to save profile');
    }
  }

  String? _emptyToNull(String value) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(profileSetupProvider).isLoading;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Profile Setup'),
        actions: [
          TextButton(
            onPressed: isLoading ? null : () => context.go('/dashboard'),
            child: const Text('Skip'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _OnboardingStepper(),
                    const SizedBox(height: 24),
                    Text(
                      'Tell us about yourself',
                      style: AppTextStyles.headlineMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Help us personalize your roadmap',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    const _SectionTitle(
                      icon: Icons.school_outlined,
                      label: 'Academic information',
                    ),
                    const SizedBox(height: 12),
                    AppTextField(
                      label: 'University',
                      hint: 'FPT University',
                      controller: _universityCtrl,
                      prefixIcon: const Icon(Icons.account_balance_outlined),
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Major',
                      hint: 'Software Engineering',
                      controller: _majorCtrl,
                      prefixIcon: const Icon(Icons.menu_book_outlined),
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<int>(
                      initialValue: _studiedYear,
                      decoration: const InputDecoration(
                        labelText: 'Year of Study',
                        prefixIcon: Icon(Icons.calendar_today_outlined),
                      ),
                      items: List.generate(
                        5,
                        (index) => DropdownMenuItem(
                          value: index + 1,
                          child:
                              Text('${index + 1}${_ordinal(index + 1)} year'),
                        ),
                      ),
                      onChanged: isLoading
                          ? null
                          : (value) => setState(() => _studiedYear = value),
                    ),
                    const SizedBox(height: 28),
                    const _SectionTitle(
                      icon: Icons.badge_outlined,
                      label: 'Contact and bio',
                    ),
                    const SizedBox(height: 12),
                    AppTextField(
                      label: 'Phone Number',
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      prefixIcon: const Icon(Icons.phone_outlined),
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        final phone = value?.trim() ?? '';
                        if (phone.isEmpty) {
                          return null;
                        }
                        if (phone.length < 8) {
                          return 'Phone number looks too short';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _bioCtrl,
                      maxLines: 5,
                      maxLength: 300,
                      textInputAction: TextInputAction.done,
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(300),
                      ],
                      decoration: const InputDecoration(
                        labelText: 'Bio / About Me',
                        hintText:
                            'What are you learning, building, or aiming for?',
                        prefixIcon: Icon(Icons.notes_outlined),
                        alignLabelWithHint: true,
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        '${_bioCtrl.text.length}/300 characters',
                        style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    AppButton(
                      label: 'Complete Setup',
                      onPressed: _submit,
                      isLoading: isLoading,
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Skip for now',
                      variant: AppButtonVariant.text,
                      onPressed:
                          isLoading ? null : () => context.go('/dashboard'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static String _ordinal(int value) {
    return switch (value) {
      1 => 'st',
      2 => 'nd',
      3 => 'rd',
      _ => 'th',
    };
  }
}

class _OnboardingStepper extends StatelessWidget {
  const _OnboardingStepper();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: _StepItem(label: 'Account', complete: true)),
        _StepDivider(active: true),
        Expanded(child: _StepItem(label: 'Profile', active: true)),
        _StepDivider(),
        Expanded(child: _StepItem(label: 'Done')),
      ],
    );
  }
}

class _StepItem extends StatelessWidget {
  const _StepItem({
    required this.label,
    this.active = false,
    this.complete = false,
  });

  final String label;
  final bool active;
  final bool complete;

  @override
  Widget build(BuildContext context) {
    final color = active || complete ? AppColors.primary : AppColors.outline;
    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: complete || active
                ? AppColors.primary
                : AppColors.surfaceContainer,
            shape: BoxShape.circle,
            border: Border.all(color: color),
          ),
          child: complete
              ? const Icon(Icons.check, color: AppColors.onPrimary, size: 16)
              : active
                  ? const Icon(Icons.person,
                      color: AppColors.onPrimary, size: 15)
                  : null,
        ),
        const SizedBox(height: 6),
        Text(label, style: AppTextStyles.labelSmall.copyWith(color: color)),
      ],
    );
  }
}

class _StepDivider extends StatelessWidget {
  const _StepDivider({this.active = false});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 28),
        child: Container(
          height: 2,
          color: active ? AppColors.primary : AppColors.outlineVariant,
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 8),
        Text(label, style: AppTextStyles.titleMedium),
      ],
    );
  }
}
