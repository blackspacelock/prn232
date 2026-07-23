import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/profile_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_back_button.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../roadmap/providers/roadmap_providers.dart';

class SkillInputScreen extends ConsumerStatefulWidget {
  const SkillInputScreen({
    super.key,
    required this.careerRoadmapId,
    this.careerRoleId,
  });

  final String careerRoadmapId;
  final String? careerRoleId;

  @override
  ConsumerState<SkillInputScreen> createState() => _SkillInputScreenState();
}

class _SkillInputScreenState extends ConsumerState<SkillInputScreen> {
  final _skillController = TextEditingController();
  Timer? _debounce;
  String _query = '';
  bool _isMutating = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _skillController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim().toLowerCase());
    });
  }

  Future<void> _addSkill(String skillName) async {
    if (skillName.trim().isEmpty || _isMutating) return;
    setState(() => _isMutating = true);
    try {
      await ref.read(skillInputProvider.notifier).addSkill(skillName.trim());
      _skillController.clear();
      setState(() => _query = '');
      if (mounted) AppSnackbar.showSuccess(context, 'Skill added');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isMutating = false);
    }
  }

  Future<void> _removeSkill(String skillId) async {
    try {
      await ref.read(skillInputProvider.notifier).removeSkill(skillId);
      if (mounted) AppSnackbar.showSuccess(context, 'Skill removed');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final skills = ref.watch(skillInputProvider);
    final technicalSkills = ref.watch(technicalSkillsProvider);
    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(),
        title: const Text('Your Skills'),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: AppButton(
          label: 'Analyze Skill Gap',
          leadingIcon: const Icon(Icons.arrow_forward),
          onPressed: () => context.go(
            '/skill-gap/result?careerRoadmapId=${widget.careerRoadmapId}&autoAnalyze=true',
          ),
        ),
      ),
      body: skills.when(
        loading: () => const _SkillInputSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load your skills',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(skillInputProvider),
        ),
        data: (items) {
          final suggestions = technicalSkills.valueOrNull ?? const [];
          final filteredSuggestions = _query.isEmpty
              ? const <TechnicalSkillDto>[]
              : suggestions
                  .where(
                      (skill) => skill.skillName.toLowerCase().contains(_query))
                  .where((skill) => !items.any(
                        (item) =>
                            item.skillName.toLowerCase() ==
                            skill.skillName.toLowerCase(),
                      ))
                  .take(6)
                  .toList();

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              Text(
                '2. Review & Update Your Skills',
                style: AppTextStyles.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                "These are the skills you've added to your profile.",
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              Text('${items.length}/50 skills',
                  style: AppTextStyles.labelLarge),
              const SizedBox(height: 10),
              if (items.isEmpty)
                const EmptyStateView(
                  icon: Icons.psychology_outlined,
                  title: 'No skills yet',
                  subtitle: 'Add a few skills to get a useful analysis.',
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: items
                      .map(
                        (skill) => InputChip(
                          label: Text(skill.skillName),
                          backgroundColor: _skillColor(skill.skillName),
                          onDeleted: () => _removeSkill(skill.skillId),
                        ),
                      )
                      .toList(),
                ),
              const SizedBox(height: 24),
              AppTextField(
                controller: _skillController,
                label: 'Search and add a skill...',
                prefixIcon: const Icon(Icons.search),
                enabled: items.length < 50 && !_isMutating,
                onChanged: _onSearchChanged,
                onSubmitted: (_) {
                  if (filteredSuggestions.length == 1) {
                    _addSkill(filteredSuggestions.single.skillName);
                  }
                },
              ),
              if (filteredSuggestions.isNotEmpty) ...[
                const SizedBox(height: 8),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.outlineVariant),
                  ),
                  child: Column(
                    children: filteredSuggestions
                        .map(
                          (skill) => ListTile(
                            title: Text(skill.skillName),
                            subtitle: Text(skill.category),
                            onTap: () => _addSkill(skill.skillName),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Color _skillColor(String skillName) {
    final colors = [
      AppColors.nodeStatusInProgressFill,
      AppColors.successContainer,
      AppColors.warningContainer,
      AppColors.surfaceContainer,
    ];
    return colors[skillName.hashCode.abs() % colors.length];
  }
}

class _SkillInputSkeleton extends StatelessWidget {
  const _SkillInputSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 100),
        SkeletonCard(height: 64),
        SkeletonCard(height: 180),
      ],
    );
  }
}
