import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncState = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: asyncState.when(
        loading: () => const _SettingsSkeleton(),
        error: (err, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load settings',
          subtitle: err is AppException ? err.message : 'Please try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(settingsProvider),
        ),
        data: (data) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          children: [
            _AccountSection(data: data),
            const SizedBox(height: 16),
            _PersonalInfoSection(data: data),
            const SizedBox(height: 16),
            _SkillsSection(data: data),
            const SizedBox(height: 16),
            if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) ...[
              const _MessagingSection(),
              const SizedBox(height: 16),
            ],
            _SecuritySection(email: data.user.email),
            if (kDebugMode &&
                defaultTargetPlatform == TargetPlatform.android) ...[
              const SizedBox(height: 16),
              const _FirebaseTestSection(),
            ],
            const SizedBox(height: 16),
            _DangerZone(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _MessagingSection extends StatefulWidget {
  const _MessagingSection();

  @override
  State<_MessagingSection> createState() => _MessagingSectionState();
}

class _MessagingSectionState extends State<_MessagingSection> {
  String? _token;
  bool _loading = false;

  Future<void> _enable() async {
    setState(() => _loading = true);
    try {
      final settings = await FirebaseMessaging.instance.requestPermission();
      final allowed =
          settings.authorizationStatus == AuthorizationStatus.authorized ||
              settings.authorizationStatus == AuthorizationStatus.provisional;
      if (!allowed) {
        if (mounted) {
          AppSnackbar.showError(context, 'Notification permission denied');
        }
        return;
      }

      await FirebaseMessaging.instance.subscribeToTopic('secompass_updates');
      final token = await FirebaseMessaging.instance.getToken();
      await FirebaseAnalytics.instance.logEvent(name: 'notifications_enabled');
      if (!mounted) return;
      setState(() => _token = token);
      AppSnackbar.showSuccess(context, 'Notifications enabled');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copyToken() async {
    final token = _token;
    if (token == null) return;
    await Clipboard.setData(ClipboardData(text: token));
    if (mounted) AppSnackbar.showSuccess(context, 'FCM token copied');
  }

  @override
  Widget build(BuildContext context) {
    final style = OutlinedButton.styleFrom(
      minimumSize: const Size(0, 36),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      shape: const StadiumBorder(),
      textStyle: AppTextStyles.labelSmall,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Notifications', style: AppTextStyles.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Receive SECompass announcements through Firebase Messaging.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  style: style,
                  icon: _loading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.notifications_active_outlined,
                          size: 16),
                  label: const Text('Enable'),
                  onPressed: _loading ? null : _enable,
                ),
                if (_token != null)
                  OutlinedButton.icon(
                    style: style,
                    icon: const Icon(Icons.copy_outlined, size: 16),
                    label: const Text('Copy token'),
                    onPressed: _copyToken,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FirebaseTestSection extends StatelessWidget {
  const _FirebaseTestSection();

  Future<void> _testHandledException(BuildContext context) async {
    try {
      throw StateError('Manual handled exception test');
    } catch (error, stack) {
      await FirebaseAnalytics.instance.logEvent(name: 'firebase_debug_test');
      await FirebaseCrashlytics.instance.recordError(
        error,
        stack,
        reason: 'Settings handled exception test',
      );
      if (context.mounted) {
        AppSnackbar.showSuccess(context, 'Test event and exception sent');
      }
    }
  }

  Future<void> _testCrash(BuildContext context) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Test app crash?',
      message:
          'The app will close immediately. Reopen it to upload the crash report.',
      confirmLabel: 'Crash App',
      isDanger: true,
    );
    if (confirmed != true) return;

    await FirebaseAnalytics.instance.logEvent(name: 'firebase_crash_test');
    FirebaseCrashlytics.instance.log('Manual crash test from Settings');
    FirebaseCrashlytics.instance.crash();
  }

  @override
  Widget build(BuildContext context) {
    final style = OutlinedButton.styleFrom(
      minimumSize: const Size(0, 36),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      shape: const StadiumBorder(),
      textStyle: AppTextStyles.labelSmall,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Firebase Tests', style: AppTextStyles.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Debug builds only',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  style: style,
                  icon: const Icon(Icons.bug_report_outlined, size: 16),
                  label: const Text('Handled error'),
                  onPressed: () => _testHandledException(context),
                ),
                OutlinedButton.icon(
                  style: style.copyWith(
                    foregroundColor:
                        const WidgetStatePropertyAll(AppColors.error),
                  ),
                  icon: const Icon(Icons.warning_amber_rounded, size: 16),
                  label: const Text('Crash app'),
                  onPressed: () => _testCrash(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Account Section
// ---------------------------------------------------------------------------

class _AccountSection extends ConsumerWidget {
  const _AccountSection({required this.data});
  final SettingsData data;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = data.user;
    final initials = _initials(user.fullName ?? user.email);
    final roleName = _roleName(user.role);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundImage:
                  user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
              backgroundColor: AppColors.primaryContainer,
              child: user.avatarUrl == null
                  ? Text(
                      initials,
                      style: const TextStyle(
                          fontSize: 20,
                          color: Colors.white,
                          fontWeight: FontWeight.bold),
                    )
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              user.fullName ?? 'User',
              style: AppTextStyles.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              user.email,
              style: AppTextStyles.bodyMedium
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(roleName,
                  style: AppTextStyles.labelSmall
                      .copyWith(color: AppColors.primary)),
            ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Edit Account',
              variant: AppButtonVariant.outlined,
              leadingIcon: const Icon(Icons.edit_outlined, size: 18),
              onPressed: () => _showAccountEditSheet(context, ref, data),
            ),
          ],
        ),
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  static String _roleName(int role) => switch (role) {
        0 => 'Admin',
        1 => 'Manager',
        _ => 'Student',
      };

  void _showAccountEditSheet(
      BuildContext context, WidgetRef ref, SettingsData data) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (ctx) => _AccountEditSheet(
        initialName: data.user.fullName ?? '',
        initialAvatarUrl: data.user.avatarUrl ?? '',
        onSaved: (name, url) async {
          Navigator.of(ctx).pop();
          try {
            await ref.read(settingsProvider.notifier).updateUser(
                  name.isEmpty ? null : name,
                  url.isEmpty ? null : url,
                );
            if (context.mounted) {
              AppSnackbar.showSuccess(context, 'Account updated');
            }
          } on AppException catch (e) {
            if (context.mounted) AppSnackbar.showError(context, e.message);
          }
        },
      ),
    );
  }
}

class _AccountEditSheet extends StatefulWidget {
  const _AccountEditSheet({
    required this.initialName,
    required this.initialAvatarUrl,
    required this.onSaved,
  });
  final String initialName;
  final String initialAvatarUrl;
  final Future<void> Function(String name, String avatarUrl) onSaved;

  @override
  State<_AccountEditSheet> createState() => _AccountEditSheetState();
}

class _AccountEditSheetState extends State<_AccountEditSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _avatarCtrl;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialName);
    _avatarCtrl = TextEditingController(text: widget.initialAvatarUrl);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _avatarCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Edit Account', style: AppTextStyles.titleLarge),
          const SizedBox(height: 20),
          AppTextField(
            label: 'Full Name',
            controller: _nameCtrl,
            prefixIcon: const Icon(Icons.person_outline),
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Avatar URL (optional)',
            controller: _avatarCtrl,
            keyboardType: TextInputType.url,
            prefixIcon: const Icon(Icons.image_outlined),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Save Changes',
            isLoading: _isSaving,
            onPressed: _isSaving
                ? null
                : () async {
                    setState(() => _isSaving = true);
                    await widget.onSaved(_nameCtrl.text, _avatarCtrl.text);
                    if (mounted) setState(() => _isSaving = false);
                  },
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Personal Information Section
// ---------------------------------------------------------------------------

class _PersonalInfoSection extends ConsumerStatefulWidget {
  const _PersonalInfoSection({required this.data});
  final SettingsData data;

  @override
  ConsumerState<_PersonalInfoSection> createState() =>
      _PersonalInfoSectionState();
}

class _PersonalInfoSectionState extends ConsumerState<_PersonalInfoSection> {
  bool _isEditing = false;
  bool _isSaving = false;

  late final TextEditingController _bioCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _universityCtrl;
  late final TextEditingController _majorCtrl;
  int? _studiedYear;

  @override
  void initState() {
    super.initState();
    final p = widget.data.profile;
    _bioCtrl = TextEditingController(text: p.bioDescription ?? '');
    _phoneCtrl = TextEditingController(text: p.phoneNumber ?? '');
    _universityCtrl = TextEditingController(text: p.university ?? '');
    _majorCtrl = TextEditingController(text: p.major ?? '');
    _studiedYear = p.studiedYear;
  }

  void _syncControllers(SettingsData data) {
    final p = data.profile;
    _bioCtrl.text = p.bioDescription ?? '';
    _phoneCtrl.text = p.phoneNumber ?? '';
    _universityCtrl.text = p.university ?? '';
    _majorCtrl.text = p.major ?? '';
    setState(() => _studiedYear = p.studiedYear);
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    _phoneCtrl.dispose();
    _universityCtrl.dispose();
    _majorCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(settingsProvider.notifier).updateProfile(UpdateProfileDto(
            bioDescription:
                _bioCtrl.text.trim().isEmpty ? null : _bioCtrl.text.trim(),
            phoneNumber:
                _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
            university: _universityCtrl.text.trim().isEmpty
                ? null
                : _universityCtrl.text.trim(),
            major:
                _majorCtrl.text.trim().isEmpty ? null : _majorCtrl.text.trim(),
            studiedYear: _studiedYear,
          ));
      setState(() => _isEditing = false);
      if (mounted) AppSnackbar.showSuccess(context, 'Profile updated');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.data.profile;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Personal Information', style: AppTextStyles.titleMedium),
                const Spacer(),
                if (!_isEditing)
                  TextButton(
                    onPressed: () => setState(() => _isEditing = true),
                    child: const Text('Edit'),
                  )
                else ...[
                  TextButton(
                    onPressed: () {
                      _syncControllers(widget.data);
                      setState(() => _isEditing = false);
                    },
                    child: const Text('Cancel'),
                  ),
                ],
              ],
            ),
            const Divider(height: 20),
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 200),
              crossFadeState: _isEditing
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              firstChild: _ReadView(profile: profile),
              secondChild: _EditForm(
                bioCtrl: _bioCtrl,
                phoneCtrl: _phoneCtrl,
                universityCtrl: _universityCtrl,
                majorCtrl: _majorCtrl,
                studiedYear: _studiedYear,
                onYearChanged: (y) => setState(() => _studiedYear = y),
                isSaving: _isSaving,
                onSave: _save,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadView extends StatelessWidget {
  const _ReadView({required this.profile});
  final ProfileDto profile;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _InfoRow(label: 'Bio', value: profile.bioDescription),
        _InfoRow(label: 'Phone', value: profile.phoneNumber),
        _InfoRow(label: 'University', value: profile.university),
        _InfoRow(label: 'Major', value: profile.major),
        _InfoRow(
          label: 'Year of Study',
          value: profile.studiedYear != null
              ? 'Year ${profile.studiedYear}'
              : null,
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: AppTextStyles.labelMedium
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
          ),
          Expanded(
            child: Text(
              value ?? 'Not set',
              style: AppTextStyles.bodyMedium.copyWith(
                color: value != null ? AppColors.onSurface : AppColors.outline,
                fontStyle: value == null ? FontStyle.italic : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditForm extends StatelessWidget {
  const _EditForm({
    required this.bioCtrl,
    required this.phoneCtrl,
    required this.universityCtrl,
    required this.majorCtrl,
    required this.studiedYear,
    required this.onYearChanged,
    required this.isSaving,
    required this.onSave,
  });

  final TextEditingController bioCtrl;
  final TextEditingController phoneCtrl;
  final TextEditingController universityCtrl;
  final TextEditingController majorCtrl;
  final int? studiedYear;
  final ValueChanged<int?> onYearChanged;
  final bool isSaving;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AppTextField(
          label: 'Bio',
          controller: bioCtrl,
          maxLines: 4,
          maxLength: 300,
        ),
        const SizedBox(height: 12),
        AppTextField(
          label: 'Phone Number',
          controller: phoneCtrl,
          keyboardType: TextInputType.phone,
          prefixIcon: const Icon(Icons.phone_outlined),
        ),
        const SizedBox(height: 12),
        AppTextField(
          label: 'University',
          controller: universityCtrl,
          prefixIcon: const Icon(Icons.school_outlined),
        ),
        const SizedBox(height: 12),
        AppTextField(
          label: 'Major',
          controller: majorCtrl,
          prefixIcon: const Icon(Icons.book_outlined),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<int?>(
          initialValue: studiedYear,
          decoration: InputDecoration(
            labelText: 'Year of Study',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(4)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('Not specified')),
            ...List.generate(
              5,
              (i) =>
                  DropdownMenuItem(value: i + 1, child: Text('Year ${i + 1}')),
            ),
          ],
          onChanged: onYearChanged,
        ),
        const SizedBox(height: 20),
        AppButton(
          label: 'Save',
          isLoading: isSaving,
          onPressed: isSaving ? null : onSave,
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Skills Section
// ---------------------------------------------------------------------------

class _SkillsSection extends ConsumerStatefulWidget {
  const _SkillsSection({required this.data});
  final SettingsData data;

  @override
  ConsumerState<_SkillsSection> createState() => _SkillsSectionState();
}

class _SkillsSectionState extends ConsumerState<_SkillsSection> {
  final _searchCtrl = TextEditingController();
  final _focusNode = FocusNode();
  String _searchText = '';
  bool _showDropdown = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  List<TechnicalSkillDto> get _suggestions {
    if (_searchText.isEmpty) return const [];
    final q = _searchText.toLowerCase();
    final existing =
        widget.data.skills.map((s) => s.skillName.toLowerCase()).toSet();
    return widget.data.technicalSkills
        .where((s) =>
            s.skillName.toLowerCase().contains(q) &&
            !existing.contains(s.skillName.toLowerCase()))
        .take(6)
        .toList();
  }

  Future<void> _addSkill(String skillName) async {
    _searchCtrl.clear();
    setState(() {
      _searchText = '';
      _showDropdown = false;
    });
    try {
      await ref.read(settingsProvider.notifier).addSkill(skillName);
      if (mounted) AppSnackbar.showSuccess(context, '$skillName added');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    }
  }

  Future<void> _removeSkill(String skillId, String skillName) async {
    try {
      await ref.read(settingsProvider.notifier).removeSkill(skillId);
      if (mounted) AppSnackbar.showSuccess(context, '$skillName removed');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final skills = widget.data.skills;
    final suggestions = _suggestions;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Skills', style: AppTextStyles.titleMedium),
                const Spacer(),
                Text(
                  '${skills.length} / 50',
                  style: AppTextStyles.labelSmall
                      .copyWith(color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (skills.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: skills
                    .map((skill) => InputChip(
                          label: Text(skill.skillName,
                              style: AppTextStyles.labelSmall),
                          backgroundColor: _skillColor(skill.skillName),
                          deleteIcon: const Icon(Icons.close, size: 14),
                          onDeleted: () =>
                              _removeSkill(skill.skillId, skill.skillName),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 16),
            ],
            if (skills.length < 50) ...[
              TextField(
                controller: _searchCtrl,
                focusNode: _focusNode,
                decoration: InputDecoration(
                  hintText: 'Search and add a skill…',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(4)),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                ),
                onChanged: (v) => setState(() {
                  _searchText = v;
                  _showDropdown = v.isNotEmpty;
                }),
              ),
              if (_showDropdown && suggestions.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.outlineVariant),
                    boxShadow: const [
                      BoxShadow(blurRadius: 4, color: Colors.black12)
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: suggestions
                        .map((s) => ListTile(
                              title: Text(s.skillName,
                                  style: AppTextStyles.bodyMedium),
                              subtitle: Text(s.category,
                                  style: AppTextStyles.labelSmall),
                              dense: true,
                              onTap: () => _addSkill(s.skillName),
                            ))
                        .toList(),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Color _skillColor(String name) {
    const palette = [
      AppColors.nodeStatusInProgressFill,
      AppColors.successContainer,
      AppColors.warningContainer,
      AppColors.nodeStatusSkippedFill,
      Color(0xFFFCE8E6),
    ];
    return palette[name.hashCode.abs() % palette.length];
  }
}

// ---------------------------------------------------------------------------
// Security Section
// ---------------------------------------------------------------------------

class _SecuritySection extends StatelessWidget {
  const _SecuritySection({required this.email});
  final String email;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Security', style: AppTextStyles.titleMedium),
            const Divider(height: 20),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading:
                  const Icon(Icons.email_outlined, color: AppColors.primary),
              title: Text(email, style: AppTextStyles.bodyMedium),
              subtitle: Text(
                'Primary account credential',
                style: AppTextStyles.labelSmall
                    .copyWith(color: AppColors.onSurfaceVariant),
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.successContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Verified',
                  style: AppTextStyles.labelSmall
                      .copyWith(color: AppColors.success),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Danger Zone
// ---------------------------------------------------------------------------

class _DangerZone extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Danger Zone',
                style:
                    AppTextStyles.titleMedium.copyWith(color: AppColors.error)),
            const SizedBox(height: 8),
            Text(
              'Deactivating your account will remove access to all your data.',
              style: AppTextStyles.bodySmall
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Deactivate Account',
              variant: AppButtonVariant.danger,
              leadingIcon: const Icon(Icons.warning_outlined, size: 18),
              onPressed: () => _confirmDeactivate(context, ref),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDeactivate(BuildContext context, WidgetRef ref) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Deactivate Account',
      message:
          'This will permanently deactivate your account and you will lose access to all your data. Are you sure?',
      confirmLabel: 'Deactivate',
      isDanger: true,
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(settingsProvider.notifier).deactivateAccount();
      if (context.mounted) context.go('/login');
    } on AppException catch (e) {
      if (context.mounted) AppSnackbar.showError(context, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

class _SettingsSkeleton extends StatelessWidget {
  const _SettingsSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          SkeletonCard(),
          SizedBox(height: 12),
          SkeletonCard(),
          SizedBox(height: 12),
          SkeletonCard(),
        ],
      ),
    );
  }
}
