import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBackButton extends StatelessWidget {
  const AppBackButton({super.key, this.fallbackLocation});

  final String? fallbackLocation;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Back',
      icon: const Icon(Icons.arrow_back),
      onPressed: () => goBack(context, fallbackLocation: fallbackLocation),
    );
  }

  static void goBack(BuildContext context, {String? fallbackLocation}) {
    if (context.canPop()) {
      context.pop();
      return;
    }

    final location = GoRouterState.of(context).uri.path;
    final fallback = fallbackLocation ?? _fallbackFor(location);
    if (fallback == location) return;
    context.go(fallback);
  }
}

String _fallbackFor(String location) {
  if (location.startsWith('/roadmap/') && location.contains('/node/')) {
    final segments = location.split('/');
    if (segments.length > 2 && segments[2].isNotEmpty) {
      return '/roadmap/${segments[2]}';
    }
  }
  if (location.startsWith('/roadmap/')) return '/roadmaps';
  if (location.startsWith('/career-roles/loading')) return '/career-roles';
  if (location.startsWith('/career-roles')) return '/roadmaps';
  if (location.startsWith('/skill-gap/input')) return '/skill-gap/select';
  if (location.startsWith('/skill-gap/result')) return '/skill-gap/select';
  if (location.startsWith('/skill-gap/select')) return '/dashboard';
  if (location.startsWith('/mentor/')) return '/mentor';
  if (location == '/login') return '/';
  if (location == '/register') return '/login';
  if (location == '/profile-setup') return '/login';
  return '/dashboard';
}
