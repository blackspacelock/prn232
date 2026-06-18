import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, required this.location});

  final Widget child;
  final String location;

  static const _tabs = [
    _Tab(icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Dashboard', route: '/dashboard'),
    _Tab(icon: Icons.map_outlined, activeIcon: Icons.map, label: 'Roadmap', route: '/career-roles'),
    _Tab(icon: Icons.smart_toy_outlined, activeIcon: Icons.smart_toy, label: 'AI Mentor', route: '/mentor'),
    _Tab(icon: Icons.trending_up_outlined, activeIcon: Icons.trending_up, label: 'Market', route: '/market-pulse'),
    _Tab(icon: Icons.folder_special_outlined, activeIcon: Icons.folder_special, label: 'Portfolio', route: '/portfolio'),
  ];

  int get _currentIndex {
    for (var i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].route)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          backgroundColor: AppColors.surfaceContainerLowest,
          indicatorColor: AppColors.primaryContainer.withValues(alpha: 0.2),
          onDestinationSelected: (index) => context.go(_tabs[index].route),
          destinations: _tabs
              .map(
                (tab) => NavigationDestination(
                  icon: Icon(tab.icon),
                  selectedIcon: Icon(tab.activeIcon, color: AppColors.primary),
                  label: tab.label,
                ),
              )
              .toList(),
        ),
      );
}

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({super.key, required this.currentIndex, required this.onTap});

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) => BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: onTap,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Roadmap'),
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy_outlined), label: 'AI Mentor'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up_outlined), label: 'Market'),
          BottomNavigationBarItem(icon: Icon(Icons.folder_special_outlined), label: 'Portfolio'),
        ],
      );
}

class _Tab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;

  const _Tab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
  });
}
