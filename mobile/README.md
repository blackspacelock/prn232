# SECompass Mobile Application

SECompass Mobile is the Flutter client for the SECompass career development platform. The application gives software engineering learners a portable way to explore career paths, manage personal learning roadmaps, track skill progress, review market trends, build a public portfolio, and interact with an AI mentor.

This mobile client is designed to work with the SECompass backend API and shares the same domain model as the web application.

## Business Context

SECompass supports learners, students, and early-career engineers who need structured guidance for software engineering career growth. The mobile app focuses on daily learning workflows: checking progress, reviewing roadmap tasks, opening learning resources, asking mentor questions, and maintaining portfolio readiness.

Core business capabilities:

- Account registration, login, token refresh, logout, and profile setup.
- Public browsing for career roles, roadmap templates, and shared portfolios.
- Authenticated roadmap creation, management, viewing, and node-level progress tracking.
- Skill gap input and analysis for selected career paths.
- AI mentor chat sessions with saved conversation history.
- Market Pulse job trend review by region.
- GitHub portfolio and public portfolio management.
- User settings and profile maintenance.

## Technology Stack

- Flutter and Dart for cross-platform application delivery.
- Riverpod for dependency injection and state management.
- GoRouter for declarative routing, route guards, and shell navigation.
- Dio and Retrofit for REST API integration.
- GraphQL Flutter for GraphQL reads.
- Hive and Flutter Secure Storage for local persistence and secure token handling.
- Freezed and JSON Serializable for generated immutable models and JSON mapping.
- Flutter Animate, Shimmer, Google Fonts, FL Chart, Dash Chat, Flutter Markdown, URL Launcher, and Share Plus for product UI features.

## Supported Targets

The project includes Flutter platform folders for:

- Android
- iOS
- Web
- Windows
- macOS
- Linux

The primary product targets are Android and iOS. Desktop and web targets may require additional validation before production use.

## Prerequisites

Install the following before working on the mobile client:

- Flutter SDK 3.5.0 or newer
- Dart SDK included with Flutter
- Android Studio for Android emulator and SDK tooling
- Xcode and CocoaPods for iOS development on macOS
- A running SECompass backend API

Verify your local environment:

```powershell
flutter doctor
flutter --version
```

## Project Structure

```text
mobile/
  android/                 Android platform project
  ios/                     iOS platform project
  assets/images/           Image assets registered in pubspec.yaml
  lib/
    core/
      api/                 Dio, GraphQL, API constants, and API client setup
      models/              Shared DTO and domain model classes
      router/              GoRouter setup and authenticated route protection
      storage/             Local and secure persistence utilities
      theme/               Material theme configuration
      widgets/             Shared reusable widgets
    features/
      ai_mentor/           Chat sessions and mentor conversation UI
      auth/                Login, registration, auth provider, profile setup entry
      dashboard/           Learner dashboard
      job_trends/          Market Pulse screens and repositories
      portfolio/           GitHub repository analysis and public portfolio flows
      profile/             Profile setup and profile API integration
      roadmap/             Role catalog, roadmap templates, personal roadmaps, resources
      settings/            User profile and application settings
      skill_gap/           Skill input and gap analysis
    main.dart              App bootstrap, providers, GraphQL provider, router, theme
  pubspec.yaml             Dependencies, assets, and package metadata
  analysis_options.yaml    Static analysis and lint configuration
```

## Application Architecture

The mobile app follows a feature-oriented architecture. Each feature owns its screens, repositories, providers, and related models where practical. Shared infrastructure lives under `lib/core`.

Important architectural points:

- `lib/main.dart` initializes Flutter, Hive for GraphQL cache support, Riverpod `ProviderScope`, the GraphQL provider, theme, and `MaterialApp.router`.
- `lib/core/router/app_router.dart` defines public routes, authenticated routes, route redirects, and the bottom-navigation shell.
- `lib/core/api/api_constants.dart` centralizes REST endpoint paths and the GraphQL endpoint.
- REST integrations use repository interfaces and implementations, keeping screens separated from transport details.
- Riverpod providers expose feature state, repositories, async data loading, and mutation workflows.
- Public routes are available without login; protected routes redirect unauthenticated users to `/login`.

## Routing Overview

Public routes:

- `/`
- `/login`
- `/register`
- `/portfolio/:userId`
- `/explore/roles`
- `/explore/roles/:roleId`
- `/explore/roadmaps/:roadmapId`

Authenticated routes:

- `/dashboard`
- `/roadmaps`
- `/career-roles`
- `/catalog`
- `/catalog/roles/:roleId`
- `/roadmap-template/:roadmapId`
- `/career-roles/loading`
- `/roadmap/:personalRoadmapId`
- `/roadmap/:id/node/:nodeId/resources`
- `/skill-gap/select`
- `/skill-gap/input`
- `/skill-gap/result`
- `/mentor`
- `/mentor/:sessionId`
- `/market-pulse`
- `/market`
- `/portfolio`
- `/settings`

## Backend Integration

The mobile client communicates with the SECompass API over REST and GraphQL.

Default backend URL:

```text
https://localhost:7210
```

Default GraphQL endpoint:

```text
https://localhost:7210/graphql
```

Key REST endpoint groups are defined in `lib/core/api/api_constants.dart`:

- `/api/auth`
- `/api/profiles`
- `/api/career-roadmaps`
- `/api/personal-roadmaps`
- `/api/node-progress`
- `/api/skills`
- `/api/chat/sessions`
- `/api/github-repositories`
- `/api/public-portfolios`
- `/api/users`
- `/api/ai/portfolio-analysis`
- `/api/job-trends`

## Environment Configuration

The mobile app reads its backend URL from a Dart compile-time define:

```dart
String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://localhost:7210',
)
```

Use `--dart-define` to point the app at the correct backend for each environment.

Local backend on desktop or iOS simulator:

```powershell
flutter run --dart-define=API_BASE_URL=https://localhost:7210
```

Android emulator calling a backend running on the host machine:

```powershell
flutter run --dart-define=API_BASE_URL=https://10.0.2.2:7210
```

Physical device on the same network:

```powershell
flutter run --dart-define=API_BASE_URL=https://192.168.1.20:7210
```

Production or staging API:

```powershell
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

Do not hard-code production URLs, credentials, or secret values directly into source files.

## Local Development Setup

From the `mobile` directory:

```powershell
flutter pub get
```

Run static analysis:

```powershell
flutter analyze
```

Run tests:

```powershell
flutter test
```

Start the app:

```powershell
flutter run --dart-define=API_BASE_URL=https://localhost:7210
```

When changing generated models, Retrofit APIs, Riverpod annotations, JSON serializable classes, Freezed classes, or Envied configuration, regenerate source files:

```powershell
dart run build_runner build --delete-conflicting-outputs
```

For active model/API development, watch for changes:

```powershell
dart run build_runner watch --delete-conflicting-outputs
```

## Platform Run Commands

Android emulator:

```powershell
flutter run -d android --dart-define=API_BASE_URL=https://10.0.2.2:7210
```

Android physical device:

```powershell
flutter devices
flutter run -d <device-id> --dart-define=API_BASE_URL=https://<your-lan-ip>:7210
```

iOS simulator:

```powershell
flutter run -d ios --dart-define=API_BASE_URL=https://localhost:7210
```

Web smoke test:

```powershell
flutter run -d chrome --dart-define=API_BASE_URL=https://localhost:7210
```

## Build Commands

Android debug APK:

```powershell
flutter build apk --debug --dart-define=API_BASE_URL=https://api.example.com
```

Android release APK:

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

Android App Bundle for Play Store:

```powershell
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.example.com
```

iOS release build:

```powershell
flutter build ios --release --dart-define=API_BASE_URL=https://api.example.com
```

Production release builds should use an approved backend URL and a reviewed signing configuration.

## Development Workflow

Recommended workflow for feature development:

1. Confirm the backend API contract and response shape.
2. Add or update DTO/model classes.
3. Update repository interface and implementation.
4. Expose state through Riverpod providers.
5. Build or update screens and widgets.
6. Add loading, empty, error, and success states.
7. Run code generation when required.
8. Run `flutter analyze` and relevant tests.
9. Test on at least one mobile target before opening a pull request.

## Coding Standards

- Keep feature code inside the relevant `lib/features/<feature>` folder.
- Put reusable infrastructure in `lib/core`.
- Keep screens focused on presentation and user interaction.
- Keep API calls inside repositories.
- Prefer Riverpod providers for application state and dependency access.
- Use typed DTOs and generated serializers instead of unstructured maps in feature code.
- Include loading, empty, and error UI for asynchronous screens.
- Avoid committing generated build artifacts, local environment files, or machine-specific IDE state.

## Quality Gates

Run these commands before merging mobile changes:

```powershell
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
```

Recommended manual checks:

- Register and log in.
- Confirm token refresh by reopening the app.
- Open dashboard, roadmaps, roadmap detail, and node resources.
- Run the skill gap flow.
- Start and resume an AI mentor chat.
- Open Market Pulse.
- Update portfolio details and verify the public portfolio route.
- Log out and confirm protected routes redirect to login.

## API And Authentication Notes

- Authentication is token-based and handled by the auth repository/provider flow.
- Secure values should be stored through secure storage, not plain local files.
- Protected API requests should include the current bearer token.
- Refresh-token behavior should be validated whenever auth response DTOs change.
- The app expects the backend CORS, HTTPS certificate, and network binding to allow mobile clients during local development.

## Troubleshooting

Android emulator cannot reach the backend:

- Use `https://10.0.2.2:7210` instead of `https://localhost:7210`.
- Confirm the backend is running.
- Confirm the backend listens on the expected port.

Physical device cannot reach the backend:

- Use the computer's LAN IP address.
- Keep the phone and development machine on the same network.
- Allow the backend port through the firewall.
- Consider running the backend on an HTTP profile for local device testing if HTTPS certificates block development.

HTTPS certificate errors:

- Trust the ASP.NET Core development certificate on the host machine.
- For mobile simulators or physical devices, use a trusted certificate, install the development certificate, or use a local HTTP endpoint during development.

Generated files are stale or missing:

- Run `dart run build_runner build --delete-conflicting-outputs`.
- Restart the analyzer or IDE after generation.

Dependency conflicts:

- Run `flutter clean`.
- Run `flutter pub get`.
- Rebuild generated files.

GraphQL cache or startup issues:

- Confirm `initHiveForFlutter()` is called before the app starts.
- Clear local app data during development when schema or cache behavior changes.

## Release Checklist

- Confirm the release API URL is correct.
- Confirm app name, icons, splash/launch assets, and version are final.
- Increment `version` in `pubspec.yaml`.
- Run analysis, tests, and a release build.
- Validate login, roadmap, mentor, market, and portfolio flows against the target backend.
- Confirm Android signing or iOS signing/provisioning configuration.
- Archive release artifacts in the agreed delivery location.

## Related Projects

- Backend API: `../backend/src/SECompass`
- Web frontend: `../frontend`
- Root project documentation: `../README.md`
