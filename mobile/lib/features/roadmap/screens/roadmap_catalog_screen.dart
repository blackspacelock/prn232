import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/roadmap_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/empty_state_view.dart';
import '../../../core/widgets/skeleton_loader.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/roadmap_providers.dart';

class RoadmapCatalogScreen extends ConsumerStatefulWidget {
  const RoadmapCatalogScreen({super.key, this.publicCatalog = false});

  final bool publicCatalog;

  @override
  ConsumerState<RoadmapCatalogScreen> createState() =>
      _RoadmapCatalogScreenState();
}

class _RoadmapCatalogScreenState extends ConsumerState<RoadmapCatalogScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  String _query = '';
  bool _sortDescending = false;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), () {
      if (mounted) setState(() => _query = value.trim().toLowerCase());
    });
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(careerRolesProvider);
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Browse Career Roles'),
        actions: [
          IconButton(
            tooltip: _sortDescending ? 'Sort ascending' : 'Sort descending',
            onPressed: () => setState(() => _sortDescending = !_sortDescending),
            icon: Icon(
              _sortDescending ? Icons.arrow_downward : Icons.arrow_upward,
            ),
          ),
        ],
      ),
      body: roles.when(
        loading: () => const _CatalogSkeleton(),
        error: (error, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Could not load career roles',
          subtitle: error.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(careerRolesProvider),
        ),
        data: (items) {
          final visible = items.where((role) {
            return _query.isEmpty ||
                role.name.toLowerCase().contains(_query) ||
                (role.description ?? '').toLowerCase().contains(_query);
          }).toList()
            ..sort((a, b) => _sortDescending
                ? b.name.compareTo(a.name)
                : a.name.compareTo(b.name));

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(careerRolesProvider);
              await ref.read(careerRolesProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: [
                Text(
                  'Explore roadmap templates by role',
                  style: AppTextStyles.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Browse public templates before generating a personal roadmap.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                AppTextField(
                  controller: _searchController,
                  label: 'Search career roles',
                  prefixIcon: const Icon(Icons.search),
                  textInputAction: TextInputAction.search,
                  onChanged: _onSearchChanged,
                ),
                const SizedBox(height: 16),
                if (visible.isEmpty)
                  EmptyStateView(
                    icon: Icons.search_off,
                    title: 'No roles match your search',
                    subtitle: 'Try another role name or keyword.',
                    actionLabel: 'Clear Search',
                    onAction: () {
                      _searchController.clear();
                      _searchDebounce?.cancel();
                      setState(() => _query = '');
                    },
                  )
                else
                  ...visible.map(
                    (role) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _CatalogRoleCard(
                        role: role,
                        onTap: () => context.go(
                          widget.publicCatalog
                              ? '/explore/roles/${role.careerRoleId}'
                              : '/catalog/roles/${role.careerRoleId}',
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class RoadmapRoleTemplatesScreen extends ConsumerWidget {
  const RoadmapRoleTemplatesScreen({
    super.key,
    required this.roleId,
    this.publicCatalog = false,
  });

  final String roleId;
  final bool publicCatalog;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(careerRolesProvider);
    final roadmaps = ref.watch(roadmapsByRoleProvider(roleId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Roadmap Templates')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(roadmapsByRoleProvider(roleId));
          await ref.read(roadmapsByRoleProvider(roleId).future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            roles.maybeWhen(
              data: (items) {
                CareerRoleDto? role;
                for (final item in items) {
                  if (item.careerRoleId == roleId) {
                    role = item;
                    break;
                  }
                }
                return _RoleHeader(role: role);
              },
              orElse: () => const _RoleHeader(),
            ),
            const SizedBox(height: 20),
            Text('Templates', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            roadmaps.when(
              loading: () => const Column(
                children: [
                  SkeletonCard(height: 108),
                  SkeletonCard(height: 108),
                  SkeletonCard(height: 108),
                ],
              ),
              error: (error, _) => EmptyStateView(
                icon: Icons.error_outline,
                title: 'Could not load templates',
                subtitle: error.toString(),
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(roadmapsByRoleProvider(roleId)),
              ),
              data: (templates) {
                if (templates.isEmpty) {
                  return const EmptyStateView(
                    icon: Icons.route_outlined,
                    title: 'No templates yet',
                    subtitle: 'This career role does not have templates yet.',
                  );
                }
                return Column(
                  children: templates
                      .map(
                        (template) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _TemplateCard(
                            template: template,
                            onTap: () => context.go(
                              publicCatalog
                                  ? '/explore/roadmaps/${template.careerRoadmapId}'
                                  : '/roadmap-template/${template.careerRoadmapId}',
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class RoadmapTemplateDetailScreen extends ConsumerStatefulWidget {
  const RoadmapTemplateDetailScreen({
    super.key,
    required this.roadmapId,
    this.publicCatalog = false,
  });

  final String roadmapId;
  final bool publicCatalog;

  @override
  ConsumerState<RoadmapTemplateDetailScreen> createState() =>
      _RoadmapTemplateDetailScreenState();
}

class _RoadmapTemplateDetailScreenState
    extends ConsumerState<RoadmapTemplateDetailScreen> {
  bool _isGenerating = false;

  Future<void> _generate(CareerRoadmapWithNodesDto template) async {
    final user = ref.read(authProvider).valueOrNull;
    if (user == null) {
      context.go('/login');
      return;
    }

    final profileId = await ref.read(profileIdProvider.future);
    if (!mounted) return;
    if (profileId.isEmpty) {
      AppSnackbar.showError(context, 'Please complete your profile first.');
      context.go('/profile-setup');
      return;
    }

    setState(() => _isGenerating = true);
    try {
      final roadmap = await ref
          .read(roadmapRepositoryProvider)
          .generateRoadmap(profileId, template.careerRoadmapId);
      ref
        ..invalidate(personalRoadmapsProvider)
        ..invalidate(dashboardDataProvider);
      if (!mounted) return;
      context.go('/roadmap/${roadmap.personalRoadmapId}');
    } catch (error) {
      if (mounted) AppSnackbar.showError(context, error.toString());
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final template = ref.watch(careerRoadmapTemplateProvider(widget.roadmapId));
    final isAuthenticated = ref.watch(authProvider).valueOrNull != null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: template.when(
        loading: () => const _TemplateDetailSkeleton(),
        error: (error, _) => CustomScrollView(
          slivers: [
            const SliverAppBar(title: Text('Roadmap Template')),
            SliverFillRemaining(
              child: EmptyStateView(
                icon: Icons.error_outline,
                title: 'Could not load template',
                subtitle: error.toString(),
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(
                  careerRoadmapTemplateProvider(widget.roadmapId),
                ),
              ),
            ),
          ],
        ),
        data: (data) {
          final nodes = [...data.nodes]
            ..sort((a, b) => a.order.compareTo(b.order));
          final phases = _buildTemplatePhases(nodes);
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 230,
                title: Text(data.name),
                flexibleSpace: FlexibleSpaceBar(
                  background: _TemplateHeader(template: data),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: AppButton(
                    label: isAuthenticated
                        ? 'Generate Personal Roadmap'
                        : 'Sign in to Generate',
                    isLoading: _isGenerating,
                    leadingIcon: const Icon(Icons.rocket_launch_outlined),
                    onPressed: _isGenerating ? null : () => _generate(data),
                  ),
                ),
              ),
              if (nodes.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyStateView(
                    icon: Icons.map_outlined,
                    title: 'No topics defined',
                    subtitle:
                        'This roadmap template does not have milestones yet.',
                  ),
                )
              else
                SliverList.separated(
                  itemCount: phases.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final phase = phases[index];
                    return Padding(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        index == 0 ? 8 : 0,
                        16,
                        index == phases.length - 1 ? 24 : 0,
                      ),
                      child: _TemplatePhaseTile(
                        phase: phase,
                        onNodeTap: (node) => _showNodeSheet(context, node),
                      ),
                    );
                  },
                ),
            ],
          );
        },
      ),
    );
  }

  void _showNodeSheet(BuildContext context, RoadmapTemplateNodeDto node) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.62,
        minChildSize: 0.45,
        maxChildSize: 0.9,
        builder: (context, controller) => _TemplateNodeSheet(
          node: node,
          scrollController: controller,
        ),
      ),
    );
  }
}

class _CatalogRoleCard extends StatelessWidget {
  const _CatalogRoleCard({required this.role, required this.onTap});

  final CareerRoleDto role;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Row(
          children: [
            const CircleAvatar(
              backgroundColor: AppColors.primaryContainer,
              child: Icon(Icons.work_outline, color: Colors.white),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(role.name, style: AppTextStyles.titleSmall),
                  if (role.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      role.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _RoleHeader extends StatelessWidget {
  const _RoleHeader({this.role});

  final CareerRoleDto? role;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CircleAvatar(
            backgroundColor: AppColors.primaryContainer,
            child: Icon(Icons.route_outlined, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(role?.name ?? 'Career Role',
                    style: AppTextStyles.titleMedium),
                const SizedBox(height: 6),
                Text(
                  role?.description ??
                      'Curated roadmap templates for this career path.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.template, required this.onTap});

  final CareerRoadmapDto template;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              template.isCustom
                  ? Icons.auto_awesome_outlined
                  : Icons.map_outlined,
              color: AppColors.primary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          template.name,
                          style: AppTextStyles.titleSmall,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _SmallBadge(
                        label: template.isCustom ? 'Custom' : 'Template',
                      ),
                    ],
                  ),
                  if (template.description != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      template.description!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Text(
                    'Preview topics and resources',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _TemplateHeader extends StatelessWidget {
  const _TemplateHeader({required this.template});

  final CareerRoadmapWithNodesDto template;

  @override
  Widget build(BuildContext context) {
    final levelCount = _templateLevelCount(template.nodes);
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 88, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _SmallBadge(label: template.isCustom ? 'Custom' : 'Template'),
              const SizedBox(width: 8),
              _SmallBadge(label: '${template.nodes.length} topics'),
              if (levelCount > 0) ...[
                const SizedBox(width: 8),
                _SmallBadge(label: '$levelCount levels'),
              ],
            ],
          ),
          const SizedBox(height: 14),
          Text(
            template.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.titleLarge,
          ),
          if (template.description != null) ...[
            const SizedBox(height: 8),
            Text(
              template.description!,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TemplatePhaseTile extends StatelessWidget {
  const _TemplatePhaseTile({
    required this.phase,
    required this.onNodeTap,
  });

  final _TemplatePhase phase;
  final ValueChanged<RoadmapTemplateNodeDto> onNodeTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: ExpansionTile(
        initiallyExpanded: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        collapsedShape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(phase.name, style: AppTextStyles.titleMedium),
        subtitle: Text(
          '${phase.nodes.length} topic${phase.nodes.length == 1 ? '' : 's'}',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        children: phase.nodes
            .map(
              (node) => Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: _TemplateNodeCard(
                  node: node,
                  onTap: () => onNodeTap(node),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _TemplateNodeCard extends StatelessWidget {
  const _TemplateNodeCard({required this.node, required this.onTap});

  final RoadmapTemplateNodeDto node;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.trip_origin, size: 16, color: AppColors.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(node.displayName, style: AppTextStyles.titleSmall),
                  if (node.displayDescription != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      node.displayDescription!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _SmallBadge(label: node.nodeType),
                      _SmallBadge(label: node.requirementType),
                      if (node.node?.technicalSkills.isNotEmpty ?? false)
                        _SmallBadge(label: '${node.node!.technicalSkills.length} skills'),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _TemplateNodeSheet extends ConsumerWidget {
  const _TemplateNodeSheet({
    required this.node,
    required this.scrollController,
  });

  final RoadmapTemplateNodeDto node;
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resources = ref.watch(learningResourcesProvider(node.nodeId));
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Text(node.displayName, style: AppTextStyles.headlineMedium),
        if (node.displayDescription != null) ...[
          const SizedBox(height: 8),
          Text(
            node.displayDescription!,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _SmallBadge(label: node.nodeType),
            _SmallBadge(label: node.requirementType),
            _SmallBadge(label: 'Order ${node.order}'),
          ],
        ),
        const SizedBox(height: 24),
        Text('Technical Skills', style: AppTextStyles.titleSmall),
        const SizedBox(height: 12),
        if (node.node?.technicalSkills.isEmpty ?? true)
          Text(
            'No technical skills are attached to this topic yet.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: node.node!.technicalSkills
                .map((skill) => _SmallBadge(label: skill.skillName))
                .toList(),
          ),
        const SizedBox(height: 24),
        Text('Learning Resources', style: AppTextStyles.titleSmall),
        const SizedBox(height: 12),
        resources.when(
          loading: () => const Column(
            children: [
              SkeletonCard(height: 76),
              SkeletonCard(height: 76),
            ],
          ),
          error: (error, _) => EmptyStateView(
            icon: Icons.error_outline,
            title: 'Could not load resources',
            subtitle: error.toString(),
            actionLabel: 'Retry',
            onAction: () =>
                ref.invalidate(learningResourcesProvider(node.nodeId)),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const EmptyStateView(
                icon: Icons.menu_book_outlined,
                title: 'No resources yet',
                subtitle: 'Resources will appear when this topic has links.',
              );
            }
            return Column(
              children: items
                  .map(
                    (resource) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ResourceTile(resource: resource),
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _ResourceTile extends StatelessWidget {
  const _ResourceTile({required this.resource});

  final LearningResourceDto resource;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.menu_book_outlined, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(resource.resourceName, style: AppTextStyles.titleSmall),
                const SizedBox(height: 4),
                Text(
                  '${resource.provider} • ${resource.resourceType}',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  resource.isFree ? 'Free' : 'Paid',
                  style: AppTextStyles.labelSmall.copyWith(
                    color: resource.isFree
                        ? AppColors.success
                        : AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  const _SmallBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _CatalogSkeleton extends StatelessWidget {
  const _CatalogSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonCard(height: 72),
        SkeletonCard(height: 104),
        SkeletonCard(height: 104),
        SkeletonCard(height: 104),
      ],
    );
  }
}

class _TemplateDetailSkeleton extends StatelessWidget {
  const _TemplateDetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverAppBar(title: Text('Roadmap Template')),
        SliverList.list(
          children: const [
            Padding(
              padding: EdgeInsets.all(16),
              child: SkeletonCard(height: 170),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: SkeletonCard(height: 118),
            ),
            Padding(
              padding: EdgeInsets.all(16),
              child: SkeletonCard(height: 118),
            ),
          ],
        ),
      ],
    );
  }
}

List<_TemplatePhase> _buildTemplatePhases(List<RoadmapTemplateNodeDto> nodes) {
  final byId = {for (final node in nodes) node.roadmapNodeId: node};
  final roots = nodes
      .where((node) =>
          node.parentRoadmapNodeId == null ||
          !byId.containsKey(node.parentRoadmapNodeId))
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));

  if (roots.isEmpty) {
    return [_TemplatePhase(name: 'Phase 1', nodes: nodes)];
  }

  final phases = <_TemplatePhase>[];
  final grouped = <String>{};
  for (final root in roots) {
    final children = nodes
        .where((node) => node.parentRoadmapNodeId == root.roadmapNodeId)
        .toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    grouped.add(root.roadmapNodeId);
    grouped.addAll(children.map((node) => node.roadmapNodeId));
    phases.add(
      _TemplatePhase(
        name: root.displayName,
        nodes: children.isEmpty ? [root] : children,
      ),
    );
  }

  final ungrouped =
      nodes.where((node) => !grouped.contains(node.roadmapNodeId)).toList();
  if (ungrouped.isNotEmpty) {
    phases.add(_TemplatePhase(name: 'Additional Topics', nodes: ungrouped));
  }
  return phases;
}

int _templateLevelCount(List<RoadmapTemplateNodeDto> nodes) {
  if (nodes.isEmpty) return 0;
  final byId = {for (final node in nodes) node.roadmapNodeId: node};
  final depthById = <String, int>{};

  int depthOf(RoadmapTemplateNodeDto node, [Set<String>? visiting]) {
    if (depthById.containsKey(node.roadmapNodeId)) {
      return depthById[node.roadmapNodeId]!;
    }
    final seen = visiting ?? <String>{};
    final parentId = node.parentRoadmapNodeId;
    if (parentId == null ||
        !byId.containsKey(parentId) ||
        seen.contains(node.roadmapNodeId)) {
      depthById[node.roadmapNodeId] = 0;
      return 0;
    }
    seen.add(node.roadmapNodeId);
    final depth = depthOf(byId[parentId]!, seen) + 1;
    depthById[node.roadmapNodeId] = depth;
    return depth;
  }

  for (final node in nodes) {
    depthOf(node);
  }
  return depthById.values.reduce((a, b) => a > b ? a : b) + 1;
}

class _TemplatePhase {
  const _TemplatePhase({required this.name, required this.nodes});

  final String name;
  final List<RoadmapTemplateNodeDto> nodes;
}
