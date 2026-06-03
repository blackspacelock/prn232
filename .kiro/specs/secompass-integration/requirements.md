# Requirements Document

## Introduction

SECompass is an AI-Powered Career Orientation & Learning Roadmap Platform for Software Engineering students. The backend (ASP.NET Core .NET 10, 3-layer architecture with 13 REST controllers and a HotChocolate GraphQL endpoint) and the frontend (React 19 + TypeScript + Vite + Tailwind CSS + React Router v7) are fully built as isolated units. This feature covers end-to-end integration: wiring every frontend page to real API data, establishing authenticated HTTP communication (JWT dual-token + Google OAuth), configuring CORS, managing environment secrets across dev/prod, installing missing frontend dependencies, and achieving deploy-ready configuration for both sides.

All read operations use GraphQL via Apollo Client. All write operations use REST via TanStack Query + Axios. Access Tokens last for 1 week and are stored in Zustand in-memory state. Refresh Tokens are stored in sessionStorage (development) or HttpOnly cookies (production).

---

## Glossary

- **API**: The SECompass.API ASP.NET Core project running at `https://localhost:7210` (dev) or on Azure App Service (prod).
- **Frontend**: The React 19 + TypeScript + Vite application in the `frontend/` directory.
- **AuthStore**: A Zustand store that holds the authenticated user's identity, Access Token, and derived auth state in memory.
- **AccessToken**: A JWT with a 1-week lifetime returned by `/api/auth/login`, `/api/auth/register`, `/api/auth/google`, and `/api/auth/refresh`. Stored exclusively in AuthStore memory.
- **RefreshToken**: A long-lived opaque token used to obtain a new AccessToken pair. Stored in sessionStorage during development and in an HttpOnly cookie during production.
- **AxiosInstance**: A configured Axios HTTP client with base URL, Bearer token injection, and 401 auto-refresh interceptor.
- **ApolloClient**: Apollo Client instance configured with `authLink` (Bearer token injection), `errorLink` (401 retry), and `HttpLink` targeting `/graphql`.
- **ProtectedRoute**: A React Router wrapper component that redirects unauthenticated users to `/login`.
- **AdminRoute**: A React Router wrapper component that allows access only to users whose role equals `Admin`; redirects others to `/dashboard`.
- **NODE_STATUS_COLORS**: A shared TypeScript constant mapping node progress status values to MD3 color tokens. Shared by React Flow nodes, StatusChip, and progress drawers.
- **TanStack Query**: `@tanstack/react-query` library used exclusively for REST mutation hooks (`useMutation`).
- **CORS_Policy**: The named ASP.NET Core CORS policy `AllowFrontend` registered in the service layer and applied in the middleware pipeline.
- **VITE_**: Prefix required for all Vite environment variables exposed to the frontend bundle.
- **GraphQL_Endpoint**: The HotChocolate endpoint at `/graphql` on the API.
- **MD3**: Material Design 3 design system implemented via Tailwind CSS custom properties — no MUI dependency.
- **Personal_Roadmap**: A user-specific roadmap generated from a Career Roadmap template via `POST /api/personal-roadmaps/generate`.
- **Node_Progress**: Per-node completion tracking within a Personal Roadmap, updated via `PUT /api/node-progress/{nodeProgressId}/status`.

---

## Requirements

### Requirement 1: CORS Configuration

**User Story:** As a frontend developer, I want the backend to accept requests from the frontend origin, so that browser cross-origin requests are not blocked.

#### Acceptance Criteria

1. THE API SHALL register a named CORS policy called `AllowFrontend` that is applied before authentication in the middleware pipeline.
2. IF the environment is `Development`, THE API SHALL allow the origin `https://localhost:5173`.
3. IF the environment is `Production`, THE API SHALL read allowed origins from the `Cors:AllowedOrigins` configuration key; no origin SHALL be hardcoded.
4. THE API SHALL allow the HTTP methods `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` on the CORS policy.
5. THE API SHALL allow the `Authorization`, `Content-Type`, and `X-Requested-With` request headers on the CORS policy.
6. THE API SHALL allow credentials on the CORS policy so that HttpOnly cookie-based refresh tokens are transmitted correctly in production.
7. WHEN a preflight `OPTIONS` request is received from an allowed origin, THE API SHALL respond with the `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Access-Control-Allow-Credentials` headers within 200 ms.
8. IF `Cors:AllowedOrigins` is absent or empty in the `Production` environment, THE API SHALL respond to cross-origin requests without any `Access-Control-Allow-Origin` header, effectively rejecting them.
9. IF the environment is neither `Development` nor `Production`, THE API SHALL apply the `Development` CORS policy as the fallback.

---

### Requirement 2: Environment and Secrets Management

**User Story:** As a developer and as an operator, I want all secrets and environment-specific values to be externalized from source code, so that the application is secure and deployable across environments without code changes.

#### Acceptance Criteria

1. THE Frontend SHALL read the backend base URL from the `VITE_API_URL` environment variable defined in `.env.local` (development) and injected at build time (production).
2. THE Frontend SHALL read the Google OAuth Client ID from the `VITE_GOOGLE_CLIENT_ID` environment variable.
3. THE Frontend `.env` file committed to version control SHALL contain only placeholder keys with empty values (e.g., `VITE_API_URL=`) and no real secret values.
4. THE API SHALL read `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Google:ClientId`, `Google:ClientSecret`, and `ConnectionStrings:DefaultConnection` exclusively from `IConfiguration`, with no hardcoded values in compiled code.
5. WHEN the `Production` environment is active, THE API SHALL support overriding configuration values via environment variables using the double-underscore delimiter convention (e.g., `Jwt__Secret`, `ConnectionStrings__DefaultConnection`).
6. THE `.gitignore` SHALL include `.env.local`, `.env.production.local`, and `appsettings.Production.json` to prevent secrets from entering version control.
7. IF `VITE_API_URL` is absent at build time, THE Frontend build process SHALL emit a console warning identifying the missing variable name; the build SHALL still complete successfully.
8. IF `VITE_GOOGLE_CLIENT_ID` is absent at build time, THE Frontend build process SHALL emit a console warning identifying the missing variable name; the Google OAuth button SHALL render as disabled at runtime.

---

### Requirement 3: Frontend Dependency Installation

**User Story:** As a frontend developer, I want all required libraries installed, so that API communication, state management, and rich UI features work correctly.

#### Acceptance Criteria

1. THE Frontend SHALL have `axios` version `^1.9.0` listed as a production dependency for HTTP REST communication.
2. THE Frontend SHALL have `@tanstack/react-query` version `^5.0.0` listed as a production dependency for REST mutation state management.
3. THE Frontend SHALL have `@apollo/client` and `graphql` listed as production dependencies for GraphQL query execution.
4. THE Frontend SHALL have `zustand` listed as a production dependency for global auth and UI state management.
5. THE Frontend SHALL have `@react-oauth/google` listed as a production dependency for Google OAuth flows.
6. THE Frontend SHALL have `@xyflow/react` listed as a production dependency for interactive roadmap canvas rendering.
7. THE Frontend SHALL have `react-markdown` and `remark-gfm` listed as production dependencies for Markdown rendering in chat messages.
8. WHEN `npm install` completes with exit code 0 and `tsc -b && vite build` is executed, THE build SHALL complete within 120 seconds with exit code 0 and no missing-module or type errors.

---

### Requirement 4: Authentication Layer

**User Story:** As a student, I want to log in with email/password or Google, stay authenticated across page navigations, and have my session automatically renewed, so that I am never unexpectedly logged out during use.

#### Acceptance Criteria

1. THE AuthStore SHALL store `accessToken`, `user` (id, email, role, profileId), and `isAuthenticated` as reactive Zustand state; no token SHALL be persisted to `localStorage`.
2. THE API SHALL issue every AccessToken with an expiration time exactly 1 week after the token is created.
3. WHEN a login, register, or Google OAuth response is received, THE AuthStore SHALL update `accessToken`, `user`, and `isAuthenticated` atomically in a single `set()` call.
4. WHEN the AxiosInstance sends a request and `accessToken` is non-null in AuthStore, THE AxiosInstance SHALL inject the `Authorization: Bearer {accessToken}` header.
5. WHEN an HTTP 401 response is received from any REST endpoint, THE AxiosInstance interceptor SHALL call `POST /api/auth/refresh` with the stored Refresh Token, update AuthStore with the new Access Token, and retry the original request exactly once.
6. IF the `POST /api/auth/refresh` call returns a non-200 response, THE AxiosInstance interceptor SHALL set `accessToken` to null, `user` to null, and `isAuthenticated` to false in AuthStore, then navigate the user to `/login`.
7. WHEN the ApolloClient sends a request and `accessToken` is non-null in AuthStore, THE ApolloClient `authLink` SHALL attach the `Authorization: Bearer {accessToken}` header.
8. WHEN the ApolloClient receives a GraphQL error with `extensions.code === "UNAUTHENTICATED"`, THE ApolloClient `errorLink` SHALL attempt a token refresh and retry the operation exactly once.
9. THE Frontend SHALL wrap the React application root with `GoogleOAuthProvider` supplying the `VITE_GOOGLE_CLIENT_ID` client ID.
10. WHEN the Google OAuth button is clicked and the user consents, THE Frontend SHALL send the Google ID token to `POST /api/auth/google` and store the `AuthResponseDto` in AuthStore on success.
11. WHEN the user clicks logout in Development, THE Frontend SHALL call `POST /api/auth/logout`, clear AuthStore fields to null/false, remove the `secompass_rt` key from sessionStorage, and navigate to `/`.
12. WHEN the user clicks logout in Production, THE Frontend SHALL call `POST /api/auth/logout`, clear AuthStore fields to null/false, and navigate to `/`; THE API SHALL clear the `secompass_rt` HttpOnly cookie in the logout response.
13. WHILE the `Development` environment is active, THE Frontend SHALL store the Refresh Token in `sessionStorage` under the key `secompass_rt`.
14. WHILE the `Production` environment is active, THE API SHALL set the Refresh Token as an HttpOnly, Secure, SameSite=Strict cookie named `secompass_rt`; THE Frontend SHALL NOT store it in any JavaScript-accessible storage.

---

### Requirement 5: Route Protection

**User Story:** As a student, I want unauthenticated users to be redirected to the login page, and as an admin, I want admin-only routes restricted to users with the Admin role, so that data is accessed only by authorized users.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to a protected route and AuthStore has completed initialization, THE ProtectedRoute SHALL redirect to `/login` preserving the original path in `state.from`.
2. WHEN an authenticated user with a non-Admin role navigates to an admin route, THE AdminRoute SHALL redirect to `/dashboard`.
3. WHEN an unauthenticated user navigates to an admin route, THE AdminRoute SHALL redirect to `/login` preserving the original path in `state.from`.
4. THE Frontend router SHALL wrap `/dashboard`, `/roadmaps`, `/roadmap/:id`, `/mentor`, `/skill-gap`, `/market`, `/portfolio`, and `/settings` with ProtectedRoute.
5. THE Frontend router SHALL wrap `/admin/career-roles`, `/admin/roadmaps`, `/admin/nodes`, and `/admin/job-trends` with AdminRoute.
6. THE routes `/`, `/login`, `/register`, and `/portfolio/:username` SHALL remain publicly accessible without authentication.
7. WHEN a redirected user successfully authenticates, THE Frontend SHALL navigate to the original path stored in `state.from`, or to `/dashboard` if no prior path was stored.
8. WHILE AuthStore is initializing (restoring session from sessionStorage/cookie), THE ProtectedRoute SHALL render a loading indicator and SHALL NOT redirect until initialization completes.

---

### Requirement 6: REST Mutations — Auth Domain

**User Story:** As a student, I want to register, log in, authenticate via Google, refresh my session, and log out through the frontend form interactions, so that my account is managed reliably.

#### Acceptance Criteria

1. THE Login page SHALL use a `useMutation` hook that calls `POST /api/auth/login` with `{ email, password }` and stores the `AuthResponseDto` in AuthStore on success.
2. THE Register page SHALL use a `useMutation` hook that calls `POST /api/auth/register` with `{ email, password, fullName }` and redirects to `/dashboard` on success.
3. IF `POST /api/auth/login` or `POST /api/auth/register` returns an error response, THE Frontend SHALL display the error message in the existing Snackbar component without page reload.
4. WHEN an AccessToken expires and a REST call results in HTTP 401, THE AxiosInstance interceptor SHALL invoke `POST /api/auth/refresh` and retry the original request once transparently, without the calling component needing to handle the 401.

---

### Requirement 7: REST Mutations — Profile and Skills

**User Story:** As a student, I want to update my profile information and manage my skill list from the Settings page, so that my career data stays current.

#### Acceptance Criteria

1. THE Settings page SHALL use a `useMutation` hook that calls `PUT /api/profiles/{userId}` with the updated profile fields on form submit.
2. THE Settings page SHALL use a `useMutation` hook that calls `POST /api/skills` with `{ profileId, skillName, proficiencyLevel }` to add a new skill.
3. THE Settings page SHALL use a `useMutation` hook that calls `DELETE /api/skills/{skillId}` to remove a skill.
4. WHEN a skill mutation succeeds, THE Frontend SHALL invalidate the Apollo Client cache for the `GetProfileWithSkills` query so that the skills list re-fetches automatically.
5. IF any profile or skill mutation returns an error, THE Frontend SHALL display the error message string in the Snackbar component.

---

### Requirement 8: REST Mutations — Personal Roadmaps

**User Story:** As a student, I want to generate a personalized roadmap from a career template and delete roadmaps I no longer need, so that I can maintain a relevant set of learning paths.

#### Acceptance Criteria

1. THE GenerateRoadmapModal SHALL use a `useMutation` hook that calls `POST /api/personal-roadmaps/generate` with `{ profileId, careerRoadmapId }`.
2. WHEN the generate mutation succeeds, THE Roadmaps page SHALL navigate to `/roadmap/{newPersonalRoadmapId}` and invalidate the Apollo cache for `GetPersonalRoadmapsByProfile`.
3. THE Roadmaps page SHALL use a `useMutation` hook that calls `DELETE /api/personal-roadmaps/{id}` after the user confirms via ConfirmDialog.
4. WHEN the delete mutation succeeds, THE Roadmaps page SHALL invalidate the Apollo cache for `GetPersonalRoadmapsByProfile` to remove the deleted card.
5. IF the generate mutation returns an error, THE Frontend SHALL display the error message in the Snackbar component and keep the GenerateRoadmapModal open.

---

### Requirement 9: REST Mutations — Node Progress

**User Story:** As a student, I want to update the status of individual roadmap nodes directly on the canvas, so that I can track my learning progress.

#### Acceptance Criteria

1. THE RoadmapCanvas page SHALL use a `useMutation` hook that calls `PUT /api/node-progress/{nodeProgressId}/status` with `{ status, note }`.
2. WHEN the user selects a new node status, THE RoadmapCanvas page SHALL immediately apply the NODE_STATUS_COLORS visual update to the canvas node (optimistic), then dispatch the mutation.
3. IF the mutation returns a 4xx or 5xx response, THE Frontend SHALL revert the node's visual status to its previous value and display the error message in the Snackbar component.
4. WHEN the mutation succeeds, THE Frontend SHALL invalidate the Apollo cache for `GetNodeProgress` for the current Personal Roadmap.
5. THE `status` field sent by the mutation SHALL be one of the integer values: `0` (NotStarted), `1` (InProgress), `2` (Paused), `3` (Skipped), `4` (Completed).

---

### Requirement 10: REST Mutations — Chat Sessions and Messages

**User Story:** As a student, I want to start AI mentor chat sessions and send messages, so that I receive personalized career guidance.

#### Acceptance Criteria

1. THE Mentor page SHALL use a `useMutation` hook that calls `POST /api/chat/sessions` with `{ profileId, title }` to create a new chat session.
2. IF the session creation mutation returns an error, THE Frontend SHALL display the error message in the Snackbar component and NOT navigate away from the current session.
3. THE Mentor page SHALL use a `useMutation` hook that calls `POST /api/chat/sessions/{sessionId}/messages` with `{ content, role: "User" }` to send a message.
4. WHEN a message mutation succeeds, THE Mentor page SHALL append both the user message and the AI response (from the mutation result) to the conversation view without a full page reload.
5. WHEN a message mutation is in-flight, THE Mentor page SHALL display the LinearProgress component in indeterminate mode and disable the send button until the mutation resolves.
6. IF the message mutation returns an error, THE Frontend SHALL display the error message in the Snackbar component and re-enable the send button.

---

### Requirement 11: REST Mutations — Admin Operations

**User Story:** As an admin, I want to create, update, and delete career roles, roadmap templates, nodes, and job trends from the admin pages, so that the platform's content library stays accurate.

#### Acceptance Criteria

1. THE AdminCareerRoles page SHALL use `useMutation` hooks for `POST /api/career-roles`, `PUT /api/career-roles/{id}`, and `DELETE /api/career-roles/{id}`.
2. THE AdminRoadmapTemplates page SHALL use `useMutation` hooks for `POST /api/career-roadmaps`, `PUT /api/career-roadmaps/{id}`, `DELETE /api/career-roadmaps/{id}`, `POST /api/career-roadmaps/{id}/nodes/{nodeId}`, and `DELETE /api/career-roadmaps/{id}/nodes/{nodeId}`.
3. THE AdminNodeLibrary page SHALL use `useMutation` hooks for `POST /api/nodes`, `PUT /api/nodes/{id}`, and `DELETE /api/nodes/{id}`.
4. THE AdminJobTrends page SHALL use `useMutation` hooks for `POST /api/job-trends`, `PUT /api/job-trends/{id}`, and `DELETE /api/job-trends/{id}`.
5. WHEN any admin create or update mutation succeeds, THE corresponding page SHALL invalidate the Apollo cache query that populates its data table (`GetCareerRoles`, `GetCareerRoadmapsByRole`, `GetNodeChildren`, or `GetJobTrendsByRegion` respectively).
6. THE delete mutation for each admin entity SHALL be dispatched only after the user confirms the action via the existing ConfirmDialog component.
7. IF any admin mutation returns an error, THE Frontend SHALL display the error message in the Snackbar component.

---

### Requirement 12: REST Mutations — Portfolio Domain

**User Story:** As a student, I want to add and remove GitHub repositories from my portfolio page, so that my public portfolio reflects my current work.

#### Acceptance Criteria

1. THE Portfolio page SHALL use a `useMutation` hook that calls `POST /api/github-repositories` with `{ profileId, repositoryUrl, description }`.
2. THE Portfolio page SHALL use a `useMutation` hook that calls `DELETE /api/github-repositories/{id}` after confirmation via ConfirmDialog.
3. WHEN a repository mutation succeeds, THE Portfolio page SHALL invalidate the Apollo cache for `GetGitHubRepositoriesByProfile` to refresh the repository list.
4. IF a repository mutation returns an error, THE Frontend SHALL display the error message in the Snackbar component.

---

### Requirement 13: GraphQL Queries — User and Profile

**User Story:** As a student, I want my profile data loaded automatically when I visit my pages, so that I see my current information without manually refreshing.

#### Acceptance Criteria

1. WHEN the Dashboard page mounts, THE page SHALL execute Apollo `useQuery` with `GetUserById(id: $userId)` using the `userId` from AuthStore.
2. WHEN the Settings page mounts, THE page SHALL execute Apollo `useQuery` with `GetProfileWithSkills(userId: $userId)` using the `userId` from AuthStore.
3. WHEN an Apollo query is in the loading state, THE corresponding page SHALL display the existing Skeleton component in place of each data-dependent UI element.
4. IF an Apollo query returns an error, THE page SHALL display the EmptyState component with a descriptive message and a retry action that re-executes the failed query.

---

### Requirement 14: GraphQL Queries — Career Roles and Roadmap Templates

**User Story:** As a student, I want to browse career roles and their associated roadmap templates, so that I can choose a learning path that matches my goals.

#### Acceptance Criteria

1. WHEN the Roadmaps page mounts, THE page SHALL execute Apollo `useQuery` with `GetCareerRoles` to populate the career role dropdown in GenerateRoadmapModal.
2. WHEN a career role is selected in GenerateRoadmapModal, THE Frontend SHALL execute Apollo `useLazyQuery` with `GetCareerRoadmapsByRole(careerRoleId: $careerRoleId)` to load matching templates.
3. WHEN the AdminCareerRoles page mounts, THE page SHALL execute Apollo `useQuery` with `GetCareerRoles` to populate the management table.
4. WHEN the AdminRoadmapTemplates page mounts, THE page SHALL execute Apollo `useQuery` with `GetCareerRoadmapsByRole(careerRoleId: $careerRoleId)` for the selected role.
5. WHEN a specific roadmap template is selected on AdminRoadmapTemplates, THE page SHALL execute Apollo `useLazyQuery` with `GetCareerRoadmapWithNodes(roadmapId: $roadmapId)` to load its node assignments.
6. THE AdminNodeLibrary page SHALL use Apollo `useLazyQuery` with `GetNodeHierarchy(rootId: $rootId)` and `GetNodeChildren(parentId: $parentId)` for hierarchical node browsing.
7. WHEN any admin career-data query is loading, THE corresponding admin page SHALL display the Skeleton component in its table area. IF the query returns an error, THE page SHALL display the EmptyState component with a retry action.

---

### Requirement 15: GraphQL Queries — Personal Roadmaps and Node Progress

**User Story:** As a student, I want to see my personal roadmaps list and the detailed node canvas with progress, so that I can navigate and track my learning.

#### Acceptance Criteria

1. WHEN the Roadmaps page mounts, THE page SHALL execute Apollo `useQuery` with `GetPersonalRoadmapsByProfile(profileId: $profileId)` using the `profileId` from AuthStore.
2. WHEN the RoadmapCanvas page mounts, THE page SHALL execute Apollo `useQuery` with `GetPersonalRoadmapWithProgress(personalRoadmapId: $personalRoadmapId)` using the ID from the route parameter.
3. WHEN `GetPersonalRoadmapWithProgress` resolves, THE RoadmapCanvas page SHALL map the node data to `@xyflow/react` node objects using node positions from the query data and apply NODE_STATUS_COLORS based on each node's `status` integer.
4. WHEN the RoadmapCanvas page mounts, THE page SHALL execute Apollo `useQuery` with `GetNodeProgress(personalRoadmapId: $personalRoadmapId)` to populate the progress summary in the sidebar.
5. WHEN the Dashboard page mounts, THE page SHALL use the `GetPersonalRoadmapsByProfile` result to display the most recently accessed Personal Roadmap summary in the StatCard components.
6. WHEN `GetPersonalRoadmapWithProgress` is loading, THE RoadmapCanvas page SHALL display the Skeleton component in place of the canvas area.

---

### Requirement 16: GraphQL Queries — Learning Resources

**User Story:** As a student, I want to see learning resources for a node when I open it on the canvas, so that I know what to study next.

#### Acceptance Criteria

1. WHEN a node is clicked and the node drawer opens, THE drawer SHALL execute Apollo `useLazyQuery` with `GetLearningResourcesByNode(nodeId: $nodeId)`.
2. IF the `GetLearningResourcesByNode` query returns an error, THE drawer SHALL display an error message and a retry button in place of the resource list.
3. WHERE a node has resources with `isFree: true`, THE drawer SHALL highlight those resources using the MD3 `--md-success-container` color token to distinguish them from paid resources.
4. WHEN resources are loading, THE drawer SHALL display the Skeleton component. IF no resources exist for the node, THE drawer SHALL display the EmptyState component.
5. WHERE the AI recommendation feature is active, THE drawer SHALL execute Apollo `useLazyQuery` with `GetRecommendedResources(profileId: $profileId, nodeId: $nodeId)` and display the results below the standard resource list.

---

### Requirement 17: GraphQL Queries — Skill Gap and AI Analysis

**User Story:** As a student, I want to see my skill gap analysis against a chosen career roadmap, so that I understand which skills to prioritize.

#### Acceptance Criteria

1. WHEN the SkillGap page mounts with a default `careerRoadmapId`, THE page SHALL execute Apollo `useQuery` with `GetSkillGapAnalysis(profileId: $profileId, careerRoadmapId: $careerRoadmapId)`.
2. WHEN the user selects a different career roadmap from the dropdown, THE SkillGap page SHALL execute Apollo `useLazyQuery` with `GetSkillGapAnalysis` supplying the new `careerRoadmapId`.
3. WHEN the SkillGap page mounts, THE page SHALL execute Apollo `useQuery` with `GetTrendingSkillRecommendations(profileId: $profileId)` to populate the "Trending Skills" section.
4. WHEN the SkillGap query is loading, THE page SHALL display Skeleton components in place of the analysis charts.

---

### Requirement 18: GraphQL Queries — Market Pulse and Job Trends

**User Story:** As a student, I want to see current job market trends and top skill demands, so that I can align my learning with industry needs.

#### Acceptance Criteria

1. WHEN the MarketPulse page mounts, THE page SHALL execute Apollo `useQuery` with `GetJobTrendsByRegion(region: "Vietnam")` as the default.
2. WHEN the user selects a different region, THE MarketPulse page SHALL execute Apollo `useLazyQuery` with `GetJobTrendsByRegion(region: $region)` using the selected value.
3. WHEN the MarketPulse page mounts, THE page SHALL execute Apollo `useQuery` with `GetTopTrendingSkills(count: 10)` to populate the trending skills Recharts bar chart.
4. WHEN the AdminJobTrends page mounts, THE page SHALL execute Apollo `useQuery` with `GetJobTrendsByRegion` to populate the admin data table.

---

### Requirement 19: GraphQL Queries — Chat History

**User Story:** As a student, I want to resume previous AI mentor conversations, so that I can maintain continuity in my guidance sessions.

#### Acceptance Criteria

1. WHEN the Mentor page mounts, THE page SHALL execute Apollo `useQuery` with `GetChatSessionsByProfile(profileId: $profileId)` to populate the session list sidebar.
2. WHEN the user selects a chat session from the sidebar, THE Mentor page SHALL execute Apollo `useLazyQuery` with `GetChatSessionWithMessages(sessionId: $sessionId)` to load the full message history.
3. WHEN `GetChatSessionWithMessages` resolves, THE Mentor page SHALL render AI assistant messages using `react-markdown` with the `remark-gfm` plugin for full Markdown support including tables, code blocks, and lists.
4. WHEN a new message mutation succeeds, THE Mentor page SHALL write the new user message and AI response directly into the Apollo cache for `GetChatSessionWithMessages` so the conversation updates without a full re-fetch.

---

### Requirement 20: GraphQL Queries — Portfolio and GitHub Repositories

**User Story:** As a student, I want to view my portfolio with GitHub repositories and AI analysis, and as a visitor, I want to see a public portfolio without needing to log in.

#### Acceptance Criteria

1. WHEN the Portfolio page mounts, THE page SHALL execute Apollo `useQuery` with `GetGitHubRepositoriesByProfile(profileId: $profileId)` using the `profileId` from AuthStore.
2. WHEN the Portfolio page mounts, THE page SHALL execute Apollo `useQuery` with `GetPortfolioAnalysis(profileId: $profileId)` to load the AI-generated summary.
3. WHEN the PublicPortfolio page mounts (at `/portfolio/:username`), THE page SHALL execute Apollo `useQuery` with `GetProfileByUserId` and `GetGitHubRepositoriesByProfile` without an `Authorization` header.
4. WHEN no `accessToken` exists in AuthStore, THE ApolloClient SHALL omit the `Authorization` header from requests, enabling unauthenticated public portfolio queries.

---

### Requirement 21: React Flow Canvas Wiring

**User Story:** As a student, I want to interact with my roadmap as a visual node graph where I can click nodes to update progress, so that learning tracking feels intuitive and visual.

#### Acceptance Criteria

1. THE RoadmapCanvas page SHALL render the Personal Roadmap using `@xyflow/react` `<ReactFlow>` with nodes and edges derived from the `GetPersonalRoadmapWithProgress` query result.
2. THE `NODE_STATUS_COLORS` constant SHALL be defined in `src/constants/nodeStatus.ts` and SHALL map `NotStarted` (0), `InProgress` (1), `Paused` (2), `Skipped` (3), and `Completed` (4) to their corresponding MD3 CSS custom-property fill, stroke, and text color tokens.
3. WHEN a node is clicked on the canvas, THE RoadmapCanvas page SHALL open the node details drawer displaying the node's title, description, status segmented selector, notes text field, and learning resources (per Requirement 16).
4. WHEN the user selects a new status in the node drawer, THE RoadmapCanvas page SHALL apply the NODE_STATUS_COLORS visual update optimistically (per Requirement 9) and dispatch the `PUT /api/node-progress/{nodeProgressId}/status` mutation.
5. THE React Flow canvas SHALL include pan, zoom, and minimap controls provided by `@xyflow/react` built-in components.
6. WHEN `GetPersonalRoadmapWithProgress` is loading, THE RoadmapCanvas page SHALL display the Skeleton component covering the canvas area.

---

### Requirement 22: Development Proxy Configuration

**User Story:** As a frontend developer, I want all `/api` and `/graphql` requests proxied to the backend during development, so that I can work without CORS issues locally and without hardcoding backend ports.

#### Acceptance Criteria

1. WHERE the Vite dev server is running, THE `vite.config.ts` `server.proxy` SHALL forward `/api` requests to `https://localhost:7210` with `secure: false` and `changeOrigin: true`.
2. WHERE the Vite dev server is running, THE `vite.config.ts` `server.proxy` SHALL forward `/graphql` requests to `https://localhost:7210/graphql` with `secure: false` and `changeOrigin: true`.
3. WHEN `VITE_API_URL` is set at build time, THE Frontend SHALL configure Axios `baseURL` to `VITE_API_URL` and ApolloClient `HttpLink` `uri` to `${VITE_API_URL}/graphql`.
4. WHEN `VITE_API_URL` is absent, THE Frontend SHALL use an empty string as Axios `baseURL` and `/graphql` as ApolloClient `HttpLink` `uri` so that Vite's dev server proxy handles all routing.

---

### Requirement 23: Deploy Readiness

**User Story:** As an operator, I want the system to be deployable to Azure App Service (backend) and a static hosting provider (frontend) without manual code changes, so that the deployment process is repeatable and secure.

#### Acceptance Criteria

1. THE Frontend production build (`npm run build`) SHALL complete with exit code 0 after all dependencies are installed and environment variables are provided.
2. THE API production build SHALL succeed with no C# compilation errors after all CORS and configuration changes are applied.
3. THE API CORS policy SHALL parse `Cors:AllowedOrigins` as a comma-separated list of origins in production, allowing multiple origins to be configured without code changes.
4. IF `Cors:AllowedOrigins` is not set in production, THE API SHALL respond to cross-origin requests without any `Access-Control-Allow-Origin` header, preventing unintended open access.
5. THE `appsettings.json` committed to version control SHALL NOT contain the values for `ConnectionStrings:DefaultConnection`, `Jwt:Secret`, `Google:ClientSecret`; these SHALL be supplied via environment variables or Azure Key Vault references.
6. THE Frontend `vite.config.ts` SHALL set `build.outDir` to `dist` for predictable CI/CD artifact collection.
7. WHEN the API starts and any of `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, or `ConnectionStrings:DefaultConnection` is missing from `IConfiguration`, THE API SHALL throw an `InvalidOperationException` at startup identifying the missing key and SHALL NOT start serving requests.
