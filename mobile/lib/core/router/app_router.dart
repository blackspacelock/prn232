import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/landing_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/roadmap/screens/career_role_selection_screen.dart';
import '../../features/roadmap/screens/role_selection_loading_screen.dart';
import '../../features/roadmap/screens/roadmap_catalog_screen.dart';
import '../../features/roadmap/screens/roadmaps_manage_screen.dart';
import '../../features/roadmap/screens/roadmap_viewer_screen.dart';
import '../../features/roadmap/screens/learning_resources_screen.dart';
import '../../features/skill_gap/screens/skill_input_screen.dart';
import '../../features/skill_gap/screens/skill_gap_analysis_screen.dart';
import '../../features/ai_mentor/screens/chat_screen.dart';
import '../../features/job_trends/screens/market_pulse_screen.dart';
import '../../features/portfolio/screens/github_portfolio_screen.dart';
import '../../features/portfolio/screens/portfolio_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../widgets/app_bottom_nav.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) async {
      final isAuthenticated = authState.valueOrNull != null;
      final location = state.matchedLocation;
      final path = state.uri.path;

      final publicRoutes = ['/', '/login', '/register'];
      final isPublicPortfolio = RegExp(r'^/portfolio/[^/]+$').hasMatch(path);
      final isPublicCatalog = path == '/explore/roles' ||
          RegExp(r'^/explore/roles/[^/]+$').hasMatch(path) ||
          RegExp(r'^/explore/roadmaps/[^/]+$').hasMatch(path);
      final isPublic = publicRoutes.contains(location) ||
          isPublicPortfolio ||
          isPublicCatalog;

      if (!isAuthenticated && !isPublic) {
        return '/login';
      }
      if (isAuthenticated && publicRoutes.contains(location)) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      // Public routes
      GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/portfolio/:userId',
        builder: (_, state) => GithubPortfolioScreen(
          userId: state.pathParameters['userId']!,
        ),
      ),
      GoRoute(
        path: '/profile-setup',
        builder: (_, __) => const ProfileSetupScreen(),
      ),
      GoRoute(
        path: '/explore/roles',
        builder: (_, __) => const RoadmapCatalogScreen(publicCatalog: true),
      ),
      GoRoute(
        path: '/explore/roles/:roleId',
        builder: (_, state) => RoadmapRoleTemplatesScreen(
          roleId: state.pathParameters['roleId']!,
          publicCatalog: true,
        ),
      ),
      GoRoute(
        path: '/explore/roadmaps/:roadmapId',
        builder: (_, state) => RoadmapTemplateDetailScreen(
          roadmapId: state.pathParameters['roadmapId']!,
          publicCatalog: true,
        ),
      ),

      // Authenticated shell with bottom nav
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) =>
            AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/roadmaps',
            builder: (_, __) => const RoadmapsManageScreen(),
          ),
          GoRoute(
            path: '/career-roles',
            builder: (_, __) => const CareerRoleSelectionScreen(),
          ),
          GoRoute(
            path: '/catalog',
            builder: (_, __) => const RoadmapCatalogScreen(),
          ),
          GoRoute(
            path: '/catalog/roles/:roleId',
            builder: (_, state) => RoadmapRoleTemplatesScreen(
              roleId: state.pathParameters['roleId']!,
            ),
          ),
          GoRoute(
            path: '/roadmap-template/:roadmapId',
            builder: (_, state) => RoadmapTemplateDetailScreen(
              roadmapId: state.pathParameters['roadmapId']!,
            ),
          ),
          GoRoute(
            path: '/career-roles/loading',
            builder: (_, state) => RoleSelectionLoadingScreen(
              careerRoadmapId:
                  state.uri.queryParameters['careerRoadmapId'] ?? '',
              profileId: state.uri.queryParameters['profileId'] ?? '',
            ),
          ),
          GoRoute(
            path: '/roadmap/:personalRoadmapId',
            builder: (_, state) => RoadmapViewerScreen(
              personalRoadmapId: state.pathParameters['personalRoadmapId']!,
            ),
          ),
          GoRoute(
            path: '/roadmap/:id/node/:nodeId/resources',
            builder: (_, state) => LearningResourcesScreen(
              personalRoadmapId: state.pathParameters['id']!,
              nodeId: state.pathParameters['nodeId']!,
            ),
          ),
          GoRoute(
            path: '/skill-gap/select',
            builder: (_, __) => const SkillGapAnalysisScreen(
              careerRoadmapId: '',
            ),
          ),
          GoRoute(
            path: '/skill-gap/input',
            builder: (_, state) => SkillInputScreen(
              careerRoadmapId:
                  state.uri.queryParameters['careerRoadmapId'] ?? '',
              careerRoleId: state.uri.queryParameters['careerRoleId'],
            ),
          ),
          GoRoute(
            path: '/skill-gap/result',
            builder: (_, state) => SkillGapAnalysisScreen(
              careerRoadmapId:
                  state.uri.queryParameters['careerRoadmapId'] ?? '',
            ),
          ),
          GoRoute(
            path: '/mentor',
            builder: (_, __) => const ChatScreen(),
          ),
          GoRoute(
            path: '/mentor/:sessionId',
            builder: (_, state) => ChatScreen(
              sessionId: state.pathParameters['sessionId'],
            ),
          ),
          GoRoute(
            path: '/market-pulse',
            builder: (_, __) => const MarketPulseScreen(),
          ),
          GoRoute(
            path: '/market',
            builder: (_, __) => const MarketPulseScreen(),
          ),
          GoRoute(
            path: '/portfolio',
            builder: (_, __) => const PortfolioScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});
