import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/google_sign_in_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/models/app_exception.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _submitted = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitted = true);
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final user = await ref.read(authProvider.notifier).login(
            _emailCtrl.text.trim(),
            _passwordCtrl.text,
          );
      if (!mounted) return;
      if (!user.hasProfile) {
        context.go('/profile-setup');
      } else {
        context.go('/dashboard');
      }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        children: [
          Expanded(
            child: SafeArea(
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
                                    'Welcome back',
                                    style: AppTextStyles.headlineMedium,
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Sign in to continue your career journey',
                                    style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.onSurfaceVariant),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 24),
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
                                    autofillHints: const [
                                      AutofillHints.password
                                    ],
                                    textInputAction: TextInputAction.done,
                                    onSubmitted: (_) => _submit(),
                                    validator: (v) => (v == null || v.isEmpty)
                                        ? 'Password required'
                                        : null,
                                  ),
                                  const SizedBox(height: 8),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () {},
                                      child: const Text('Forgot password?'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  AppButton(
                                    label: 'Sign In',
                                    onPressed: _submit,
                                    isLoading: _loading,
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      const Expanded(child: Divider()),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16),
                                        child: Text(
                                          'or continue with',
                                          style: AppTextStyles.bodySmall
                                              .copyWith(
                                                  color: AppColors
                                                      .onSurfaceVariant),
                                        ),
                                      ),
                                      const Expanded(child: Divider()),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  AppButton(
                                    label: 'Continue with Google',
                                    variant: AppButtonVariant.outlined,
                                    leadingIcon: _GoogleIcon(),
                                    onPressed: _submitGoogle,
                                  ),
                                  const SizedBox(height: 20),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        "Don't have an account? ",
                                        style:
                                            AppTextStyles.bodyMedium.copyWith(
                                          color: AppColors.onSurfaceVariant,
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () =>
                                            context.go('/register'),
                                        child: const Text('Register'),
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
          ),
        ],
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

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) => const SizedBox(
        width: 20,
        height: 20,
        child: Icon(Icons.g_mobiledata, size: 20),
      );
}
