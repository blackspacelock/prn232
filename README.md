# SECompass

SECompass is a full-stack software engineering career guidance platform. It helps learners explore career paths, follow structured and personalized roadmaps, track skill progress, review market demand, build a public portfolio, and receive support from an AI mentor.

The system includes an ASP.NET Core backend API, a React web application, and a Flutter mobile application. It is designed as a multi-client product where the backend owns business rules and data access, while web and mobile provide tailored experiences for learners and administrators.

## Product Summary

SECompass supports students, self-learners, and early-career engineers who need practical guidance for software engineering career growth. The platform combines curated roadmap templates, personalized learning plans, skill-gap analysis, job-market signals, portfolio evidence, and AI-assisted mentoring into one product.

Primary user groups:

- Learners who want career direction, learning roadmaps, progress tracking, AI mentoring, and portfolio support.
- Administrators who manage career roles, roadmap templates, learning nodes, skills, learning resources, job trends, users, and system configuration.
- Public visitors who browse career catalogs, roadmap previews, and shared portfolios.

## Core Capabilities

- Email/password authentication, Google login, JWT access tokens, and refresh tokens.
- Public career-role and roadmap-template catalog.
- Personal roadmap generation, management, sharing, and node-level progress tracking.
- Skill gap analysis based on selected career direction and current learner skills.
- AI mentor chat and AI-assisted recommendation workflows.
- Market Pulse job-trend scraping, management, and reporting.
- GitHub repository tracking and portfolio analysis.
- Public portfolio publishing.
- Admin dashboard and operational management screens.
- REST and GraphQL API access for client applications.

## System Architecture

```text
                         +----------------------+
                         |  Public Visitors     |
                         |  Learners            |
                         |  Administrators      |
                         +----------+-----------+
                                    |
               +--------------------+--------------------+
               |                                         |
       +-------v--------+                        +-------v--------+
       | React Web App  |                        | Flutter Mobile |
       | frontend/      |                        | mobile/        |
       +-------+--------+                        +-------+--------+
               | REST + GraphQL                          |
               +--------------------+--------------------+
                                    |
                         +----------v-----------+
                         | ASP.NET Core API     |
                         | backend/             |
                         +----------+-----------+
                                    |
               +--------------------+--------------------+
               |                    |                    |
       +-------v--------+   +-------v--------+   +-------v--------+
       | SQL Server     |   | OpenAI API     |   | Job Sources    |
       | EF Core        |   | AI mentor      |   | Market Pulse   |
       +----------------+   +----------------+   +----------------+
```

High-level design:

- Backend is the source of truth for authentication, authorization, business workflows, persistence, AI orchestration, and job trend scraping.
- Web frontend is the primary browser client for public pages, learner workflows, and admin operations.
- Mobile frontend is optimized for learner workflows such as roadmaps, progress, mentor chat, market trends, and portfolio updates.
- SQL Server stores application data through Entity Framework Core.
- OpenAI is used through backend services only; clients never call OpenAI directly.

## Repository Layout

```text
prn232/
  backend/
    src/SECompass/
      SECompass.API/             ASP.NET Core API, controllers, GraphQL, middleware, background services
      SECompass.BusinessLogic/   Services, interfaces, DTOs, mappings, business rules
      SECompass.DataAccess/      EF Core DbContext, entities, configurations, migrations, repositories
      SECompass.slnx             .NET solution file
  frontend/                      React, TypeScript, Vite web client
  mobile/                        Flutter mobile client
  document/                      Project documentation and supporting materials
  azure-pipelines.yaml           Azure Pipeline for backend build and deployment
  README.md                      System-level documentation
```

Project-specific documentation:

- Backend API source: `backend/src/SECompass`
- Web frontend README: `frontend/README.md`
- Mobile README: `mobile/README.md`

## Technology Stack

Backend:

- ASP.NET Core on .NET 10
- Entity Framework Core with SQL Server
- ASP.NET Core Controllers for REST APIs
- Hot Chocolate GraphQL
- JWT Bearer authentication
- AutoMapper
- Swagger / OpenAPI
- Serilog console and rolling file logging
- Hosted background service for job trend scraping
- Azure App Service deployment through Azure Pipelines

Frontend:

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Apollo Client
- Axios
- Zustand
- Tailwind CSS 4
- React Flow
- Recharts
- Lucide React
- Google OAuth provider

Mobile:

- Flutter and Dart
- Riverpod
- GoRouter
- Dio and Retrofit
- GraphQL Flutter
- Hive and Flutter Secure Storage
- Freezed and JSON Serializable
- Flutter Animate, Shimmer, Google Fonts, FL Chart, Dash Chat, Flutter Markdown, Share Plus, URL Launcher

## Backend Architecture

The backend uses a layered architecture:

```text
SECompass.API
  Controllers, GraphQL endpoint, middleware, startup configuration, hosted services

SECompass.BusinessLogic
  Service interfaces, service implementations, DTOs, mappings, workflow logic

SECompass.DataAccess
  EF Core DbContext, entities, configurations, migrations, repositories, unit of work
```

Important backend responsibilities:

- Validate required configuration at startup.
- Configure SQL Server persistence with retry behavior.
- Expose REST controllers and GraphQL queries.
- Apply CORS, authentication, and authorization.
- Handle application errors through centralized middleware.
- Log requests, performance, and application events.
- Run Market Pulse scraping through a hosted background service.
- Encapsulate AI mentor and AI recommendation calls behind backend services.

Default local API endpoints:

- Swagger UI: `https://localhost:7210/swagger`
- GraphQL: `https://localhost:7210/graphql`
- HTTPS API base URL: `https://localhost:7210`
- HTTP fallback URL: `http://localhost:5134`

## Frontend Architecture

The React application is organized around product surfaces:

```text
frontend/src/
  app/
    components/      Shared UI, route guards, layout, admin widgets, roadmap widgets
    pages/           Public pages, learner pages, admin pages, catalog pages
    routes.tsx       Public, protected, admin, and legacy route definitions
  graphql/           GraphQL query documents
  lib/               Axios, Apollo, auth mapping, query client, redirects
  store/             Zustand authentication store
  styles/            Global styles and fonts
  types/             Shared API DTO types
```

Important frontend responsibilities:

- Provide public, authenticated learner, and admin browser experiences.
- Attach bearer tokens to REST and GraphQL requests.
- Refresh sessions when access tokens expire.
- Redirect unauthenticated users from protected routes.
- Render the roadmap canvas and operational admin views.
- Build static assets for SPA hosting.

## Mobile Architecture

The Flutter app uses a feature-oriented structure:

```text
mobile/lib/
  core/
    api/             API constants, Dio client, GraphQL client
    models/          Shared models
    router/          GoRouter setup and route protection
    storage/         Local and secure persistence
    theme/           App theme
    widgets/         Shared widgets
  features/
    ai_mentor/
    auth/
    dashboard/
    job_trends/
    portfolio/
    profile/
    roadmap/
    settings/
    skill_gap/
  main.dart
```

Important mobile responsibilities:

- Provide learner-focused mobile workflows.
- Support public catalog and public portfolio routes.
- Protect authenticated routes through router redirects.
- Use secure/local storage for auth-related state.
- Read the backend URL from `API_BASE_URL` at build/run time.

## Prerequisites

Install the following tools for full-system development:

- .NET SDK 10.x
- SQL Server or Azure SQL Database
- Node.js and npm
- Flutter SDK 3.5.0 or newer
- Android Studio for Android emulator/device development
- Xcode and CocoaPods for iOS development on macOS
- Git

Recommended verification commands:

```powershell
dotnet --version
node --version
npm --version
flutter doctor
```

## Configuration

The backend reads configuration from `appsettings.json` and environment variables. Use environment variables or platform secret stores for real credentials.

Backend configuration keys:

```text
ConnectionStrings__DefaultConnection
Jwt__Issuer
Jwt__Audience
Jwt__Secret
Jwt__Algorithm
Jwt__AccessTokenExpiryMinutes
Jwt__RefreshTokenExpiryDays
Google__ClientId
Google__ClientSecret
Google__RedirectUri
Cors__AllowedOrigins
OpenAI__ApiKey
OpenAI__Model
OpenAI__BaseUrl
Serilog__MinimumLevel__Default
```

Frontend environment variables:

```env
VITE_API_URL=https://localhost:7210
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Mobile runtime define:

```powershell
--dart-define=API_BASE_URL=https://localhost:7210
```

Important security rule: do not commit real secrets, production database credentials, OpenAI keys, Google client secrets, JWT signing keys, or deployment credentials.

## Local Development Quick Start

Start the backend first, then start one or both clients.

### 1. Backend API

```powershell
cd backend/src/SECompass
dotnet restore
dotnet ef database update --project SECompass.DataAccess --startup-project SECompass.API
dotnet run --project SECompass.API --launch-profile https
```

Open:

```text
https://localhost:7210/swagger
https://localhost:7210/graphql
```

If local HTTPS fails, trust the ASP.NET development certificate:

```powershell
dotnet dev-certs https --trust
```

### 2. Web Frontend

Create `frontend/.env`:

```env
VITE_API_URL=https://localhost:7210
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Run the web app:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend CORS setting must include:

```text
Cors__AllowedOrigins=http://localhost:5173
```

### 3. Mobile App

Run the mobile app:

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://localhost:7210
```

For Android emulators, use the host loopback address:

```powershell
flutter run --dart-define=API_BASE_URL=https://10.0.2.2:7210
```

For physical devices, use the development machine's LAN IP address and ensure firewall/network access is allowed.

## API Documentation

Run the backend and open:

- Swagger UI: `https://localhost:7210/swagger`
- GraphQL endpoint: `https://localhost:7210/graphql`
- Example GraphQL queries: `backend/src/SECompass/SECompass.API/GraphQL/ExampleQueries.graphql`

API behavior notes:

- REST APIs are exposed from ASP.NET Core controllers under `/api/...`.
- GraphQL is exposed through Hot Chocolate at `/graphql`.
- Protected endpoints require JWT bearer tokens.
- Swagger includes bearer-token authorization support.

## Development Workflow

Recommended workflow for full-stack changes:

1. Confirm the product workflow and target user role.
2. Update backend entities, DTOs, services, repositories, controllers, or GraphQL queries as required.
3. Add or update EF Core migrations when the database model changes.
4. Update web/mobile API types, repositories, queries, or screens.
5. Validate authentication, authorization, loading states, error states, and empty states.
6. Run backend, frontend, and mobile quality checks relevant to the change.
7. Smoke test the complete user flow from client to backend.
8. Document new configuration, commands, or operational behavior.

## Quality Gates

Backend:

```powershell
cd backend/src/SECompass
dotnet restore
dotnet build SECompass.API/SECompass.API.csproj
```

Frontend:

```powershell
cd frontend
npm install
npm run lint
npm run build
```

Mobile:

```powershell
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
```

Recommended full-system manual checks:

- Register and log in with email/password.
- Log in with Google when OAuth is configured.
- Confirm refresh-token behavior by reopening clients or waiting for token renewal.
- Browse career roles and roadmap templates publicly.
- Create or generate a personal roadmap.
- Open roadmap details and update node progress.
- Run skill gap analysis.
- Start and resume an AI mentor chat.
- Open Market Pulse.
- Add GitHub repository or portfolio data.
- Open the public portfolio route.
- Confirm admin-only routes require an admin account.
- Log out and confirm protected routes redirect correctly.

## Database And Migrations

Entity Framework Core migrations live in:

```text
backend/src/SECompass/SECompass.DataAccess/Migrations
```

Apply migrations locally:

```powershell
cd backend/src/SECompass
dotnet ef database update --project SECompass.DataAccess --startup-project SECompass.API
```

Create a new migration after model changes:

```powershell
dotnet ef migrations add MigrationName --project SECompass.DataAccess --startup-project SECompass.API
```

Review generated migrations before committing. Confirm destructive changes are intentional and safe for the target environment.

## Deployment

The repository includes an Azure Pipeline for backend deployment:

```text
azure-pipelines.yaml
```

Pipeline behavior:

- Triggers on `main`.
- Uses `windows-latest`.
- Installs .NET SDK 10.x.
- Restores and builds `backend/src/SECompass/SECompass.API/SECompass.API.csproj`.
- Publishes a self-contained `win-x86` backend artifact.
- Archives the backend artifact as `api.zip`.
- Deploys to Azure App Service `secompass-api`.

Production backend settings should be configured in Azure App Service application settings using environment variable names such as:

```text
ConnectionStrings__DefaultConnection
Jwt__Secret
Google__ClientSecret
OpenAI__ApiKey
Cors__AllowedOrigins
```

Frontend deployment:

- Run `npm run build` in `frontend`.
- Deploy the generated `frontend/dist` folder to a static hosting provider.
- Configure SPA fallback rewrites to `index.html`.
- Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` at build time.

Mobile deployment:

- Build Android APK/AAB or iOS release artifacts from `mobile`.
- Pass the production API URL with `--dart-define=API_BASE_URL=...`.
- Confirm Android signing or iOS signing/provisioning before release.

## Security Notes

- Rotate any secret that has ever been committed to source control.
- Keep backend secrets in user secrets, environment variables, Azure App Service settings, or a secret manager.
- Frontend `VITE_*` values are public at runtime and must not contain secrets.
- Mobile compile-time values can be inspected from distributed apps and must not contain secrets.
- Enforce authorization on the backend; frontend and mobile route guards are not security boundaries.
- Use HTTPS for production traffic.
- Restrict CORS to approved frontend origins.
- Use least-privilege database credentials in production.
- Review logs to ensure sensitive tokens, passwords, connection strings, and API keys are never written.

## Troubleshooting

Backend fails on startup:

- Confirm required configuration keys are present.
- Confirm `ConnectionStrings__DefaultConnection` is valid.
- Confirm SQL Server is reachable.
- Check console logs and `logs/app-*.log`.

Frontend cannot call backend:

- Confirm `VITE_API_URL` points to the running backend.
- Confirm backend CORS includes `http://localhost:5173`.
- Trust the local HTTPS certificate with `dotnet dev-certs https --trust`.
- Restart the Vite dev server after changing `.env`.

Mobile cannot call backend:

- Use `https://10.0.2.2:7210` for Android emulator.
- Use the host machine's LAN IP for physical devices.
- Confirm firewall rules allow the backend port.
- Use HTTP locally if simulator/device certificate trust blocks HTTPS development.

Authentication redirects unexpectedly:

- Confirm backend JWT issuer, audience, and signing key match configuration.
- Confirm refresh-token endpoint is reachable.
- Clear client storage and log in again.
- Check API responses for `401` or GraphQL `UNAUTHENTICATED` errors.

Direct frontend links return 404 in production:

- Configure static hosting fallback to `index.html`.
- Confirm the deployment output is `frontend/dist`.

Flutter generated files are stale:

- Run `dart run build_runner build --delete-conflicting-outputs`.
- Restart the IDE analyzer.

## Related Documentation

- Web frontend: `frontend/README.md`
- Mobile app: `mobile/README.md`
- Backend solution: `backend/src/SECompass`
- Azure pipeline: `azure-pipelines.yaml`
