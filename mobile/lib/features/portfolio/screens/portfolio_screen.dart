import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/models/app_exception.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/portfolio_provider.dart';

class PortfolioScreen extends ConsumerStatefulWidget {
  const PortfolioScreen({super.key});

  @override
  ConsumerState<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends ConsumerState<PortfolioScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _filterVisibility = 'All';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncState = ref.watch(portfolioProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('E-Portfolio'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Share portfolio',
            onPressed: _sharePortfolio,
          ),
        ],
      ),
      body: asyncState.when(
        loading: () => const _PortfolioSkeleton(),
        error: (err, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load portfolio',
          subtitle: err is AppException ? err.message : 'Please try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(portfolioProvider),
        ),
        data: (state) => _PortfolioBody(
          state: state,
          searchQuery: _searchQuery,
          filterVisibility: _filterVisibility,
          searchController: _searchController,
          onSearchChanged: (q) => setState(() => _searchQuery = q),
          onFilterChanged: (f) => setState(() => _filterVisibility = f),
          onAddRepo: () => _showRepoSheet(context, null),
          onEditRepo: (repo) => _showRepoSheet(context, repo),
          onDeleteRepo: (repo) => _deleteRepo(repo),
          onOpenUrl: _openUrl,
          onRunAnalysis: _runAnalysis,
          onSharePortfolio: _sharePortfolio,
          onViewPublicPortfolio: _viewPublicPortfolio,
        ),
      ),
      floatingActionButton: asyncState.hasValue
          ? FloatingActionButton.extended(
              onPressed: () => _showRepoSheet(context, null),
              icon: const Icon(Icons.add),
              label: const Text('Add Repository'),
            )
          : null,
    );
  }

  void _sharePortfolio() {
    Share.share(
      'Check out my SECompass portfolio: ${_publicPortfolioUrl()}',
    );
  }

  Future<void> _viewPublicPortfolio() => _openUrl(_publicPortfolioUrl());

  String _publicPortfolioUrl() {
    final user = ref.read(authProvider).valueOrNull;
    final userId = user?.id ?? user?.profileId ?? '';
    return 'https://secompass.app/portfolio/$userId';
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        AppSnackbar.showError(context, 'Could not open URL');
      }
    }
  }

  Future<void> _runAnalysis() async {
    try {
      await ref.read(portfolioProvider.notifier).runAnalysis();
      if (mounted) {
        AppSnackbar.showSuccess(context, 'Portfolio analysis complete');
      }
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    }
  }

  Future<void> _deleteRepo(GitHubRepositoryDto repo) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Repository',
      message: 'Remove "${repo.repositoryName}" from your portfolio?',
      confirmLabel: 'Delete',
      isDanger: true,
    );
    if (confirmed != true) return;
    try {
      await ref.read(portfolioProvider.notifier).deleteRepo(repo.githubRepoId);
      if (mounted) AppSnackbar.showSuccess(context, 'Repository removed');
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    }
  }

  void _showRepoSheet(BuildContext context, GitHubRepositoryDto? existing) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetCtx) => _RepoFormSheet(
        existing: existing,
        onSaved: (dto) async {
          Navigator.of(sheetCtx).pop();
          await _saveRepo(existing, dto);
        },
      ),
    );
  }

  Future<void> _saveRepo(
    GitHubRepositoryDto? existing,
    _RepoFormData data,
  ) async {
    try {
      if (existing != null) {
        await ref.read(portfolioProvider.notifier).updateRepo(
              existing.githubRepoId,
              UpdateRepoDto(
                repositoryName: data.name,
                repoUrl: data.url,
                description: data.description,
                isPrivate: data.isPrivate,
              ),
            );
        if (mounted) AppSnackbar.showSuccess(context, 'Repository updated');
      } else {
        final user = ref.read(authProvider).valueOrNull;
        final profileId =
            user?.profileId ?? await TokenStorage.getProfileId() ?? '';
        await ref.read(portfolioProvider.notifier).addRepo(
              CreateRepoDto(
                profileId: profileId,
                repositoryName: data.name,
                repoUrl: data.url,
                description: data.description,
                isPrivate: data.isPrivate,
              ),
            );
        if (mounted) AppSnackbar.showSuccess(context, 'Repository added');
      }
    } on AppException catch (e) {
      if (mounted) AppSnackbar.showError(context, e.message);
    }
  }
}

class _PortfolioBody extends StatelessWidget {
  const _PortfolioBody({
    required this.state,
    required this.searchQuery,
    required this.filterVisibility,
    required this.searchController,
    required this.onSearchChanged,
    required this.onFilterChanged,
    required this.onAddRepo,
    required this.onEditRepo,
    required this.onDeleteRepo,
    required this.onOpenUrl,
    required this.onRunAnalysis,
    required this.onSharePortfolio,
    required this.onViewPublicPortfolio,
  });

  final PortfolioState state;
  final String searchQuery;
  final String filterVisibility;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onFilterChanged;
  final VoidCallback onAddRepo;
  final ValueChanged<GitHubRepositoryDto> onEditRepo;
  final ValueChanged<GitHubRepositoryDto> onDeleteRepo;
  final ValueChanged<String> onOpenUrl;
  final VoidCallback onRunAnalysis;
  final VoidCallback onSharePortfolio;
  final VoidCallback onViewPublicPortfolio;

  List<GitHubRepositoryDto> get _filteredRepos {
    var list = state.repos;
    if (filterVisibility == 'Public') {
      list = list.where((r) => !r.isPrivate).toList();
    }
    if (filterVisibility == 'Private') {
      list = list.where((r) => r.isPrivate).toList();
    }
    if (searchQuery.isNotEmpty) {
      final q = searchQuery.toLowerCase();
      list = list
          .where(
            (r) =>
                r.repositoryName.toLowerCase().contains(q) ||
                (r.repoUrl.toLowerCase().contains(q)) ||
                (r.description?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final filteredRepos = _filteredRepos;

    return RefreshIndicator(
      onRefresh: () async {
        // pull-to-refresh handled by parent invalidation if needed
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
        children: [
          const SizedBox(height: 12),
          _PortfolioHeaderCard(
            onShare: onSharePortfolio,
            onViewPublicPortfolio: onViewPublicPortfolio,
          ),
          const SizedBox(height: 16),
          _AnalysisSection(
            analysis: state.analysis,
            isAnalyzing: state.isAnalyzing,
            onAnalyze: onRunAnalysis,
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Search repositories…',
            controller: searchController,
            prefixIcon: const Icon(Icons.search),
            onChanged: onSearchChanged,
          ),
          const SizedBox(height: 12),
          _VisibilityFilterChips(
            selected: filterVisibility,
            onChanged: onFilterChanged,
          ),
          const SizedBox(height: 16),
          if (filteredRepos.isEmpty && state.repos.isEmpty)
            EmptyStateView(
              icon: Icons.folder_special_outlined,
              title: 'No repositories yet',
              subtitle: 'Add your GitHub projects to showcase your work.',
              actionLabel: 'Add Repository',
              onAction: onAddRepo,
            )
          else if (filteredRepos.isEmpty)
            const EmptyStateView(
              icon: Icons.search_off_outlined,
              title: 'No results',
              subtitle: 'Try different search terms or filters.',
            )
          else
            ...filteredRepos.map((repo) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _RepoCard(
                    repo: repo,
                    onOpen: () => onOpenUrl(repo.repoUrl),
                    onEdit: () => onEditRepo(repo),
                    onDelete: () => onDeleteRepo(repo),
                  ),
                )),
        ],
      ),
    );
  }
}

class _PortfolioHeaderCard extends StatelessWidget {
  const _PortfolioHeaderCard({
    required this.onShare,
    required this.onViewPublicPortfolio,
  });
  final VoidCallback onShare;
  final VoidCallback onViewPublicPortfolio;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.folder_special,
                    color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'My E-Portfolio',
                    style: AppTextStyles.titleLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'View Public Portfolio',
                    variant: AppButtonVariant.tonal,
                    leadingIcon: const Icon(Icons.open_in_new, size: 18),
                    onPressed: onViewPublicPortfolio,
                  ),
                ),
                const SizedBox(width: 8),
                AppButton(
                  label: 'Share',
                  variant: AppButtonVariant.outlined,
                  leadingIcon: const Icon(Icons.share, size: 18),
                  onPressed: onShare,
                  width: 110,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AnalysisSection extends StatelessWidget {
  const _AnalysisSection({
    required this.analysis,
    required this.isAnalyzing,
    required this.onAnalyze,
  });

  final PortfolioAnalysisDto? analysis;
  final bool isAnalyzing;
  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('AI Portfolio Analysis', style: AppTextStyles.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            AppButton(
              label: isAnalyzing ? 'Analyzing…' : 'Analyze My Portfolio',
              isLoading: isAnalyzing,
              onPressed: isAnalyzing ? null : onAnalyze,
              leadingIcon: const Icon(Icons.psychology, size: 18),
            ),
            if (analysis != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              if (analysis!.summary != null) ...[
                Text(analysis!.summary!, style: AppTextStyles.bodyMedium),
                const SizedBox(height: 12),
              ],
              if (analysis!.strengths.isNotEmpty) ...[
                Text('Strengths', style: AppTextStyles.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: analysis!.strengths
                      .map((s) => Chip(
                            label: Text(s, style: AppTextStyles.labelSmall),
                            backgroundColor: AppColors.successContainer,
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
              ],
              if (analysis!.recommendations.isNotEmpty) ...[
                Text('Recommendations', style: AppTextStyles.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: analysis!.recommendations
                      .map((r) => Chip(
                            label: Text(r, style: AppTextStyles.labelSmall),
                            backgroundColor: AppColors.nodeStatusInProgressFill,
                          ))
                      .toList(),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _VisibilityFilterChips extends StatelessWidget {
  const _VisibilityFilterChips(
      {required this.selected, required this.onChanged});
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const options = ['All', 'Public', 'Private'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: options
            .map((opt) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(opt),
                    selected: selected == opt,
                    onSelected: (_) => onChanged(opt),
                    selectedColor:
                        AppColors.primaryContainer.withValues(alpha: 0.2),
                    checkmarkColor: AppColors.primary,
                  ),
                ))
            .toList(),
      ),
    );
  }
}

class _RepoCard extends StatelessWidget {
  const _RepoCard({
    required this.repo,
    required this.onOpen,
    required this.onEdit,
    required this.onDelete,
  });

  final GitHubRepositoryDto repo;
  final VoidCallback onOpen;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.folder_outlined,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    repo.repositoryName,
                    style: AppTextStyles.titleSmall.copyWith(
                      color: AppColors.primary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                _VisibilityBadge(isPrivate: repo.isPrivate),
              ],
            ),
            if (repo.description != null && repo.description!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                repo.description!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            Text(
              repo.repoUrl,
              style: AppTextStyles.bodySmall.copyWith(
                fontFamily: 'monospace',
                color: AppColors.onSurfaceVariant,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                AppButton(
                  label: 'Open',
                  variant: AppButtonVariant.tonal,
                  leadingIcon: const Icon(Icons.open_in_new, size: 16),
                  onPressed: onOpen,
                  width: 100,
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  tooltip: 'Edit',
                  onPressed: onEdit,
                ),
                IconButton(
                  icon:
                      const Icon(Icons.delete_outline, color: AppColors.error),
                  tooltip: 'Delete',
                  onPressed: onDelete,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _VisibilityBadge extends StatelessWidget {
  const _VisibilityBadge({required this.isPrivate});
  final bool isPrivate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color:
            isPrivate ? AppColors.warningContainer : AppColors.successContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        isPrivate ? 'Private' : 'Public',
        style: AppTextStyles.labelSmall.copyWith(
          color: isPrivate ? AppColors.warning : AppColors.success,
        ),
      ),
    );
  }
}

class _RepoFormData {
  final String name;
  final String url;
  final String? description;
  final bool isPrivate;
  const _RepoFormData({
    required this.name,
    required this.url,
    this.description,
    required this.isPrivate,
  });
}

class _RepoFormSheet extends StatefulWidget {
  const _RepoFormSheet({required this.existing, required this.onSaved});
  final GitHubRepositoryDto? existing;
  final ValueChanged<_RepoFormData> onSaved;

  @override
  State<_RepoFormSheet> createState() => _RepoFormSheetState();
}

class _RepoFormSheetState extends State<_RepoFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _urlCtrl;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  bool _isPrivate = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _urlCtrl = TextEditingController(text: e?.repoUrl ?? '');
    _nameCtrl = TextEditingController(text: e?.repositoryName ?? '');
    _descCtrl = TextEditingController(text: e?.description ?? '');
    _isPrivate = e?.isPrivate ?? false;
  }

  @override
  void dispose() {
    _urlCtrl.dispose();
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _extractNameFromUrl(String url) {
    if (_nameCtrl.text.isNotEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) {
      final segments = uri.pathSegments;
      if (segments.isNotEmpty) {
        _nameCtrl.text = segments.last;
      }
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isSaving = true);
    try {
      widget.onSaved(_RepoFormData(
        name: _nameCtrl.text.trim(),
        url: _urlCtrl.text.trim(),
        description:
            _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        isPrivate: _isPrivate,
      ));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existing != null;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              isEditing ? 'Edit Repository' : 'Add Repository',
              style: AppTextStyles.titleLarge,
            ),
            const SizedBox(height: 20),
            AppTextField(
              label: 'GitHub URL',
              controller: _urlCtrl,
              keyboardType: TextInputType.url,
              prefixIcon: const Icon(Icons.link),
              onChanged: _extractNameFromUrl,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'URL is required';
                final uri = Uri.tryParse(v.trim());
                if (uri == null || !uri.hasScheme) return 'Enter a valid URL';
                return null;
              },
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Repository Name',
              controller: _nameCtrl,
              prefixIcon: const Icon(Icons.folder_outlined),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Description (optional)',
              controller: _descCtrl,
              maxLines: 3,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('Private repository'),
              value: _isPrivate,
              onChanged: (v) => setState(() => _isPrivate = v),
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: 16),
            AppButton(
              label: isEditing ? 'Save Changes' : 'Add Repository',
              isLoading: _isSaving,
              onPressed: _isSaving ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}

class _PortfolioSkeleton extends StatelessWidget {
  const _PortfolioSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SkeletonCard(),
          const SizedBox(height: 12),
          const SkeletonCard(),
          const SizedBox(height: 12),
          ...List.generate(
            3,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: SkeletonCard(),
            ),
          ),
        ],
      ),
    );
  }
}
