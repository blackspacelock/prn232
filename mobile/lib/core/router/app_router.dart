import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';
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
import '../../features/roadmap/screens/roadmap_viewer_screen.dart';
import '../../features/roadmap/screens/learning_resources_screen.dart';
import '../../features/skill_gap/screens/skill_gap_selection_screen.dart';
import '../../features/skill_gap/screens/skill_input_screen.dart';
import '../../features/skill_gap/screens/skill_gap_analysis_screen.dart';
import '../../features/ai_mentor/screens/chat_screen.dart';
import '../../features/job_trends/screens/market_pulse_screen.dart';
import '../../features/portfolio/screens/portfolio_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../widgets/app_bottom_nav.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    observers: !kIsWeb && defaultTargetPlatform == TargetPlatform.android
        ? [FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance)]
        : const [],
    initialLocation: '/',
    redirect: (context, state) async {
      final isAuthenticated = authState.valueOrNull != null;
      final location = state.matchedLocation;

      final publicRoutes = ['/', '/login', '/register'];
      final isPublic = publicRoutes.contains(location);

      if (!isAuthenticated && !isPublic) return '/login';
      if (isAuthenticated && isPublic) return '/dashboard';
      return null;
    },
    routes: [
      // Public routes
      GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/profile-setup',
        builder: (_, __) => const ProfileSetupScreen(),
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
            path: '/career-roles',
            builder: (_, __) => const CareerRoleSelectionScreen(),
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
            builder: (_, __) => const SkillGapSelectionScreen(),
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
