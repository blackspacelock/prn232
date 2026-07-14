# SECompass Mobile — Detailed Implementation & Integration Plan

> Feature-by-feature Flutter implementation guide. Each section mirrors the equivalent frontend page and specifies exact data flow, UI components, user interactions, state management, and backend wiring.

---

## Table of Contents

1. [Foundation Setup](#1-foundation-setup)
2. [Authentication — Landing, Login, Register](#2-authentication--landing-login-register)
3. [Profile Setup (Onboarding)](#3-profile-setup-onboarding)
4. [Dashboard](#4-dashboard)
5. [Roadmap Generation — Career Role Selection](#5-roadmap-generation--career-role-selection)
6. [Roadmap Viewer](#6-roadmap-viewer)
7. [Learning Resources](#7-learning-resources)
8. [Skill Gap Analysis](#8-skill-gap-analysis)
9. [AI Mentor Chat](#9-ai-mentor-chat)
10. [Market Pulse](#10-market-pulse)
11. [E-Portfolio & GitHub Repositories](#11-e-portfolio--github-repositories)
12. [Settings & Profile Management](#12-settings--profile-management)
13. [Navigation Shell](#13-navigation-shell)
14. [Shared Components Spec](#14-shared-components-spec)
15. [Data Models](#15-data-models)
16. [Repository Layer](#16-repository-layer)
17. [Riverpod Providers](#17-riverpod-providers)
18. [Error Handling & Token Refresh](#18-error-handling--token-refresh)

---

## 1. Foundation Setup

### 1.1 pubspec.yaml — Final Dependency List

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0
  go_router: ^13.0.0
  dio: ^5.4.0
  retrofit: ^4.1.0
  graphql_flutter: ^5.2.0-beta.8
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  flutter_animate: ^4.5.0
  fl_chart: ^0.68.0
  dash_chat_2: ^0.0.21
  shimmer: ^3.0.0
  flutter_markdown: ^0.7.3
  google_fonts: ^6.2.1
  google_sign_in: ^6.2.1
  envied: ^0.5.0
  cached_network_image: ^3.3.1
  url_launcher: ^6.3.0
  share_plus: ^9.0.0
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  retrofit_generator: ^8.1.0
  riverpod_generator: ^2.4.0
  riverpod_lint: ^2.3.0
  envied_generator: ^0.5.0
  mocktail: ^1.0.0
```

### 1.2 app_colors.dart

Extracted directly from the MD3 Tailwind color tokens used consistently across all 15 HTML prototypes:

```dart
class AppColors {
  // MD3 Primary family
  static const primary              = Color(0xFF005BBF);
  static const primaryContainer     = Color(0xFF1A73E8);
  static const onPrimary            = Color(0xFFFFFFFF);
  static const onPrimaryContainer   = Color(0xFFFFFFFF);
  static const primaryFixed         = Color(0xFFD8E2FF);
  static const primaryFixedDim      = Color(0xFFADC7FF);

  // MD3 Secondary family
  static const secondary            = Color(0xFF005AC1);
  static const secondaryContainer   = Color(0xFF4D8EFE);
  static const onSecondary          = Color(0xFFFFFFFF);

  // MD3 Surface family
  static const surface              = Color(0xFFF9F9FF);
  static const surfaceBright        = Color(0xFFF9F9FF);
  static const surfaceDim           = Color(0xFFD8D9E3);
  static const surfaceVariant       = Color(0xFFE0E2EC);
  static const surfaceContainer     = Color(0xFFECEDF7);
  static const surfaceContainerHigh = Color(0xFFE6E8F2);
  static const surfaceContainerLow  = Color(0xFFF2F3FD);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const background           = Color(0xFFF9F9FF);

  // MD3 On-surface
  static const onSurface            = Color(0xFF191C23);
  static const onSurfaceVariant     = Color(0xFF414754);
  static const onBackground         = Color(0xFF191C23);

  // MD3 Outline
  static const outline              = Color(0xFF727785);
  static const outlineVariant       = Color(0xFFC1C6D6);

  // MD3 Error
  static const error                = Color(0xFFBA1A1A);
  static const errorContainer       = Color(0xFFFFDAD6);
  static const onError              = Color(0xFFFFFFFF);
  static const onErrorContainer     = Color(0xFF93000A);

  // Semantic success
  static const success              = Color(0xFF1E8E3E);
  static const successContainer     = Color(0xFFE6F4EA);

  // Semantic warning
  static const warning              = Color(0xFFE37400);
  static const warningContainer     = Color(0xFFFEF7E0);

  // Node status colors — defined once, used everywhere
  static const Map<int, NodeStatusColors> nodeStatus = {
    0: NodeStatusColors(fill: Color(0xFFF1F3F4), text: Color(0xFF5F6368), stroke: Color(0xFFDADCE0), label: 'Not Started'),
    1: NodeStatusColors(fill: Color(0xFFE8F0FE), text: Color(0xFF1A73E8), stroke: Color(0xFF4285F4), label: 'In Progress'),
    2: NodeStatusColors(fill: Color(0xFFFEF7E0), text: Color(0xFFE37400), stroke: Color(0xFFFBBC04), label: 'Paused'),
    3: NodeStatusColors(fill: Color(0xFFF3E8FD), text: Color(0xFF7B1FA2), stroke: Color(0xFFAB47BC), label: 'Skipped'),
    4: NodeStatusColors(fill: Color(0xFFE6F4EA), text: Color(0xFF1E8E3E), stroke: Color(0xFF34A853), label: 'Done'),
  };
}

class NodeStatusColors {
  final Color fill, text, stroke;
  final String label;
  const NodeStatusColors({required this.fill, required this.text, required this.stroke, required this.label});
}
```

### 1.3 app_theme.dart

```dart
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      secondary: AppColors.secondary,
      onSecondary: AppColors.onSecondary,
      surface: AppColors.surface,
      onSurface: AppColors.onSurface,
      surfaceContainerHighest: AppColors.surfaceVariant,
      error: AppColors.error,
      onError: AppColors.onError,
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.onErrorContainer,
      outline: AppColors.outline,
      outlineVariant: AppColors.outlineVariant,
    ),
    textTheme: AppTextStyles.textTheme,
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: const StadiumBorder(),       // pill shape always
        minimumSize: const Size(88, 48),    // 48px touch target
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(shape: const StadiumBorder()),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(shape: const StadiumBorder()),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4)),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
    ),
    cardTheme: CardTheme(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
    ),
  );
}
```

### 1.4 app_router.dart — Route Definitions

```dart
// Routes
const _landing       = '/';
const _login         = '/login';
const _register      = '/register';
const _profileSetup  = '/profile-setup';
const _dashboard     = '/dashboard';
const _careerRoles   = '/career-roles';
const _roadmapLoading = '/career-roles/loading';
const _roadmap       = '/roadmap/:personalRoadmapId';
const _resources     = '/roadmap/:personalRoadmapId/node/:nodeId/resources';
const _skillGapSelect = '/skill-gap/select';
const _skillInput    = '/skill-gap/input';
const _skillGapResult = '/skill-gap/result';
const _mentor        = '/mentor';
const _mentorSession = '/mentor/:sessionId';
const _market        = '/market';
const _portfolio     = '/portfolio';
const _settings      = '/settings';

// Auth guard: redirect to /login if no token; redirect to /dashboard if already authed on public routes
GoRouter buildRouter(Ref ref) => GoRouter(
  redirect: (context, state) {
    final isAuthed = ref.read(authStateProvider).isAuthenticated;
    final publicPaths = [_landing, _login, _register];
    final isPublic = publicPaths.contains(state.matchedLocation);
    if (!isAuthed && !isPublic) return _login;
    if (isAuthed && isPublic && state.matchedLocation != _landing) return _dashboard;
    return null;
  },
  routes: [
    GoRoute(path: _landing, builder: (_, __) => const LandingScreen()),
    GoRoute(path: _login, builder: (_, __) => const LoginScreen()),
    GoRoute(path: _register, builder: (_, __) => const RegisterScreen()),
    GoRoute(path: _profileSetup, builder: (_, __) => const ProfileSetupScreen()),
    ShellRoute(                       // authenticated shell with BottomNav
      builder: (_, __, child) => AppShell(child: child),
      routes: [
        GoRoute(path: _dashboard, builder: (_, __) => const DashboardScreen()),
        GoRoute(path: _careerRoles, builder: (_, __) => const CareerRoleSelectionScreen()),
        GoRoute(path: _roadmapLoading, builder: (_, state) => RoleSelectionLoadingScreen(
          careerRoadmapId: state.uri.queryParameters['careerRoadmapId']!,
          profileId: state.uri.queryParameters['profileId']!,
        )),
        GoRoute(path: _roadmap, builder: (_, state) => RoadmapViewerScreen(
          personalRoadmapId: state.pathParameters['personalRoadmapId']!,
        )),
        GoRoute(path: _resources, builder: (_, state) => LearningResourcesScreen(
          nodeId: state.pathParameters['nodeId']!,
        )),
        GoRoute(path: _skillGapSelect, builder: (_, __) => const SkillGapSelectionScreen()),
        GoRoute(path: _skillInput, builder: (_, __) => const SkillInputScreen()),
        GoRoute(path: _skillGapResult, builder: (_, state) => SkillGapResultScreen(
          careerRoadmapId: state.uri.queryParameters['careerRoadmapId']!,
        )),
        GoRoute(path: _mentor, builder: (_, __) => const MentorScreen()),
        GoRoute(path: _mentorSession, builder: (_, state) => MentorScreen(
          initialSessionId: state.pathParameters['sessionId'],
        )),
        GoRoute(path: _market, builder: (_, __) => const MarketPulseScreen()),
        GoRoute(path: _portfolio, builder: (_, __) => const PortfolioScreen()),
        GoRoute(path: _settings, builder: (_, __) => const SettingsScreen()),
      ],
    ),
  ],
);
```

### 1.5 token_storage.dart

```dart
class TokenStorage {
  static const _storage = FlutterSecureStorage();
  static const _accessKey  = 'secompass_at';
  static const _refreshKey = 'secompass_rt';
  static const _userKey    = 'secompass_user';

  Future<void> saveTokens(String access, String refresh) async {
    await Future.wait([
      _storage.write(key: _accessKey, value: access),
      _storage.write(key: _refreshKey, value: refresh),
    ]);
  }
  Future<String?> getAccessToken()  => _storage.read(key: _accessKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);
  Future<void> saveUser(String userJson) => _storage.write(key: _userKey, value: userJson);
  Future<String?> getUser() => _storage.read(key: _userKey);
  Future<void> clearAll() => _storage.deleteAll();
}
```

### 1.6 dio_client.dart — Interceptors

```dart
class TokenRefreshInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final storage = TokenStorage();
      final refreshToken = await storage.getRefreshToken();
      if (refreshToken == null) { _redirectToLogin(); return; }
      try {
        final resp = await Dio().post('$baseUrl/api/auth/refresh',
          data: {'refreshToken': refreshToken});
        final dto = AuthResponseDto.fromJson(resp.data);
        await storage.saveTokens(dto.accessToken, dto.refreshToken);
        // retry original request with new access token
        err.requestOptions.headers['Authorization'] = 'Bearer ${dto.accessToken}';
        final retried = await Dio().fetch(err.requestOptions);
        return handler.resolve(retried);
      } catch (_) {
        await storage.clearAll();
        _redirectToLogin();
      }
    }
    handler.next(err);
  }
}
```

---

## 2. Authentication — Landing, Login, Register

### 2.1 Landing Screen
**File:** `features/auth/screens/landing_screen.dart`
**Route:** `/`
**HTML Prototype:** `conversion/landingpage.html`
**Auth:** Public only (redirect to `/dashboard` if already authenticated)

#### Layout
- Full-screen `Stack`: gradient background + content column
- Logo row: compass icon + "SECompass" wordmark (Plus Jakarta Sans 28px/700)
- Tagline: "From Generalist to Job-Ready" (Roboto Flex 16px)
- Feature bullets (4 items): icons + short text (lazy-loaded with `flutter_animate` fade-in)
- Two CTA buttons at bottom:
  - `AppButton(variant: filled, label: 'Get Started')` → `/register`
  - `AppButton(variant: outlined, label: 'Sign In')` → `/login`
- Social proof line: "2,000+ students already navigating their careers"

#### State
- No async data — static screen
- Animate feature bullets staggered with `flutter_animate` `.delay()` chain

---

### 2.2 Login Screen
**File:** `features/auth/screens/login_screen.dart`
**Route:** `/login`
**HTML Prototype:** `conversion/login.html`
**Frontend Equivalent:** `Login.tsx`

#### Layout
- White `Card` (radius 28px, elevation Level 2) centered on `#F9F9FF` background
- Logo + "Welcome back" heading at top
- `AppTextField` for Email (leading mail icon, keyboard: email)
- `AppTextField` for Password (trailing eye toggle icon, obscureText)
- `AppButton(variant: filled, label: 'Sign In', fullWidth: true)`
- Divider "or continue with"
- `AppButton(variant: outlined, label: 'Continue with Google', leadingIcon: google_icon)`
- "Don't have an account? Register" text link → `/register`

#### User Interactions
| Action | Behavior |
|---|---|
| Type email/password | Live validation (email format, password non-empty) |
| Tap eye icon | Toggle `obscureText` on password field |
| Tap "Sign In" | Validate fields → call `authNotifier.login(email, password)` |
| Tap Google | `GoogleSignIn().signIn()` → get idToken → call `authNotifier.loginWithGoogle(idToken)` |
| Login success | Store tokens → check if profile complete → navigate `/dashboard` or `/profile-setup` |
| Login error | Show `AppSnackbar(type: error)` with backend error message |
| Tap register link | `context.go('/register')` |

#### Providers
```dart
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AuthState build() => AuthState.initial();

  Future<void> login(String email, String password) async { ... }
  Future<void> loginWithGoogle(String idToken) async { ... }
  Future<void> logout() async { ... }
}
```

#### Data Layer
- **REST POST** `/api/auth/login` — `LoginUserDto { email, password }` → `AuthResponseDto`
- **REST POST** `/api/auth/google` — `GoogleLoginDto { idToken }` → `AuthResponseDto`
- On success: `TokenStorage.saveTokens()` + update `AuthState`

---

### 2.3 Register Screen
**File:** `features/auth/screens/register_screen.dart`
**Route:** `/register`
**HTML Prototype:** `conversion/register.html`
**Frontend Equivalent:** `Register.tsx`

#### Layout
- Same Card layout as Login
- Heading: "Create your account"
- Progress stepper row: Account (active) → Profile → Done (3 steps, filled dots)
- `AppTextField` for Full Name (leading person icon)
- `AppTextField` for Email
- `AppTextField` for Password (with strength indicator)
- Password strength bar: 4-segment bar, colors: red → orange → yellow → green
  - Strength rules: length ≥8, has number, has uppercase, has special char
- `AppTextField` for Confirm Password (error if mismatch)
- `AppButton(variant: filled, label: 'Create Account')`
- Google Sign-In button (same as Login)
- "Already have an account? Sign in" → `/login`

#### User Interactions
| Action | Behavior |
|---|---|
| Type password | Real-time strength calculation and bar update |
| Confirm password mismatch | Show inline error "Passwords do not match" |
| Submit valid form | Call `authNotifier.register(fullName, email, password)` |
| Register success | Auto-login → navigate to `/profile-setup` |
| Google register | Same flow as login; routes to `/profile-setup` if profile incomplete |

#### Data Layer
- **REST POST** `/api/auth/register` — `RegisterUserDto { fullName, email, password }` → `AuthResponseDto`
- After register success: backend auto-creates empty Profile; navigate to `/profile-setup`

---

## 3. Profile Setup (Onboarding)

**File:** `features/auth/screens/profile_setup_screen.dart`
**Route:** `/profile-setup`
**HTML Prototype:** `conversion/profileSetup.html`
**Frontend Equivalent:** Settings page profile section (first-time flow)
**Trigger:** Shown after first-time registration if profile fields are empty

#### Layout
- Stepper header: Account ✓ → **Profile** (active) → Done
- Heading: "Tell us about yourself"
- Subtitle: "Help us personalize your roadmap"
- Form fields (all optional but encouraged):
  - `AppTextField` for University
  - `AppTextField` for Major (e.g., Software Engineering)
  - Dropdown for Year of Study (1st–5th year)
  - `AppTextField` for Phone Number
  - Multi-line `AppTextField` for Bio / About Me (max 300 chars)
- Character count display on Bio field
- `AppButton(variant: filled, label: 'Complete Setup')` → saves + navigates to `/dashboard`
- `AppButton(variant: text, label: 'Skip for now')` → `/dashboard` without saving

#### User Interactions
| Action | Behavior |
|---|---|
| Fill fields | Store in local form state |
| Tap "Complete Setup" | Call `profileNotifier.updateProfile(userId, dto)` then navigate `/dashboard` |
| Tap "Skip for now" | Navigate directly to `/dashboard`; profile can be completed in Settings |

#### Data Layer
- **REST PUT** `/api/profiles/{userId}` — `UpdateProfileDto { bioDescription, phoneNumber, university, major, studiedYear }` → `ProfileDto`
- Read current user id from `AuthState`

---

## 4. Dashboard

**File:** `features/dashboard/screens/dashboard_screen.dart`
**Route:** `/dashboard`
**HTML Prototype:** `conversion/dashboard.html`
**Frontend Equivalent:** `Dashboard.tsx`

#### Layout Sections
```
AppBar (greeting + avatar)
├── Stat Cards Row (4 cards, horizontal scroll)
├── My Roadmaps Section
│   ├── Section header + "View all" link
│   └── Horizontal scroll of RoadmapSummaryCard widgets
├── Skill Gap Snapshot
│   └── RadarChart (mini, read-only)
├── Trending Skills Section
│   └── Horizontal bar chart (top 5 skills)
├── Recent AI Mentor Sessions
│   └── 2 latest SessionListTile widgets
└── Quick Actions Grid (2×2)
```

#### Stat Cards — 4 cards
| Card | Data Source | Value |
|---|---|---|
| My Roadmaps | `GetPersonalRoadmapsByProfile` count | Total roadmap count |
| Avg Progress | Average of `progressPercentage` across roadmaps | "X%" |
| My Skills | `GetProfileWithSkills` skills count | Total skill count |
| GitHub Repos | `GetGitHubRepositoriesByProfile` count | Total repo count |

Each card: icon, number (large, blue), label, `LinearProgressBar` if applicable.

#### My Roadmaps Section
- Horizontal `ListView` (horizontal scroll) of `RoadmapSummaryCard`
- Card shows: roadmap name, career role name, `LinearProgressBar`, status chip (Not Started / In Progress / Completed), active badge
- Tap card → `context.go('/roadmap/${roadmap.personalRoadmapId}')`
- "View all" → (future: `/roadmaps` list page — same as frontend Roadmaps.tsx)

#### Skill Gap Snapshot
- Mini `RadarChart` (fl_chart, non-interactive, 200px height)
- Two polygons: "Your Skills" (blue fill) vs "Required" (yellow dashed)
- Only shows if user has an active roadmap
- Empty state: "Set a roadmap as active to see skill gap" + "Go to Settings" button
- Tap chart → navigate to `/skill-gap/select`

#### Trending Skills Bar Chart
- Horizontal bar chart, top 5 skills, bars colored by rank
- Data from `GetTopTrendingSkills(count: 5)`
- "View all trends" → `/market`

#### Recent AI Mentor Sessions
- Last 2 `ChatSession` items as `SessionListTile`
- Tile: session title, last message preview (truncated 60 chars), date
- Tap → `context.go('/mentor/${session.chatSessionId}')`
- "New chat" FAB → create session + navigate

#### Quick Actions Grid (2×2)
| Button | Icon | Navigation |
|---|---|---|
| Generate Roadmap | map | `/career-roles` |
| Skill Gap Analysis | analytics | `/skill-gap/select` |
| Market Pulse | trending_up | `/market` |
| Add Repository | folder_special | `/portfolio` |

#### State Management
```dart
@riverpod
Future<DashboardData> dashboardData(DashboardDataRef ref) async {
  final profileId = ref.watch(authStateProvider).profileId!;
  // Fan out parallel GraphQL queries
  final results = await Future.wait([
    ref.read(roadmapRepositoryProvider).getPersonalRoadmaps(profileId),
    ref.read(profileRepositoryProvider).getProfileWithSkills(profileId),
    ref.read(portfolioRepositoryProvider).getGitHubRepos(profileId),
    ref.read(jobTrendsRepositoryProvider).getTopTrendingSkills(5),
    ref.read(chatRepositoryProvider).getChatSessions(profileId),
  ]);
  return DashboardData.fromResults(results);
}
```

#### Loading State
- All sections show `SkeletonLoader` while `dashboardData` is loading
- Stat card skeletons: 4 horizontal rect shimmer blocks
- Roadmap card skeletons: 2 horizontal card shimmer blocks
- Chart skeleton: shimmer rect 200px high

---

## 5. Roadmap Generation — Career Role Selection

Covers two screens: Career Role Selection → Loading → Roadmap Viewer

### 5.1 Career Role Selection Screen
**File:** `features/roadmap/screens/career_role_selection_screen.dart`
**Route:** `/career-roles`
**HTML Prototype:** `conversion/CareerRoleSelection.html`
**Frontend Equivalent:** Roadmaps.tsx generate modal (step 1 + step 2)

#### Layout
- `AppBar` with title "Choose Your Career Path" + back button
- Search `AppTextField` at top (debounce 300ms) — filters role grid live
- `GridView` (2 columns, gap 12px) of `CareerRoleCard` widgets
- Selected card gets blue border + check overlay
- Bottom sticky bar: "Next →" `AppButton(variant: filled)` (disabled until selection)
- Shows roadmap template picker after role selected (step 2 — see below)

#### CareerRoleCard
- MD3 outlined card (radius 12px)
- Career role icon (Material Symbol, 32px, blue)
- Role name (Title Medium)
- Description preview (Body Small, 2 lines, truncated)
- Selected state: border `2px #1A73E8`, background `#E8F0FE`, check icon top-right

#### Step 2 — Roadmap Template Picker (BottomSheet)
- After role selected → `showModalBottomSheet` slides up
- Title: "Select Roadmap Template for {roleName}"
- List of `CareerRoadmapListTile`: roadmap name, description, node count badge
- Tap → select template (single select, radio pattern)
- "Generate Roadmap" `AppButton` → triggers generation

#### User Interactions
| Action | Behavior |
|---|---|
| Search | Filter `CareerRoleCard` grid by name (300ms debounce) |
| Tap role card | Mark selected, enable "Next" button |
| Tap "Next" | Show roadmap template bottom sheet |
| Tap template | Select template |
| Tap "Generate Roadmap" | Navigate to `/career-roles/loading?careerRoadmapId=...&profileId=...` |

#### Data Layer
- **GraphQL** `GetCareerRoles` → `[CareerRoleDto]`
- **GraphQL** `GetCareerRoadmapsByRole(careerRoleId)` → `[CareerRoadmapDto]` (lazy, triggered on role select)

```dart
@riverpod
Future<List<CareerRoleDto>> careerRoles(CareerRolesRef ref) =>
    ref.read(roadmapRepositoryProvider).getCareerRoles();

@riverpod
Future<List<CareerRoadmapDto>> roadmapsByRole(RoadmapsByRoleRef ref, String careerRoleId) =>
    ref.read(roadmapRepositoryProvider).getRoadmapsByRole(careerRoleId);
```

---

### 5.2 Role Selection Loading Screen
**File:** `features/roadmap/screens/role_selection_loading_screen.dart`
**Route:** `/career-roles/loading`
**HTML Prototype:** `conversion/roleSelectionLoading.html`

#### Layout
- Full-screen centered column
- Animated compass/loading icon (flutter_animate pulse + rotation)
- Text: "Building your personalized roadmap…" (Title Medium, blue)
- Sub-text: "Analyzing skill requirements for {roleName}" (Body Medium, gray)
- Linear progress indicator (indeterminate, blue)

#### Behavior
- On screen mount: fire `POST /api/personal-roadmaps/generate` immediately
- On success: `context.go('/roadmap/${response.personalRoadmapId}')`
- On error: show `AppSnackbar(type: error)` + back button to retry

#### Data Layer
- **REST POST** `/api/personal-roadmaps/generate` — `GenerateRoadmapDto { profileId, careerRoadmapId }` → `PersonalRoadmapDetailDto`

```dart
@riverpod
class RoadmapGenerator extends _$RoadmapGenerator {
  @override
  AsyncValue<PersonalRoadmapDto?> build() => const AsyncValue.data(null);

  Future<void> generate(String profileId, String careerRoadmapId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
      ref.read(roadmapRepositoryProvider).generateRoadmap(profileId, careerRoadmapId));
  }
}
```

---

## 6. Roadmap Viewer

**File:** `features/roadmap/screens/roadmap_viewer_screen.dart`
**Route:** `/roadmap/:personalRoadmapId`
**HTML Prototype:** `conversion/roadmapView.html`
**Frontend Equivalent:** `RoadmapCanvas.tsx` (adapted for mobile — list-based, not canvas)

> Mobile adaptation: React Flow canvas → expandable phase list with node rows. The interactive graph is replaced by a hierarchical expandable list which works naturally on small screens.

#### Layout
```
SliverAppBar (collapsible)
├── Title: Roadmap name + career role
├── Progress summary: "X of Y nodes completed"
└── LinearProgressBar (sticky when scrolled)

SliverList (body)
└── Per phase: ExpansionTile
    ├── Phase header: phase name + phase progress count
    └── Per node: RoadmapNodeRow
        ├── Status dot (8px circle, color by status)
        ├── Node name (Title Small 14px)
        ├── Status chip
        └── Chevron icon (tap → open detail sheet)
```

#### Node Detail Bottom Sheet
Opens on node tap — 60% screen height minimum, `DraggableScrollableSheet`:
- Node name (Headline Small 24px)
- Node description (Body Medium)
- "Status" label + `NodeStatusSegmentedButton` (5 segments)
- Note `AppTextField` (multi-line, optional)
- "Learning Resources" → `context.go('/roadmap/${id}/node/${nodeId}/resources')`
- `AppButton(variant: filled, label: 'Save')` → `PUT /api/node-progress/{nodeProgressId}/status`
- Saving state: button shows `CircularProgressIndicator`, disabled

#### Node Status Segmented Button
5 segments in a scrollable `SingleChildScrollView(scrollDirection: Axis.horizontal)`:
- Not Started | In Progress | Paused | Skipped | Done
- Active segment: status background color + check icon + status text color
- Inactive: transparent fill, outline border, gray text

#### User Interactions
| Action | Behavior |
|---|---|
| Tap phase header | Expand/collapse `ExpansionTile` |
| Tap node row | `showModalBottomSheet` with NodeDetailSheet |
| Change status segment | Update local state (unsaved) |
| Edit note field | Update local state |
| Tap "Save" | `PUT /api/node-progress/{id}/status` → close sheet → refresh roadmap |
| Tap "Learning Resources" | Navigate to resources screen |
| Long-press node | Quick status picker popup (optional enhancement) |

#### Data Layer
- **GraphQL** `GetPersonalRoadmapWithProgress(personalRoadmapId)` → full roadmap with all `NodeProgress` + node details
- **GraphQL** `GetCareerRoadmapWithNodes(careerRoadmapId)` → phase structure for grouping nodes
- **REST PUT** `/api/node-progress/{nodeProgressId}/status` — `{ status: int, note?: string }`

```dart
@riverpod
class RoadmapViewer extends _$RoadmapViewer {
  @override
  Future<PersonalRoadmapDetailDto> build(String personalRoadmapId) =>
      ref.read(roadmapRepositoryProvider).getPersonalRoadmapWithProgress(personalRoadmapId);

  Future<void> updateNodeStatus(String nodeProgressId, int status, {String? note}) async {
    await ref.read(roadmapRepositoryProvider).updateNodeStatus(nodeProgressId, status, note: note);
    ref.invalidateSelf();
  }
}
```

#### Loading / Empty States
- Full screen `SkeletonLoader` (3 ExpansionTile shimmer blocks) while loading
- If 0 nodes: `EmptyStateView(icon: Icons.map_outlined, title: 'No nodes found')`

---

## 7. Learning Resources

**File:** `features/roadmap/screens/learning_resources_screen.dart`
**Route:** `/roadmap/:personalRoadmapId/node/:nodeId/resources`
**HTML Prototype:** `conversion/learningResources.html`
**Frontend Equivalent:** Right panel "Learning Resources" section in `RoadmapCanvas.tsx`

#### Layout
- `AppBar` with node name as title + back button
- Filter chip row (horizontal scroll):
  - All | Free | Paid | + one chip per unique `resourceType` string found in results
  - Selected chip: filled blue; unselected: outlined gray
- `ListView` of `ResourceListTile` widgets
- Floating "Recommended Resources" section at bottom (if `GetRecommendedResources` returns data)

#### ResourceListTile
- Resource name (Title Small)
- Provider badge (Label Small, gray chip)
- Resource type badge (Label Small, blue chip, monospace font)
- Free/Paid badge (`StatusChip`)
- "Open" `AppButton(variant: tonal)` → `url_launcher` opens URL in browser
- List divider between items

#### Filter Behavior
- Filter chips live-filter the local list (no re-query)
- "All" chip: show everything
- "Free": show `isFree == true`
- "Paid": show `isFree == false`
- Type chip (e.g., "Video", "Article"): filter by `resourceType` string (case-insensitive)

#### User Interactions
| Action | Behavior |
|---|---|
| Tap filter chip | Toggle filter state, re-filter displayed list |
| Tap "Open" | `launchUrl(Uri.parse(resource.resourceUrl))` |
| Pull to refresh | Re-run `GetLearningResourcesByNode` query |

#### Data Layer
- **GraphQL** `GetLearningResourcesByNode(nodeId)` → `[LearningResourceDto]`
- **GraphQL** `GetRecommendedResources(profileId, nodeId)` → `[LearningResourceDto]` (parallel query)

```dart
@riverpod
Future<List<LearningResourceDto>> learningResources(LearningResourcesRef ref, String nodeId) =>
    ref.read(resourceRepositoryProvider).getResourcesByNode(nodeId);

@riverpod
Future<List<LearningResourceDto>> recommendedResources(RecommendedResourcesRef ref, String profileId, String nodeId) =>
    ref.read(resourceRepositoryProvider).getRecommended(profileId, nodeId);
```

#### Empty State
- `EmptyStateView(icon: Icons.menu_book_outlined, title: 'No resources yet', subtitle: 'Resources will appear as content is added by admins')`

---

## 8. Skill Gap Analysis

Covers three screens: Selection → Skill Input → Results

### 8.1 Skill Gap Selection Screen
**File:** `features/skill_gap/screens/skill_gap_selection_screen.dart`
**Route:** `/skill-gap/select`
**HTML Prototype:** `conversion/SkillGapSelection.html`
**Frontend Equivalent:** `SkillGap.tsx` (single page on web; split into steps on mobile)

#### Layout
- `AppBar`: "Skill Gap Analysis" + back
- Section header: "1. Choose a Target Role"
- Subtitle: "Select the career role to compare your skills against"
- `GridView` (2 columns) of `CareerRoleCard` (same component as generation flow)
- Search bar above grid
- Selected role highlighted with blue border + check
- "Next: Review Your Skills →" sticky bottom button (disabled until selection)

#### Interactions
- Tap role → select → enable "Next"
- Tap "Next" → navigate to `/skill-gap/input?careerRoleId=...`
- Search filters grid live (300ms debounce)

#### Data Layer
- **GraphQL** `GetCareerRoles` → reuse `careerRolesProvider`

---

### 8.2 Skill Input Screen
**File:** `features/skill_gap/screens/skill_input_screen.dart`
**Route:** `/skill-gap/input`
**HTML Prototype:** `conversion/SkillInput.html`
**Frontend Equivalent:** `Settings.tsx` skills section (input pattern reused here)

#### Layout
- `AppBar`: "Your Skills" + back
- Section header: "2. Review & Update Your Skills"
- Subtitle: "These are the skills you've added to your profile"
- **Existing skills** as `InputChip` cloud (wrap layout):
  - Each chip: skill name + × delete button
  - Chip color: `getSkillColor(skillName)` — deterministic color by skill name hash
  - Tap × → call `DELETE /api/skills/{id}` → remove chip
- **Add skill section**:
  - `AppTextField` with search icon: "Search and add a skill…"
  - As user types → autocomplete dropdown from `GetTechnicalSkills` filtered by input
  - Dropdown item: skill name + category label
  - Tap suggestion → add to profile via `POST /api/skills`
  - Enter key → add if valid match
- Character-limited: up to 50 skills per profile
- "Run Analysis →" sticky bottom `AppButton` → navigate to `/skill-gap/result?careerRoadmapId=...`

#### User Interactions
| Action | Behavior |
|---|---|
| Tap × on chip | `DELETE /api/skills/{skillId}` → remove from list |
| Type in search field | Filter `TechnicalSkills` list, show dropdown (300ms debounce) |
| Tap dropdown item | `POST /api/skills` → add chip to list → clear input |
| Press Enter | Same as tap dropdown if exactly one match |
| Tap "Run Analysis" | Navigate to `/skill-gap/result?careerRoadmapId={id}` |

#### Data Layer
- **GraphQL** `GetSkillsByProfile(profileId)` → existing `[SkillDto]`
- **GraphQL** `GetTechnicalSkills` → autocomplete `[TechnicalSkillDto]` (filter client-side)
- **REST POST** `/api/skills` — `{ skillName, note? }` → `SkillDto`
- **REST DELETE** `/api/skills/{skillId}`

```dart
@riverpod
class SkillInput extends _$SkillInput {
  @override
  Future<List<SkillDto>> build() async {
    final profileId = ref.watch(authStateProvider).profileId!;
    return ref.read(profileRepositoryProvider).getSkillsByProfile(profileId);
  }

  Future<void> addSkill(String skillName) async { ... ref.invalidateSelf(); }
  Future<void> removeSkill(String skillId) async { ... ref.invalidateSelf(); }
}
```

---

### 8.3 Skill Gap Result Screen
**File:** `features/skill_gap/screens/skill_gap_result_screen.dart`
**Route:** `/skill-gap/result`
**HTML Prototype:** `conversion/skillGapAnalysis.html`
**Frontend Equivalent:** `SkillGap.tsx`

#### Layout
- `AppBar`: "Skill Gap Analysis" + back + share icon
- **Coverage card** (top):
  - Large percentage number (Display Large, green if ≥70%, red if <70%)
  - Sub-label: "Skills covered for {careerRoleName}"
  - Horizontal `LinearProgressBar` (green fill)
- **Radar chart section** (fl_chart `RadarChart`):
  - Height: 280px
  - Polygon 1 "Your Skills": fill `rgba(26,115,232,0.2)`, stroke `#1A73E8` 2px
  - Polygon 2 "Required": fill `rgba(251,188,4,0.15)`, stroke `#FBBC04` 2px dashed
  - Axis labels: skill category names, Body Small 11px gray
  - Legend below chart
- **Skills You Have** section:
  - Chip cloud of matched skills (green background `#E6F4EA`, text `#1E8E3E`)
- **Skills to Develop** section:
  - Chip cloud of missing skills (red background `#FCE8E6`, text `#D93025`)
- **Trending Recommendations** section (optional):
  - "Also consider learning these trending skills:"
  - Chip cloud from `GetTrendingSkillRecommendations(profileId)` (info blue chips)
- Bottom: "Go to Learning Resources" `AppButton`

#### User Interactions
| Action | Behavior |
|---|---|
| Tap skill chip | No action (display only) |
| Pull to refresh | Re-run `GetSkillGapAnalysis` |
| Tap share icon | `Share.share(text)` with share_plus — exports text summary |

#### Data Layer
- **GraphQL** `GetSkillGapAnalysis(profileId, careerRoadmapId)` → `SkillGapAnalysisDto { coveragePercentage, matchedSkills[], missingSkills[], categoryBreakdown[] }`
- **GraphQL** `GetTrendingSkillRecommendations(profileId)` → `[String]`

```dart
@riverpod
Future<SkillGapAnalysisDto> skillGapAnalysis(SkillGapAnalysisRef ref, String profileId, String careerRoadmapId) =>
    ref.read(skillGapRepositoryProvider).getSkillGapAnalysis(profileId, careerRoadmapId);
```

#### Radar Chart Implementation (fl_chart)
```dart
RadarChart(
  RadarChartData(
    radarShape: RadarShape.polygon,
    dataSets: [
      RadarDataSet(  // Your skills
        dataEntries: yourSkillScores.map((s) => RadarEntry(value: s)).toList(),
        fillColor: const Color(0xFF1A73E8).withOpacity(0.2),
        borderColor: const Color(0xFF1A73E8),
        borderWidth: 2,
      ),
      RadarDataSet(  // Required
        dataEntries: requiredScores.map((s) => RadarEntry(value: s)).toList(),
        fillColor: const Color(0xFFFBBC04).withOpacity(0.15),
        borderColor: const Color(0xFFFBBC04),
        borderWidth: 2,
        // Dashed effect via custom painter or approximation
      ),
    ],
    getTitle: (index, angle) => RadarChartTitle(text: categories[index]),
    tickBorderData: BorderSide(color: AppColors.outlineVariant),
    gridBorderData: BorderSide(color: AppColors.outlineVariant),
  ),
)
```

---

## 9. AI Mentor Chat

**File:** `features/ai_mentor/screens/chat_screen.dart`
**Route:** `/mentor` and `/mentor/:sessionId`
**HTML Prototype:** `conversion/aiMentorChat.html`
**Frontend Equivalent:** `Mentor.tsx`

#### Layout
- **Sidebar-less on mobile** — sessions accessed via `ModalBottomSheet` or drawer

```
Scaffold
├── AppBar
│   ├── Title: session name (truncated) or "AI Mentor"
│   ├── Leading: hamburger → open sessions drawer
│   └── Trailing: + (new session), ⋮ (rename, delete)
├── Body: ChatMessageList (scrollable)
│   ├── Suggested chips row (shown when session is empty)
│   └── ChatBubble items
└── BottomBar: input field + send button
```

#### Sessions Drawer (Left Drawer / Bottom Sheet)
- `Drawer` or `showModalBottomSheet` with session list
- Each `SessionListTile`:
  - Session title (truncated 40 chars)
  - Date label (relative: "Today", "Yesterday", "Jun 12")
  - Tap → load session → close drawer
  - Long press → options: Rename, Delete
- "New Chat" button at top of drawer
- Active session highlighted with blue background

#### Chat Message Area
- `ListView.builder` in reverse: latest message at bottom
- Auto-scroll to bottom when new message arrives (`ScrollController.animateTo`)
- **User bubble** (right-aligned):
  - `#E8F0FE` background, radius `18px 18px 4px 18px`, Body Medium, `#191C23` text
- **AI bubble** (left-aligned):
  - `#FFFFFF` background, radius `18px 18px 18px 4px`, elevation Level 1
  - Robot avatar 28px circle (primary blue background, white icon)
  - Markdown rendered via `flutter_markdown`:
    - Bold, italic, bullet lists, numbered lists
    - Code blocks: `#202124` background, `Roboto Mono 13px`, white text, radius 8px
- **Typing indicator bubble** (while AI is responding):
  - Same AI bubble style, animated 3-dot pulse

#### Suggested Question Chips
- Shown above input bar when session is new and has 0 messages
- 4–5 pre-defined questions relevant to career/SE guidance:
  - "What skills should I learn first?"
  - "How do I prepare for frontend interviews?"
  - "Review my current roadmap progress"
  - "What are the top hiring trends?"
- Tap chip → populate input field + send

#### Input Bar
- `AppTextField` (multi-line, max 3 lines before scroll, min 1 line)
- Disabled with placeholder "Create or select a session first" when no active session
- Send `IconButton` (filled circle, blue, 40px) — disabled when input empty or AI is responding
- Press Enter key on physical keyboard → send

#### User Interactions
| Action | Behavior |
|---|---|
| Tap hamburger | Open sessions drawer/bottom sheet |
| Tap "New Chat" | `POST /api/chat/sessions { title: 'New Chat' }` → select new session |
| Tap session in list | Load `GetChatSessionWithMessages(sessionId)` → display messages |
| Long press session | Show rename/delete options sheet |
| Rename session | Inline edit → `PUT /api/chat/sessions/{sessionId} { title }` |
| Type + Send | `POST /api/chat/sessions/{id}/messages { sender: userId, messageContent }` → append user bubble → append typing bubble → on response: replace typing with AI bubble |
| Tap suggested chip | Fill input + auto-send |
| Tap "+" AppBar | Create new session flow |

#### Message Rendering Logic
```dart
// After sending:
1. Append user message to local list immediately (optimistic)
2. Show typing indicator bubble
3. POST /api/chat/sessions/{id}/messages
4. On response: remove typing indicator, append AI message
5. Scroll to bottom

// AI message content type check:
if (message.sender == 'AI') → MarkdownBody(data: message.messageContent)
else → Text(message.messageContent)
```

#### Data Layer
- **GraphQL** `GetChatSessionsByProfile(profileId)` → `[ChatSessionDto]`
- **GraphQL** `GetChatSessionWithMessages(sessionId)` → `ChatSessionDetailDto { messages[] }`
- **REST POST** `/api/chat/sessions` — `{ title: string, profileId }` → `ChatSessionDto`
- **REST POST** `/api/chat/sessions/{sessionId}/messages` — `{ sender, messageContent }` → `ChatMessageDto`
- **REST PUT** `/api/chat/sessions/{sessionId}` — `{ title }` → `ChatSessionDto` (rename)

```dart
@riverpod
class MentorChat extends _$MentorChat {
  @override
  Future<ChatState> build(String? sessionId) async {
    final profileId = ref.watch(authStateProvider).profileId!;
    final sessions = await ref.read(chatRepositoryProvider).getSessions(profileId);
    if (sessionId != null) {
      final detail = await ref.read(chatRepositoryProvider).getSessionWithMessages(sessionId);
      return ChatState(sessions: sessions, activeSession: detail);
    }
    return ChatState(sessions: sessions, activeSession: null);
  }

  Future<void> createSession() async { ... ref.invalidateSelf(); }
  Future<void> sendMessage(String content) async { ... }
  Future<void> renameSession(String sessionId, String newTitle) async { ... }
}
```

---

## 10. Market Pulse

**File:** `features/job_trends/screens/market_pulse_screen.dart`
**Route:** `/market`
**HTML Prototype:** `conversion/marketPulse.html`
**Frontend Equivalent:** `MarketPulse.tsx`

#### Layout
```
AppBar: "Market Pulse" + info icon

Body (scrollable):
├── Region Filter Chips Row
│   └── Vietnam | Singapore | Thailand | Global
├── Top Trending Skills Section
│   ├── Section title + "Updated {date}"
│   └── HorizontalBarChart (fl_chart, top 5, height 200px)
├── Trend Over Time Section
│   └── AreaChart (fl_chart, top 3 skills, height 220px)
├── Search + Sort Toolbar
│   ├── AppTextField (search by skill name)
│   └── Sort dropdown (Score ↓, Score ↑, Name A-Z, Date ↓)
└── ListView of TrendSkillCard
```

#### Region Filter Behavior
- Single-select chip group (only one active at a time)
- On chip tap → update `selectedRegion` state → refetch `GetJobTrendsByRegion(region)`
- Chips: Vietnam, Singapore, Thailand, Global (maps to empty string for all regions)

#### Top Trending Skills Bar Chart (fl_chart BarChart)
- Horizontal bars, each skill a category, bar length = `trendScore` (0–100)
- 5 bars, colors: distinct palette (blue, teal, orange, purple, green)
- Y-axis: skill names, Body Small 11px
- X-axis: 0–100 trend score

#### Trend Over Time Area Chart (fl_chart LineChart with fill)
- X-axis: `snapshotDate` values (last 6 months)
- Y-axis: `trendScore` 0–100
- 3 series: top 3 skills
- Series fills: `#E8F0FE`, `#E6F4EA`, `#F3E8FD` (blue/green/purple)
- Matching stroke colors
- Grid lines: `#E8EAED` dashed, axis labels Body Small 12px gray

#### TrendSkillCard
- Skill name (Title Small 14px/500)
- Region badge (gray chip)
- Source badge (Label Small, monospace)
- Trend score: large number (Display Medium) + progress bar
  - Score color: green if ≥70, orange if ≥40, red if <40
- Snapshot date (Body Small, gray)

#### Search & Sort
- Search filters `TrendSkillCard` list by skill name (client-side, 300ms debounce)
- Sort options: "Trend Score ↓" (default), "Trend Score ↑", "Skill Name A–Z", "Date ↓"
- Sort applied after search filter

#### Data Layer
- **GraphQL** `GetJobTrendsByRegion(region: String)` → `[JobTrendDto]`
- **GraphQL** `GetTopTrendingSkills(count: 10)` → `[JobTrendDto]`

```dart
@riverpod
class MarketPulse extends _$MarketPulse {
  String _region = 'Vietnam';

  @override
  Future<MarketPulseData> build() async {
    return MarketPulseData(
      topSkills: await ref.read(trendsRepositoryProvider).getTopTrending(10),
      regionalTrends: await ref.read(trendsRepositoryProvider).getByRegion(_region),
    );
  }

  void changeRegion(String region) {
    _region = region;
    ref.invalidateSelf();
  }
}
```

#### Trend Area Chart (fl_chart LineChart)
```dart
LineChart(
  LineChartData(
    lineBarsData: [
      for (var i = 0; i < 3; i++)
        LineChartBarData(
          spots: buildSpots(trendSeries[i]),
          isCurved: true,
          color: seriesColors[i],
          belowBarData: BarAreaData(show: true, color: seriesColors[i].withOpacity(0.15)),
        ),
    ],
    gridData: FlGridData(
      getDrawingHorizontalLine: (_) => FlLine(color: AppColors.outlineVariant, strokeWidth: 1, dashArray: [4, 4]),
    ),
    borderData: FlBorderData(show: false),
  ),
)
```

---

## 11. E-Portfolio & GitHub Repositories

**File:** `features/portfolio/screens/portfolio_screen.dart`
**Route:** `/portfolio`
**HTML Prototype:** `conversion/githubRepoAndEPortfolio.html`
**Frontend Equivalent:** `Portfolio.tsx`

#### Layout
```
AppBar: "E-Portfolio" + share icon

Body:
├── Portfolio Header Card
│   ├── Profile name, university/major
│   ├── "View Public Portfolio" tonal button → url_launcher
│   └── "Share Link" text button → Share.share(portfolioUrl)
├── AI Portfolio Analysis Section
│   ├── "Analyze" filled button (POST /api/ai/portfolio-analysis/{profileId})
│   └── Analysis result card (when available):
│       ├── Overall summary text
│       ├── Strengths chips (green)
│       └── Recommendations chips (blue)
├── Add Repository Button (FAB or top-right)
├── Search + Filter Toolbar
│   ├── AppTextField (search by name/URL)
│   └── Filter chips: All | Public | Private
└── ListView of RepoCard
```

#### RepoCard
- Repository name (Title Small 14px/500, blue link style)
- Description (Body Small, gray, 2 lines truncated)
- Public/Private badge (`StatusChip`)
- Repo URL as `Text(style: monospace)` truncated
- AI-generated description (if portfolio analysis run): italic, gray text, 3 lines
- Action row:
  - "Open" `AppButton(variant: tonal)` → `url_launcher` opens `repoUrl`
  - Edit icon → `showModalBottomSheet` with edit form
  - Delete icon → `ConfirmDialog` then `DELETE /api/github-repositories/{id}`

#### Add / Edit Repository Bottom Sheet
Fields:
- `AppTextField` for GitHub URL (required, validates URL format)
- Auto-extract: repo name populated from URL path segment on blur
- `AppTextField` for Repository Name (auto-filled from URL, editable)
- `AppTextField` for Description (optional, multi-line)
- `SwitchListTile` for "Private repository" toggle
- `AppButton(variant: filled, label: 'Add Repository')` / 'Save Changes'

#### AI Portfolio Analysis
- Tap "Analyze" → show `LoadingDialog` ("Analyzing your GitHub projects…")
- **REST POST** `/api/ai/portfolio-analysis/{profileId}` → `PortfolioAnalysisDto`
- On success: hide dialog → display analysis card with:
  - Overall summary paragraph
  - Strengths: `[String]` as green chips
  - Recommendations: `[String]` as blue chips
  - Per-repo analysis: expandable list with objective + tech stacks

#### Share Portfolio
- `Share.share('https://{domain}/portfolio/${userId}')` via share_plus
- AppBar share icon + "Share Link" text button both trigger same action
- "View Public Portfolio" → `url_launcher` opens URL in browser

#### User Interactions
| Action | Behavior |
|---|---|
| Tap "+" / Add button | Show add-repo bottom sheet |
| Submit add form | `POST /api/github-repositories` → close sheet → refresh list |
| Tap edit icon on card | Show edit bottom sheet prefilled with repo data |
| Submit edit form | `PUT /api/github-repositories/{id}` → close sheet → refresh |
| Tap delete icon | `ConfirmDialog("Delete repository?")` → `DELETE /api/github-repositories/{id}` → remove from list |
| Tap "Analyze" | `POST /api/ai/portfolio-analysis/{profileId}` → show result |
| Tap "View Public Portfolio" | Open URL in browser |
| Tap share | `Share.share(link)` |
| Search/filter | Live client-side filter |

#### Data Layer
- **GraphQL** `GetGitHubRepositoriesByProfile(profileId)` → `[GitHubRepositoryDto]`
- **GraphQL** `GetPortfolioAnalysis(profileId)` → `PortfolioAnalysisDto`
- **REST POST** `/api/github-repositories` — `{ repositoryName, repoUrl, description?, isPrivate }`
- **REST PUT** `/api/github-repositories/{id}` — `{ repositoryName, repoUrl, description?, isPrivate }`
- **REST DELETE** `/api/github-repositories/{id}`
- **REST POST** `/api/ai/portfolio-analysis/{profileId}` — trigger analysis

```dart
@riverpod
class Portfolio extends _$Portfolio {
  @override
  Future<PortfolioData> build() async {
    final profileId = ref.watch(authStateProvider).profileId!;
    return PortfolioData(
      repos: await ref.read(portfolioRepositoryProvider).getRepos(profileId),
      analysis: await ref.read(portfolioRepositoryProvider).getAnalysis(profileId),
    );
  }

  Future<void> addRepo(CreateRepoDto dto) async { ... ref.invalidateSelf(); }
  Future<void> updateRepo(String id, UpdateRepoDto dto) async { ... ref.invalidateSelf(); }
  Future<void> deleteRepo(String id) async { ... ref.invalidateSelf(); }
  Future<void> runAnalysis() async { ... ref.invalidateSelf(); }
}
```

---

## 12. Settings & Profile Management

**File:** `features/settings/screens/settings_screen.dart`
**Route:** `/settings`
**HTML Prototype:** No direct HTML prototype — mirrors `Settings.tsx` fully
**Frontend Equivalent:** `Settings.tsx`

#### Layout
```
AppBar: "Settings"

Body (single scroll):
├── Account Section
│   ├── Avatar (64px circle, cachedNetworkImage, fallback initials)
│   ├── Full Name (Title Large)
│   ├── Email (Body Medium, gray)
│   ├── Role badge (RoadmapUser / Manager / Admin)
│   └── "Edit Account" button
├── Personal Information Section
│   ├── Section header + "Edit" toggle button
│   ├── Bio (multi-line, read or edit mode)
│   ├── Phone, University, Major, Year of Study
│   └── "Save" / "Cancel" buttons (edit mode)
├── Skills Section
│   ├── Skills chip cloud (InputChip with × delete)
│   ├── Add skill text field + autocomplete dropdown
│   └── Skill count display
├── Security Section
│   ├── Email display + verified badge
│   └── "Primary account credential" label
└── Danger Zone Section
    └── "Deactivate Account" danger button → ConfirmDialog
```

#### Account Edit Mode
- Tap "Edit Account" → show `showModalBottomSheet` with:
  - Avatar URL field (with `Image.network` preview on blur)
  - Full Name field
  - "Save" → `PUT /api/users/{userId} { fullName, avatarUrl }`
  - "Cancel" → close sheet

#### Personal Information Edit
- `AnimatedSwitcher` between read view and edit form
- Edit form fields: Bio (multi-line AppTextField, 300 char limit + counter), Phone, University, Major, Studied Year
- "Save" → `PUT /api/profiles/{userId} { bioDescription, phoneNumber, university, major, studiedYear }`
- Character count on Bio: "X / 300"

#### Skills Management
- **Chip cloud**: `Wrap` of `InputChip` widgets
  - `InputChip(label: Text(skill.skillName), onDeleted: () => removeSkill(skill.id))`
  - Chip background color: `getSkillColor(skill.skillName)` — deterministic by hash
  - Chip color function (port from frontend's `getSkillColor` utility):
    ```dart
    Color getSkillColor(String skillName) {
      final palette = [Color(0xFFE8F0FE), Color(0xFFE6F4EA), Color(0xFFFEF7E0), Color(0xFFF3E8FD), Color(0xFFFCE8E6)];
      return palette[skillName.hashCode.abs() % palette.length];
    }
    ```
- **Add skill**: `AppTextField` with `Autocomplete<TechnicalSkillDto>` overlay
  - Opens overlay showing matching technical skills from `GetTechnicalSkills`
  - Each option: skill name (Body Medium) + category badge (Label Small)
  - Tap option → `POST /api/skills { skillName }` → add chip → clear input

#### Deactivate Account
- Tap "Deactivate Account" → `ConfirmDialog(title: 'Deactivate Account', dangerText: '...')`
- Confirm → `DELETE /api/users/{userId}`
- On 200: `tokenStorage.clearAll()` + `authState.clearAuth()` + navigate to `/login`

#### User Interactions
| Action | Behavior |
|---|---|
| Tap "Edit Account" | Open account edit bottom sheet |
| Save account changes | `PUT /api/users/{id}` → close sheet → show snackbar |
| Tap "Edit" info | Toggle to edit mode (AnimatedSwitcher) |
| Save profile info | `PUT /api/profiles/{id}` → toggle back to read mode → snackbar |
| Tap × on skill chip | `DELETE /api/skills/{id}` → remove chip |
| Type in skill search | Show autocomplete overlay |
| Select autocomplete item | `POST /api/skills` → append chip → clear input |
| Tap "Deactivate Account" | ConfirmDialog → `DELETE /api/users/{id}` → logout |

#### Data Layer
- **GraphQL** `GetProfileWithSkills(userId)` → `ProfileWithSkillsDto`
- **GraphQL** `GetUserById(userId)` → `UserDto`
- **GraphQL** `GetTechnicalSkills` → `[TechnicalSkillDto]` for autocomplete
- **REST PUT** `/api/users/{id}` — `{ fullName, avatarUrl }`
- **REST PUT** `/api/profiles/{id}` — `{ bioDescription, phoneNumber, university, major, studiedYear }`
- **REST POST** `/api/skills` — `{ skillName, note? }`
- **REST DELETE** `/api/skills/{skillId}`
- **REST DELETE** `/api/users/{userId}` — soft-deactivate

```dart
@riverpod
class SettingsNotifier extends _$SettingsNotifier {
  @override
  Future<SettingsData> build() async {
    final userId = ref.watch(authStateProvider).userId!;
    return SettingsData(
      user: await ref.read(userRepositoryProvider).getById(userId),
      profileWithSkills: await ref.read(profileRepositoryProvider).getProfileWithSkills(userId),
      technicalSkills: await ref.read(profileRepositoryProvider).getTechnicalSkills(),
    );
  }

  Future<void> updateUser(String fullName, String? avatarUrl) async { ... }
  Future<void> updateProfile(UpdateProfileDto dto) async { ... }
  Future<void> addSkill(String skillName) async { ... }
  Future<void> removeSkill(String skillId) async { ... }
  Future<void> deactivateAccount() async { ... }
}
```

---

## 13. Navigation Shell

**File:** `core/widgets/app_shell.dart`

### 13.1 AppShell Widget
Wraps all authenticated screens with `AppBottomNav` + `AppTopBar`:

```dart
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const AppBottomNav(),
    );
  }
}
```

### 13.2 AppBottomNav

| Index | Label | Icon (Material Symbol) | Route |
|---|---|---|---|
| 0 | Dashboard | `home` | `/dashboard` |
| 1 | Roadmap | `map` | `/career-roles` |
| 2 | Mentor | `smart_toy` | `/mentor` |
| 3 | Market | `trending_up` | `/market` |
| 4 | More | `more_horiz` | Opens `ModalBottomSheet` with: Portfolio, Settings, Logout |

```dart
class AppBottomNav extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    return NavigationBar(
      selectedIndex: _indexFor(location),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Dashboard'),
        NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Roadmap'),
        NavigationDestination(icon: Icon(Icons.smart_toy_outlined), selectedIcon: Icon(Icons.smart_toy), label: 'Mentor'),
        NavigationDestination(icon: Icon(Icons.trending_up), label: 'Market'),
        NavigationDestination(icon: Icon(Icons.more_horiz), label: 'More'),
      ],
      onDestinationSelected: (i) => _navigate(context, i),
    );
  }
}
```

### 13.3 "More" Bottom Sheet
- Portfolio link → `/portfolio`
- Settings link → `/settings`
- Sign out → `ConfirmDialog` → `authNotifier.logout()` → clear tokens → `/login`

---

## 14. Shared Components Spec

### 14.1 AppButton
```dart
enum AppButtonVariant { filled, tonal, outlined, text, danger }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final IconData? leadingIcon;
  final bool isLoading;
  final bool fullWidth;
  // Height: 48px, radius: 9999px, font: Label Large 14px/500
}
```

### 14.2 AppTextField
```dart
class AppTextField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final TextInputType keyboardType;
  final int? maxLines;
  final int? maxLength;
  final VoidCallback? onChanged;
  // MD3 Outlined variant, floating label, 4px corner radius
}
```

### 14.3 StatusChip
```dart
class StatusChip extends StatelessWidget {
  final int status;          // 0–4 NodeProgressStatus OR named variant
  final String? label;       // Override default label
  // Reads from AppColors.nodeStatus[status]
  // Size: Label Small 11px, padding: 2px 8px, radius: 8px
}
```

### 14.4 SkeletonLoader
```dart
class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  // Shimmer package: gray to light gray sweep animation, 1.5s infinite
}

class SkeletonCard extends StatelessWidget {
  // Pre-built card shimmer: 100% width, 80px height, radius 12px
}

class SkeletonList extends StatelessWidget {
  final int itemCount;
  // Stacked SkeletonCard rows with 12px gap
}
```

### 14.5 EmptyStateView
```dart
class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  // 64px icon circle (#F1F3F4 bg, icon #DADCE0)
  // Headline Small 24px title, Body Medium subtitle
  // Filled AppButton below if actionLabel provided
}
```

### 14.6 AppSnackbar
```dart
class AppSnackbar {
  static void show(BuildContext context, {
    required String message,
    SnackbarType type = SnackbarType.info,  // success / error / warning / info
    String? actionLabel,
    VoidCallback? onAction,
  });
  // Fill #202124, white text, radius 4px, elevation 3
  // Left 3px accent bar: green/red/orange/blue by type
  // Auto-dismiss 3 seconds
}
```

### 14.7 ConfirmDialog
```dart
class ConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final bool isDanger;  // red confirm button if true
  final VoidCallback onConfirm;
  // radius 28px, scale+fade animation 150ms
}
```

### 14.8 RoadmapNodeCard
```dart
class RoadmapNodeCard extends StatelessWidget {
  final NodeProgressDto nodeProgress;
  final VoidCallback onTap;
  // MD3 outlined card, left 3px status accent bar
  // Node name (Title Small), Status chip, description preview
  // Min-height 60px, padding 12px 16px, radius 12px
}
```

### 14.9 LinearProgressBar
```dart
class LinearProgressBar extends StatelessWidget {
  final double value;   // 0.0 – 1.0
  final double height;  // default 6px
  final Color? color;   // default #1E8E3E for completion
  // Track #E8EAED, radius 3px
  // Animated: width transition 400ms ease
}
```

### 14.10 CareerRoleCard
```dart
class CareerRoleCard extends StatelessWidget {
  final CareerRoleDto role;
  final bool isSelected;
  final VoidCallback onTap;
  // MD3 card, 2-column grid, icon 32px blue, name + description
  // Selected: 2px #1A73E8 border, #E8F0FE fill, check icon top-right
}
```

---

## 15. Data Models

All models use `freezed` + `json_serializable`. Defined in `core/models/`.

```dart
@freezed
class AuthResponseDto with _$AuthResponseDto {
  const factory AuthResponseDto({
    required String accessToken,
    required String refreshToken,
    required String userId,
    required String fullName,
    required String email,
    required int role,
    String? avatarUrl,
    String? profileId,
  }) = _AuthResponseDto;
  factory AuthResponseDto.fromJson(Map<String, dynamic> json) => _$AuthResponseDtoFromJson(json);
}

@freezed
class PersonalRoadmapDto with _$PersonalRoadmapDto {
  const factory PersonalRoadmapDto({
    required String personalRoadmapId,
    required String profileId,
    required String careerRoadmapId,
    required double progressPercentage,
    required bool isActive,
    required String createdAt,
    CareerRoadmapDto? careerRoadmap,
    List<NodeProgressDto>? nodeProgresses,
  }) = _PersonalRoadmapDto;
  factory PersonalRoadmapDto.fromJson(Map<String, dynamic> json) => _$PersonalRoadmapDtoFromJson(json);
}

@freezed
class NodeProgressDto with _$NodeProgressDto {
  const factory NodeProgressDto({
    required String nodeProgressId,
    required String personalRoadmapId,
    required String nodeId,
    required int status,
    String? note,
    NodeDto? node,
  }) = _NodeProgressDto;
  factory NodeProgressDto.fromJson(Map<String, dynamic> json) => _$NodeProgressDtoFromJson(json);
}

@freezed
class NodeDto with _$NodeDto {
  const factory NodeDto({
    required String nodeId,
    required String name,
    String? description,
    required int order,
    String? parentNodeId,
  }) = _NodeDto;
  factory NodeDto.fromJson(Map<String, dynamic> json) => _$NodeDtoFromJson(json);
}

@freezed
class CareerRoleDto with _$CareerRoleDto {
  const factory CareerRoleDto({
    required String careerRoleId,
    required String name,
    String? description,
    String? iconName,
  }) = _CareerRoleDto;
  factory CareerRoleDto.fromJson(Map<String, dynamic> json) => _$CareerRoleDtoFromJson(json);
}

@freezed
class ChatSessionDto with _$ChatSessionDto {
  const factory ChatSessionDto({
    required String chatSessionId,
    required String profileId,
    required String title,
    required String createdAt,
    List<ChatMessageDto>? messages,
  }) = _ChatSessionDto;
  factory ChatSessionDto.fromJson(Map<String, dynamic> json) => _$ChatSessionDtoFromJson(json);
}

@freezed
class ChatMessageDto with _$ChatMessageDto {
  const factory ChatMessageDto({
    required String chatMessageId,
    required String chatSessionId,
    required String sender,     // userId string OR 'AI'
    required String messageContent,
    required String createdAt,
  }) = _ChatMessageDto;
  factory ChatMessageDto.fromJson(Map<String, dynamic> json) => _$ChatMessageDtoFromJson(json);
}

@freezed
class GitHubRepositoryDto with _$GitHubRepositoryDto {
  const factory GitHubRepositoryDto({
    required String githubRepoId,
    required String profileId,
    required String repositoryName,
    required String repoUrl,
    String? description,
    required bool isPrivate,
    required String createdAt,
  }) = _GitHubRepositoryDto;
  factory GitHubRepositoryDto.fromJson(Map<String, dynamic> json) => _$GitHubRepositoryDtoFromJson(json);
}

@freezed
class JobTrendDto with _$JobTrendDto {
  const factory JobTrendDto({
    required String jobTrendId,
    required String techSkill,
    String? description,
    String? source,
    String? region,
    required double trendScore,
    required String snapshotDate,
  }) = _JobTrendDto;
  factory JobTrendDto.fromJson(Map<String, dynamic> json) => _$JobTrendDtoFromJson(json);
}

@freezed
class SkillGapAnalysisDto with _$SkillGapAnalysisDto {
  const factory SkillGapAnalysisDto({
    required double coveragePercentage,
    required List<String> matchedSkills,
    required List<String> missingSkills,
    required List<CategoryBreakdownDto> categoryBreakdown,
  }) = _SkillGapAnalysisDto;
  factory SkillGapAnalysisDto.fromJson(Map<String, dynamic> json) => _$SkillGapAnalysisDtoFromJson(json);
}
```

---

## 16. Repository Layer

Abstract interfaces + implementations. All `DioClient` / GraphQL calls here only.

### 16.1 AuthRepository
```dart
abstract class AuthRepository {
  Future<AuthResponseDto> login(String email, String password);
  Future<AuthResponseDto> loginWithGoogle(String idToken);
  Future<AuthResponseDto> register(String fullName, String email, String password);
  Future<AuthResponseDto> refresh(String refreshToken);
  Future<void> logout(String refreshToken);
}
```

### 16.2 ProfileRepository
```dart
abstract class ProfileRepository {
  Future<ProfileWithSkillsDto> getProfileWithSkills(String userId);
  Future<ProfileDto> updateProfile(String userId, UpdateProfileDto dto);
  Future<List<SkillDto>> getSkillsByProfile(String profileId);
  Future<SkillDto> addSkill(String profileId, String skillName);
  Future<void> deleteSkill(String skillId);
  Future<List<TechnicalSkillDto>> getTechnicalSkills();
}
```

### 16.3 RoadmapRepository
```dart
abstract class RoadmapRepository {
  Future<List<CareerRoleDto>> getCareerRoles();
  Future<List<CareerRoadmapDto>> getRoadmapsByRole(String careerRoleId);
  Future<List<PersonalRoadmapDto>> getPersonalRoadmaps(String profileId);
  Future<PersonalRoadmapDetailDto> getPersonalRoadmapWithProgress(String id);
  Future<PersonalRoadmapDto> generateRoadmap(String profileId, String careerRoadmapId);
  Future<void> deleteRoadmap(String personalRoadmapId);
  Future<void> updateNodeStatus(String nodeProgressId, int status, {String? note});
}
```

### 16.4 ChatRepository
```dart
abstract class ChatRepository {
  Future<List<ChatSessionDto>> getSessions(String profileId);
  Future<ChatSessionDetailDto> getSessionWithMessages(String sessionId);
  Future<ChatSessionDto> createSession(String profileId, String title);
  Future<ChatMessageDto> sendMessage(String sessionId, String sender, String content);
  Future<ChatSessionDto> renameSession(String sessionId, String newTitle);
}
```

### 16.5 JobTrendsRepository
```dart
abstract class JobTrendsRepository {
  Future<List<JobTrendDto>> getByRegion(String region);
  Future<List<JobTrendDto>> getTopTrending(int count);
}
```

### 16.6 PortfolioRepository
```dart
abstract class PortfolioRepository {
  Future<List<GitHubRepositoryDto>> getRepos(String profileId);
  Future<GitHubRepositoryDto> addRepo(CreateRepoDto dto);
  Future<GitHubRepositoryDto> updateRepo(String id, UpdateRepoDto dto);
  Future<void> deleteRepo(String id);
  Future<PortfolioAnalysisDto?> getAnalysis(String profileId);
  Future<PortfolioAnalysisDto> runAnalysis(String profileId);
}
```

---

## 17. Riverpod Providers

All providers defined with `@riverpod` annotation + code generation.

```dart
// core/providers/auth_state_provider.dart
@Riverpod(keepAlive: true)
class AuthState extends _$AuthState {
  @override
  AuthData build() {
    // Hydrate from TokenStorage on startup
    return AuthData.unauthenticated();
  }
  Future<void> login(String email, String password) async { ... }
  Future<void> loginWithGoogle(String idToken) async { ... }
  Future<void> logout() async { ... }
  void setAuth(AuthResponseDto response) { ... }
  void clearAuth() { state = AuthData.unauthenticated(); }
}

@riverpod
DioClient dioClient(DioClientRef ref) {
  return DioClient(
    baseUrl: Env.apiBaseUrl,
    tokenStorage: TokenStorage(),
    onTokensRefreshed: (dto) => ref.read(authStateProvider.notifier).setAuth(dto),
    onAuthFailed: () => ref.read(authStateProvider.notifier).clearAuth(),
  );
}

@riverpod
GraphQLClient graphqlClient(GraphqlClientRef ref) {
  final token = ref.watch(authStateProvider).accessToken;
  return buildGraphQLClient(token: token, baseUrl: Env.apiBaseUrl);
}

// Repository providers
@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) =>
    AuthRepositoryImpl(ref.watch(dioClientProvider));

@riverpod
RoadmapRepository roadmapRepository(RoadmapRepositoryRef ref) =>
    RoadmapRepositoryImpl(ref.watch(dioClientProvider), ref.watch(graphqlClientProvider));

// ... same pattern for all repositories
```

---

## 18. Error Handling & Token Refresh

### 18.1 AppException Sealed Class
```dart
sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);
}

class NetworkException extends AppException { ... }
class AuthException extends AppException { ... }
class ServerException extends AppException { ... }
class ValidationException extends AppException {
  final Map<String, String> fieldErrors;
  ...
}
```

### 18.2 Repository Error Wrapping
Every `RepositoryImpl` method wraps Dio calls:
```dart
@override
Future<AuthResponseDto> login(String email, String password) async {
  try {
    final resp = await _client.post('/api/auth/login', data: {'email': email, 'password': password});
    return AuthResponseDto.fromJson(resp.data);
  } on DioException catch (e) {
    if (e.response?.statusCode == 401) throw const AuthException('Invalid email or password');
    if (e.response?.statusCode == 400) throw ValidationException.fromResponse(e.response!.data);
    throw NetworkException(e.message ?? 'Network error');
  }
}
```

### 18.3 AsyncValue Error Display Pattern
Every screen using `AsyncValue`:
```dart
ref.watch(someProvider).when(
  loading: () => const SkeletonList(itemCount: 3),
  error: (err, _) => EmptyStateView(
    icon: Icons.error_outline,
    title: 'Something went wrong',
    subtitle: err is AppException ? err.message : 'Please try again',
    actionLabel: 'Retry',
    onAction: () => ref.invalidate(someProvider),
  ),
  data: (data) => _buildContent(data),
)
```

### 18.4 Global Snackbar for Mutations
All mutation errors surface through `AppSnackbar`:
```dart
try {
  await ref.read(portfolioProvider.notifier).addRepo(dto);
  AppSnackbar.show(context, message: 'Repository added', type: SnackbarType.success);
} on AppException catch (e) {
  AppSnackbar.show(context, message: e.message, type: SnackbarType.error);
}
```

### 18.5 Token Refresh — Dio Interceptor Sequence
```
1. Request fires with current accessToken in Authorization header
2. Server returns 401
3. TokenRefreshInterceptor.onError fires:
   a. Lock Dio queue (queue.lock()) to prevent concurrent refresh calls
   b. Read refreshToken from TokenStorage
   c. POST /api/auth/refresh { refreshToken }
   d. If 200: save new tokens → unlock queue → retry queued requests
   e. If 401/400: clear TokenStorage → call onAuthFailed → router redirects to /login
4. All queued requests either complete with new token or fail gracefully
```

---

## Summary — Implementation Checklist

| # | Task | Sprint | Depends On |
|---|---|---|---|
| 1 | pubspec.yaml — all packages | 1 | — |
| 2 | app_colors, app_text_styles, app_theme | 1 | — |
| 3 | token_storage.dart | 1 | — |
| 4 | dio_client.dart + interceptors | 1 | 3 |
| 5 | graphql_client.dart | 1 | 3 |
| 6 | app_router.dart | 1 | — |
| 7 | Freezed models (all DTOs) | 1 | — |
| 8 | AppButton, AppTextField widgets | 1 | 2 |
| 9 | AuthRepository + AuthNotifier | 1 | 4, 7 |
| 10 | landing_screen, login_screen, register_screen | 1 | 8, 9 |
| 11 | profile_setup_screen | 1 | 8, 9 |
| 12 | SkeletonLoader, LinearProgressBar, StatusChip, EmptyStateView | 2 | 2 |
| 13 | AppBottomNav + AppShell | 2 | 6 |
| 14 | RoadmapRepository + providers | 2 | 4, 7 |
| 15 | dashboard_screen | 2 | 12, 13, 14 |
| 16 | CareerRoleCard, RoadmapNodeCard | 2 | 2 |
| 17 | career_role_selection_screen + loading_screen | 2 | 14, 16 |
| 18 | roadmap_viewer_screen + NodeDetailSheet + NodeStatusSegmentedButton | 2 | 12, 16, 14 |
| 19 | ResourceListTile | 3 | 2 |
| 20 | learning_resources_screen | 3 | 5, 7, 19 |
| 21 | SkillInputScreen + skill chips + autocomplete | 3 | 8 |
| 22 | skill_gap_selection_screen | 3 | 16 |
| 23 | RadarChart widget (fl_chart) | 3 | 2 |
| 24 | skill_gap_result_screen | 3 | 23 |
| 25 | ChatBubble, SessionListTile | 4 | 2 |
| 26 | ChatRepository + MentorChat provider | 4 | 4, 7 |
| 27 | chat_screen (full) + markdown rendering | 4 | 25, 26 |
| 28 | TrendSkillCard, AreaChart, BarChart (fl_chart) | 5 | 2 |
| 29 | JobTrendsRepository + MarketPulse provider | 5 | 4, 7 |
| 30 | market_pulse_screen | 5 | 28, 29 |
| 31 | RepoCard, AppSnackbar, ConfirmDialog | 5 | 2 |
| 32 | PortfolioRepository + Portfolio provider | 5 | 4, 7 |
| 33 | portfolio_screen | 5 | 31, 32 |
| 34 | settings_screen (all 4 sections) | 5 | 8, 12, 31 |
| 35 | Error handling (sealed classes + snackbar wiring) | All | — |
| 36 | flutter_animate transitions + skeleton polish | 6 | All screens |
| 37 | Unit tests — all repositories (100% coverage) | 6 | All repos |
| 38 | Widget tests — login, roadmap viewer, chat | 6 | 10, 18, 27 |
| 39 | Integration test — Login → Career Role → Roadmap | 6 | 17, 18 |
| 40 | flutter analyze clean + dart format | 6 | All |
