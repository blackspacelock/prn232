import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../theme/app_colors.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, required this.location});

  final Widget child;
  final String location;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: AppBottomNav(location: location),
    );
  }
}

class AppBottomNav extends ConsumerWidget {
  const AppBottomNav({super.key, required this.location});

  final String location;

  int get _currentIndex {
    if (location.startsWith('/career-roles') ||
        location.startsWith('/roadmaps') ||
        location.startsWith('/roadmap')) {
      return 1;
    }
    if (location.startsWith('/mentor')) return 2;
    if (location.startsWith('/market')) return 3;
    if (location.startsWith('/portfolio') || location.startsWith('/settings')) {
      return 4;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NavigationBar(
      selectedIndex: _currentIndex,
      backgroundColor: AppColors.surfaceContainerLowest,
      indicatorColor: AppColors.primaryContainer.withValues(alpha: 0.2),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Dashboard',
        ),
        NavigationDestination(
          icon: Icon(Icons.map_outlined),
          selectedIcon: Icon(Icons.map),
          label: 'Roadmap',
        ),
        NavigationDestination(
          icon: Icon(Icons.smart_toy_outlined),
          selectedIcon: Icon(Icons.smart_toy),
          label: 'Mentor',
        ),
        NavigationDestination(
          icon: Icon(Icons.trending_up_outlined),
          selectedIcon: Icon(Icons.trending_up),
          label: 'Market',
        ),
        NavigationDestination(
          icon: Icon(Icons.more_horiz),
          selectedIcon: Icon(Icons.more_horiz),
          label: 'More',
        ),
      ],
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/dashboard');
          case 1:
            context.go('/roadmaps');
          case 2:
            context.go('/mentor');
          case 3:
            context.go('/market');
          case 4:
            _showMoreSheet(context, ref);
        }
      },
    );
  }

  void _showMoreSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.folder_special_outlined),
              title: const Text('Portfolio'),
              onTap: () {
                Navigator.of(sheetContext).pop();
                context.go('/portfolio');
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.of(sheetContext).pop();
                context.go('/settings');
              },
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.error),
              title: const Text('Sign out'),
              onTap: () async {
                Navigator.of(sheetContext).pop();
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ],
        ),
      ),
    );
  }
}
