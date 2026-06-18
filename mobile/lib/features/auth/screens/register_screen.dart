import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/models/app_exception.dart';
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
      final account = await GoogleSignIn(scopes: ['email', 'profile']).signIn();
      if (account == null) return;

      final auth = await account.authentication;
      final idToken = auth.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw const AuthException('Google sign-in did not return an ID token');
      }

      final user = await ref.read(authProvider.notifier).googleLogin(idToken);
      if (!mounted) return;
      context.go(user.hasProfile ? '/dashboard' : '/profile-setup');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } catch (_) {
      if (mounted) AppSnackbar.showError(context, 'Google sign-in failed');
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
      body: Column(
        children: [
          Container(
            height: 200,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1A73E8), Color(0xFF0D47A1)],
              ),
            ),
            child: SafeArea(
              child: Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => context.go('/login'),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.explore,
                            color: Colors.white, size: 36),
                        const SizedBox(height: 8),
                        Text(
                          'Create Account',
                          style: AppTextStyles.headlineMedium.copyWith(
                              color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Start your engineering journey today',
                          style: AppTextStyles.bodyMedium.copyWith(
                              color: Colors.white.withValues(alpha: 0.85)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              child: Transform.translate(
                offset: const Offset(0, -24),
                child: Card(
                  elevation: 4,
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Join SECompass',
                              style: AppTextStyles.headlineMedium),
                          const SizedBox(height: 4),
                          Text(
                            'Build your career roadmap in minutes',
                            style: AppTextStyles.bodyMedium
                                .copyWith(color: AppColors.onSurfaceVariant),
                          ),
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
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Already have an account? ',
                                style: AppTextStyles.bodyMedium.copyWith(
                                    color: AppColors.onSurfaceVariant),
                              ),
                              TextButton(
                                onPressed: () => context.go('/login'),
                                child: const Text('Sign In'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
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
