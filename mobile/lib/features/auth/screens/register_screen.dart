import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/google_sign_in_service.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  bool _submitted = false;
  int _passwordStrength = 0;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitted = true);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            _nameCtrl.text.trim(),
            _emailCtrl.text.trim(),
            _passwordCtrl.text,
          );
      if (!mounted) return;
      context.go('/profile-setup');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitGoogle() async {
    setState(() => _loading = true);
    try {
      final idToken = await GoogleSignInService.getIdToken();
      if (idToken == null) return;

      final user = await ref.read(authProvider.notifier).googleLogin(idToken);
      if (!mounted) return;
      context.go(user.hasProfile ? '/dashboard' : '/profile-setup');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } catch (e) {
      debugPrint('Google sign-in failed: $e');
      if (mounted) {
        AppSnackbar.showError(context, 'Google sign-in failed');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _updatePasswordStrength(String value) {
    final rules = [
      value.length >= 8,
      RegExp(r'\d').hasMatch(value),
      RegExp(r'[A-Z]').hasMatch(value),
      RegExp(r'[^A-Za-z0-9]').hasMatch(value),
    ];
    setState(() => _passwordStrength = rules.where((rule) => rule).length);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/login'),
        title: const Text('Register'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                children: [
                  Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        autovalidateMode: _submitted
                            ? AutovalidateMode.onUserInteraction
                            : AutovalidateMode.disabled,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const _AuthLogo(),
                            const SizedBox(height: 20),
                            Text(
                              'Create your account',
                              style: AppTextStyles.headlineMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Build your career roadmap in minutes',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 20),
                            const _RegisterStepper(),
                            const SizedBox(height: 24),
                            AppTextField(
                              label: 'Full Name',
                              controller: _nameCtrl,
                              prefixIcon: const Icon(Icons.person_outlined),
                              autofillHints: const [AutofillHints.name],
                              textInputAction: TextInputAction.next,
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Name required'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Email address',
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: const Icon(Icons.mail_outlined),
                              autofillHints: const [AutofillHints.email],
                              textInputAction: TextInputAction.next,
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'Email required';
                                }
                                if (!v.contains('@')) {
                                  return 'Invalid email';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Password',
                              controller: _passwordCtrl,
                              isPassword: true,
                              prefixIcon: const Icon(Icons.lock_outlined),
                              autofillHints: const [AutofillHints.newPassword],
                              textInputAction: TextInputAction.next,
                              onChanged: _updatePasswordStrength,
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'Password required';
                                }
                                if (v.length < 8) {
                                  return 'At least 8 characters';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 8),
                            _PasswordStrengthBar(strength: _passwordStrength),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Confirm Password',
                              controller: _confirmCtrl,
                              isPassword: true,
                              prefixIcon: const Icon(Icons.lock_outlined),
                              autofillHints: const [AutofillHints.newPassword],
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _submit(),
                              validator: (v) {
                                if (v != _passwordCtrl.text) {
                                  return 'Passwords do not match';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            AppButton(
                              label: 'Create Account',
                              onPressed: _submit,
                              isLoading: _loading,
                            ),
                            const SizedBox(height: 12),
                            AppButton(
                              label: 'Continue with Google',
                              variant: AppButtonVariant.outlined,
                              leadingIcon: const Icon(Icons.g_mobiledata),
                              onPressed: _submitGoogle,
                            ),
                            const SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Already have an account? ',
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () => context.go('/login'),
                                  child: const Text('Sign in'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => context.go('/'),
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Back to landing'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthLogo extends StatelessWidget {
  const _AuthLogo();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          child:
              const Icon(Icons.explore, color: AppColors.onPrimary, size: 30),
        ),
        const SizedBox(height: 8),
        Text(
          'SECompass',
          style: AppTextStyles.titleLarge.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _RegisterStepper extends StatelessWidget {
  const _RegisterStepper();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: _StepItem(label: 'Account', active: true)),
        _StepDivider(),
        Expanded(child: _StepItem(label: 'Profile')),
        _StepDivider(),
        Expanded(child: _StepItem(label: 'Done')),
      ],
    );
  }
}

class _StepItem extends StatelessWidget {
  const _StepItem({required this.label, this.active = false});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : AppColors.outline;
    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: active ? AppColors.primary : AppColors.surfaceContainer,
            shape: BoxShape.circle,
            border: Border.all(color: color),
          ),
          child: active
              ? const Icon(Icons.check, color: AppColors.onPrimary, size: 14)
              : null,
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(color: color),
        ),
      ],
    );
  }
}

class _StepDivider extends StatelessWidget {
  const _StepDivider();

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 26),
        child: Container(height: 1, color: AppColors.outlineVariant),
      ),
    );
  }
}

class _PasswordStrengthBar extends StatelessWidget {
  const _PasswordStrengthBar({required this.strength});

  final int strength;

  @override
  Widget build(BuildContext context) {
    final colors = [
      AppColors.error,
      AppColors.warning,
      const Color(0xFFFBBC04),
      AppColors.success,
    ];

    return Row(
      children: List.generate(
        4,
        (index) => Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 5,
            margin: EdgeInsets.only(right: index == 3 ? 0 : 6),
            decoration: BoxDecoration(
              color: index < strength
                  ? colors[(strength - 1).clamp(0, 3)]
                  : AppColors.outlineVariant,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
        ),
      ),
    );
  }
}
