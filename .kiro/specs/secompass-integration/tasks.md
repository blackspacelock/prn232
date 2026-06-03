# Implementation Plan: SECompass Integration

## Overview

This plan wires the SECompass React 19 frontend to the ASP.NET Core .NET 10 backend.
Tasks are ordered by dependency: backend infrastructure first, then frontend infrastructure
and state management, then route protection, then individual page wiring, and final validation.

## Tasks

- [ ] 1. Backend: Add CORS policy and move secrets
  - [ ] 1.1 Add `AllowFrontend` CORS policy to `ServiceCollectionExtensions.cs`
    - Inject `IWebHostEnvironment env` into `AddApplicationServices`
    - Call `services.AddCors(...)` before `services.AddAuthentication`
    - Dev branch: allow `https://localhost:5173`
    - Prod branch: read `Cors:AllowedOrigins` from `IConfiguration`, split on `,`
    - Allow methods GET POST PUT DELETE OPTIONS; headers Authorization, Content-Type, X-Requested-With; `AllowCredentials()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9_

  - [ ] 1.2 Insert `app.UseCors("AllowFrontend")` in `Program.cs`
    - Place after `app.UseRouting()` and before `app.UseAuthentication()`
    - _Requirements: 1.1_

  - [ ] 1.3 Add startup configuration validation to `Program.cs`
    - Add static `ValidateRequiredConfig(IConfiguration)` helper after `AddApplicationServices` call
    - Throw `InvalidOperationException` listing all missing keys if any of `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `ConnectionStrings:DefaultConnection` is null or whitespace
    - _Requirements: 2.4, 23.7_

  - [ ] 1.4 Clean secrets from `appsettings.json`; update `.gitignore`
    - Remove `ConnectionStrings:DefaultConnection` value, `Jwt:Secret`, `Google:ClientSecret` values from `appsettings.json` (leave keys with empty strings or remove entirely)
    - Move real dev values to `appsettings.Development.json` (already gitignored via `*.Development.json` or add explicit entry)
    - Add `appsettings.Production.json` to root `.gitignore`
    - _Requirements: 2.4, 2.6, 23.5_

  - [ ] 1.5 Configure access token lifetime
    - Ensure every access token issued by `/api/auth/login`, `/api/auth/register`, `/api/auth/google`, and `/api/auth/refresh` expires 1 week after creation
    - _Requirements: 4.2_

- [ ] 2. Frontend: Install npm dependencies and configure environment
  - [ ] 2.1 Install production npm dependencies
    - Run `npm install axios@^1.9.0 @tanstack/react-query@^5.0.0 @apollo/client graphql zustand @react-oauth/google @xyflow/react react-markdown remark-gfm`
    - Verify `package.json` lists all packages as production dependencies
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 2.2 Create `.env` and `.env.local`; update frontend `.gitignore`
    - Create `frontend/.env` with placeholder keys only: `VITE_API_URL=` and `VITE_GOOGLE_CLIENT_ID=`
    - Create `frontend/.env.local` with real dev values (leave `VITE_API_URL` empty so Vite proxy handles routing)
    - Add `.env.local`, `.env.production.local`, `.env.*.local` to `frontend/.gitignore` if not already present
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [ ] 2.3 Update `vite.config.ts` with dev proxy and `envWarningPlugin`
    - Add `server.proxy` forwarding `/api` and `/graphql` to `https://localhost:7210` with `changeOrigin: true`, `secure: false`
    - Add `envWarningPlugin(['VITE_API_URL', 'VITE_GOOGLE_CLIENT_ID'])` that emits `console.warn` for each missing var at `buildStart`
    - Set `build.outDir` to `dist`
    - _Requirements: 2.7, 2.8, 22.1, 22.2, 23.6_


- [ ] 3. Frontend: Core infrastructure — AuthStore, Axios, Apollo, QueryClient
  - [ ] 3.1 Create `src/store/authStore.ts` (Zustand AuthStore)
    - Define `AuthUser` interface (id, email, role, profileId)
    - Define `AuthState` + `AuthActions`, export `useAuthStore` with `setAuth`, `clearAuth`, `initFromStorage`
    - `setAuth` stores refresh token in `sessionStorage` (dev only, key `secompass_rt`); never writes to `localStorage`
    - `clearAuth` removes `secompass_rt` from `sessionStorage` and resets state
    - `initFromStorage` sets `_initialized: true`
    - Export `getRefreshToken()` helper
    - _Requirements: 4.1, 4.3, 4.13_

  - [ ] 3.2 Create `src/lib/axios.ts` (Axios instance with interceptors)
    - Create `apiClient` with `baseURL: import.meta.env.VITE_API_URL ?? ''`
    - Add request interceptor: inject `Authorization: Bearer {accessToken}` if token is non-null
    - Add response interceptor: on 401 (not already retried) call `POST /api/auth/refresh`, update AuthStore, retry once; on refresh failure call `clearAuth()` and navigate to `/login`
    - Use shared `refreshPromise` to prevent concurrent refresh calls
    - _Requirements: 4.4, 4.5, 4.6, 22.3, 22.4_

  - [ ] 3.3 Create `src/lib/apollo.ts` (Apollo Client)
    - Create `httpLink` targeting `${VITE_API_URL}/graphql` (fallback `/graphql`)
    - Create `authLink` using `setContext` to inject Bearer token from AuthStore
    - Create `errorLink` using `onError`: on `UNAUTHENTICATED` GraphQL error, refresh token via `apiClient`, update AuthStore, forward operation once; on refresh failure call `clearAuth()` and navigate to `/login`
    - Compose `from([errorLink, authLink, httpLink])`
    - _Requirements: 4.7, 4.8, 20.4, 22.3, 22.4_

  - [ ] 3.4 Create `src/lib/queryClient.ts` (TanStack QueryClient)
    - Export `queryClient` instance with `defaultOptions`: queries `retry: 1, staleTime: 30_000`; mutations `retry: 0`
    - _Requirements: 3.2_

  - [ ] 3.5 Create `src/types/api.ts` (shared TypeScript DTO interfaces)
    - Define `AuthResponseDto`, `LoginUserDto`, `RegisterUserDto`, `GoogleLoginDto`, `RefreshTokenRequestDto`
    - Define `UpdateNodeProgressStatusDto`, `NodeProgressDto`, `NodeDto`, `PersonalRoadmapDetailDto`
    - Define `UpdateProfileDto`, `CreateSkillDto`, `CreateGitHubRepositoryDto`, `CreateChatSessionDto`, `SendMessageDto`
    - Define `RoadmapNodeData` (for React Flow node data shape)
    - _Requirements: 4.1, 9.5, 15.3_


- [ ] 4. Frontend: Constants, GraphQL queries, and provider wiring
  - [ ] 4.1 Create `src/constants/nodeStatus.ts` (`NODE_STATUS_COLORS`)
    - Export `NodeStatusInt` type (0 | 1 | 2 | 3 | 4) and `NodeStatusStyle` interface
    - Export `NODE_STATUS_COLORS` record mapping 0–4 to MD3 CSS custom-property tokens for fill, stroke, text, and label
    - _Requirements: 21.2_

  - [ ] 4.2 Create `src/graphql/queries.ts` (all 21 named GQL document nodes)
    - Import `gql` from `@apollo/client`
    - Export all 21 named `DocumentNode` constants: `GET_USER_BY_ID`, `GET_PROFILE_WITH_SKILLS`, `GET_CAREER_ROLES`, `GET_CAREER_ROADMAPS_BY_ROLE`, `GET_CAREER_ROADMAP_WITH_NODES`, `GET_NODE_HIERARCHY`, `GET_NODE_CHILDREN`, `GET_PERSONAL_ROADMAPS_BY_PROFILE`, `GET_PERSONAL_ROADMAP_WITH_PROGRESS`, `GET_NODE_PROGRESS`, `GET_LEARNING_RESOURCES_BY_NODE`, `GET_RECOMMENDED_RESOURCES`, `GET_GITHUB_REPOS_BY_PROFILE`, `GET_PORTFOLIO_ANALYSIS`, `GET_CHAT_SESSIONS_BY_PROFILE`, `GET_CHAT_SESSION_WITH_MESSAGES`, `GET_JOB_TRENDS_BY_REGION`, `GET_TOP_TRENDING_SKILLS`, `GET_SKILL_GAP_ANALYSIS`, `GET_TRENDING_SKILL_RECOMMENDATIONS`, `GET_PROFILE_BY_USER_ID`
    - Each query must select all fields needed for its consuming page per the per-page wiring plan
    - _Requirements: 13.1, 14.1, 15.1, 16.1, 17.1, 18.1, 19.1, 20.1, 20.3_

  - [ ] 4.3 Update `src/main.tsx` — wrap with `GoogleOAuthProvider`, `ApolloProvider`, `QueryClientProvider`
    - Import and wrap App with all three providers in the order shown in the design
    - Pass `import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''` to `GoogleOAuthProvider`
    - _Requirements: 4.9_


- [ ] 5. Frontend: Route protection guards and router update
  - [ ] 5.1 Create `src/app/components/ProtectedRoute.tsx`
    - Read `isAuthenticated` and `_initialized` from `useAuthStore`
    - Render `<Skeleton />` while `!_initialized`
    - Redirect to `/login` with `state={{ from: location.pathname }}` when unauthenticated after initialization
    - Render `<Outlet />` when authenticated
    - _Requirements: 5.1, 5.4, 5.8_

  - [ ] 5.2 Create `src/app/components/AdminRoute.tsx`
    - Read `isAuthenticated`, `user`, `_initialized` from `useAuthStore`
    - Render `<Skeleton />` while `!_initialized`
    - Redirect to `/login` with `state.from` when unauthenticated
    - Redirect to `/dashboard` when authenticated but `user.role !== 'Admin'`
    - Render `<Outlet />` for Admin users
    - _Requirements: 5.2, 5.3, 5.5_

  - [ ] 5.3 Update `src/app/routes.tsx` to wrap protected and admin routes
    - Nest `/dashboard`, `/roadmaps`, `/roadmap/:id`, `/mentor`, `/skill-gap`, `/market`, `/portfolio`, `/settings` under `<ProtectedRoute />`
    - Nest `/admin/career-roles`, `/admin/roadmaps`, `/admin/nodes`, `/admin/job-trends` under `<AdminRoute />`
    - Keep `/`, `/login`, `/register`, `/portfolio/:username`, and reference routes at root level (public)
    - Call `useAuthStore.getState().initFromStorage()` once at app startup (in `App.tsx` or `main.tsx`) to set `_initialized: true`
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 6. Checkpoint — Ensure backend builds and frontend providers compile
  - Ensure backend build and frontend TypeScript compilation complete, ask the user if questions arise.


- [ ] 7. Frontend: Wire auth pages (Login and Register)
  - [ ] 7.1 Wire `LoginPage` — email/password mutation and Google OAuth
    - Add `useMutation` calling `POST /api/auth/login` with `LoginUserDto`; on success call `useAuthStore.setAuth(...)` and navigate to `state.from ?? '/dashboard'`
    - Add `useGoogleLogin` from `@react-oauth/google`; on success send ID token to `POST /api/auth/google`; store `AuthResponseDto` in AuthStore
    - On mutation error display message in existing Snackbar component
    - _Requirements: 4.10, 6.1, 6.3_

  - [ ] 7.2 Wire `RegisterPage` — register mutation
    - Add `useMutation` calling `POST /api/auth/register` with `RegisterUserDto`; on success call AuthStore `setAuth` and navigate to `/dashboard`
    - On mutation error display message in Snackbar
    - _Requirements: 6.2, 6.3_

- [ ] 8. Frontend: Wire Dashboard page
  - [ ] 8.1 Wire `DashboardPage` — user and personal roadmaps queries
    - Add `useQuery(GET_USER_BY_ID, { variables: { userId } })` using `userId` from AuthStore
    - Add `useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, { variables: { profileId } })` using `profileId` from AuthStore
    - Replace hardcoded `StatCard` data with values derived from query results (e.g., active roadmap count)
    - Show `<Skeleton />` while loading; show `<EmptyState />` with retry on error
    - _Requirements: 13.1, 13.3, 13.4, 15.5_


- [ ] 9. Frontend: Wire Roadmaps page
  - [ ] 9.1 Wire `RoadmapsPage` — roadmap list, career role queries, generate + delete mutations
    - Add `useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE)` to populate the roadmap card grid
    - Add `useQuery(GET_CAREER_ROLES)` to populate the career role dropdown in `GenerateRoadmapModal`
    - Add `useLazyQuery(GET_CAREER_ROADMAPS_BY_ROLE)` triggered on career role selection
    - Add `useMutation` for `POST /api/personal-roadmaps/generate`; on success navigate to `/roadmap/{id}` and invalidate `GET_PERSONAL_ROADMAPS_BY_PROFILE` cache
    - Add `useMutation` for `DELETE /api/personal-roadmaps/{id}` gated behind `ConfirmDialog`; on success invalidate `GET_PERSONAL_ROADMAPS_BY_PROFILE` cache
    - On error show Snackbar
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 14.1, 14.2, 15.1_

- [ ] 10. Frontend: Wire RoadmapCanvas page (React Flow + optimistic node update)
  - [ ] 10.1 Replace SVG canvas with `@xyflow/react` and wire `GetPersonalRoadmapWithProgress`
    - Add `useQuery(GET_PERSONAL_ROADMAP_WITH_PROGRESS, { variables: { personalRoadmapId: id } })`
    - Map query result to `Node[]` and `Edge[]` using `mapToFlowNodes` / `mapToFlowEdges` helpers
    - Define custom `roadmapNode` node type that reads `data.status` and applies `NODE_STATUS_COLORS` fill/stroke/text
    - Add `<ReactFlow>` with `<Background>`, `<Controls>`, `<MiniMap>` from `@xyflow/react`
    - Show `<Skeleton />` while loading
    - _Requirements: 15.2, 15.3, 15.6, 21.1, 21.5_

  - [ ] 10.2 Wire node progress sidebar and optimistic status mutation
    - Add `useQuery(GET_NODE_PROGRESS)` to populate progress summary sidebar
    - On node click open node details drawer; add `useLazyQuery(GET_LEARNING_RESOURCES_BY_NODE)` triggered when drawer opens
    - Add `useLazyQuery(GET_RECOMMENDED_RESOURCES)` for AI recommendations in drawer
    - Add `useMutation` for `PUT /api/node-progress/{nodeProgressId}/status`
    - Apply optimistic update to local React state immediately on status selection; on mutation error revert to previous status and show Snackbar; on success invalidate `GET_NODE_PROGRESS`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5, 21.3, 21.4_


- [ ] 11. Frontend: Wire Mentor page
  - [ ] 11.1 Wire `MentorPage` — chat sessions and message streaming
    - Add `useQuery(GET_CHAT_SESSIONS_BY_PROFILE)` to populate the session list sidebar
    - Add `useLazyQuery(GET_CHAT_SESSION_WITH_MESSAGES)` triggered on session selection
    - Render AI messages using `<ReactMarkdown>` with `remarkGfm` plugin
    - Add `useMutation` for `POST /api/chat/sessions`; on error show Snackbar without navigating
    - Add `useMutation` for `POST /api/chat/sessions/{id}/messages`; show `LinearProgress` (indeterminate) and disable send button while in-flight; on success write user + AI response directly into Apollo cache for `GET_CHAT_SESSION_WITH_MESSAGES`; on error re-enable send and show Snackbar
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 19.1, 19.2, 19.3, 19.4_

- [ ] 12. Frontend: Wire SkillGap and MarketPulse pages
  - [ ] 12.1 Wire `SkillGapPage` — skill gap analysis queries
    - Add `useQuery(GET_SKILL_GAP_ANALYSIS)` with default `careerRoadmapId`
    - Add `useLazyQuery(GET_SKILL_GAP_ANALYSIS)` executed on career roadmap dropdown change
    - Add `useQuery(GET_TRENDING_SKILL_RECOMMENDATIONS)` for the trending skills section
    - Show `<Skeleton />` while queries are loading
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [ ] 12.2 Wire `MarketPulsePage` — job trends and trending skills queries
    - Add `useQuery(GET_JOB_TRENDS_BY_REGION, { variables: { region: 'Vietnam' } })` as default
    - Add `useLazyQuery(GET_JOB_TRENDS_BY_REGION)` executed on region selection change
    - Add `useQuery(GET_TOP_TRENDING_SKILLS, { variables: { count: 10 } })` for Recharts bar chart
    - _Requirements: 18.1, 18.2, 18.3_


- [ ] 13. Frontend: Wire Portfolio and PublicPortfolio pages
  - [ ] 13.1 Wire `PortfolioPage` — repo list, portfolio analysis, add/delete mutations
    - Add `useQuery(GET_GITHUB_REPOS_BY_PROFILE)` and `useQuery(GET_PORTFOLIO_ANALYSIS)` using `profileId` from AuthStore
    - Add `useMutation` for `POST /api/github-repositories`; on success invalidate `GET_GITHUB_REPOS_BY_PROFILE`
    - Add `useMutation` for `DELETE /api/github-repositories/{id}` gated behind `ConfirmDialog`; on success invalidate `GET_GITHUB_REPOS_BY_PROFILE`
    - On error show Snackbar
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 20.1, 20.2_

  - [ ] 13.2 Wire `PublicPortfolioPage` — unauthenticated profile + repos queries
    - Add `useQuery(GET_PROFILE_BY_USER_ID)` and `useQuery(GET_GITHUB_REPOS_BY_PROFILE)` derived from route `:username` param
    - Ensure no `Authorization` header is sent (Apollo omits header when `accessToken` is null — public page accessed without login)
    - _Requirements: 20.3, 20.4_

- [ ] 14. Frontend: Wire Settings page
  - [ ] 14.1 Wire `SettingsPage` — profile query and update/skill mutations
    - Add `useQuery(GET_PROFILE_WITH_SKILLS)` using `userId` from AuthStore
    - Add `useMutation` for `PUT /api/profiles/{userId}`; on success invalidate `GET_PROFILE_WITH_SKILLS`
    - Add `useMutation` for `POST /api/skills`; on success invalidate `GET_PROFILE_WITH_SKILLS`
    - Add `useMutation` for `DELETE /api/skills/{skillId}` gated behind `ConfirmDialog`; on success invalidate `GET_PROFILE_WITH_SKILLS`
    - On error show Snackbar
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 13.2_


- [ ] 15. Frontend: Wire Admin pages
  - [ ] 15.1 Wire `AdminCareerRolesPage`
    - Add `useQuery(GET_CAREER_ROLES)` to populate the management table
    - Add `useMutation` hooks for `POST /api/career-roles`, `PUT /api/career-roles/{id}`, `DELETE /api/career-roles/{id}` (delete gated behind `ConfirmDialog`)
    - On success invalidate `GET_CAREER_ROLES`; on error show Snackbar
    - _Requirements: 11.1, 11.5, 11.6, 11.7, 14.3_

  - [ ] 15.2 Wire `AdminRoadmapTemplatesPage`
    - Add `useQuery(GET_CAREER_ROADMAPS_BY_ROLE)` for initial load and `useLazyQuery(GET_CAREER_ROADMAP_WITH_NODES)` on template selection
    - Add `useMutation` hooks for `POST`, `PUT`, `DELETE /api/career-roadmaps/{id}`, `POST /api/career-roadmaps/{id}/nodes/{nodeId}`, `DELETE /api/career-roadmaps/{id}/nodes/{nodeId}`
    - On success invalidate `GET_CAREER_ROADMAPS_BY_ROLE`; on error show Snackbar; show Skeleton while loading
    - _Requirements: 11.2, 11.5, 11.6, 11.7, 14.4, 14.5, 14.7_

  - [ ] 15.3 Wire `AdminNodeLibraryPage`
    - Add `useLazyQuery(GET_NODE_HIERARCHY)` and `useLazyQuery(GET_NODE_CHILDREN)` for hierarchical browsing
    - Add `useMutation` hooks for `POST /api/nodes`, `PUT /api/nodes/{id}`, `DELETE /api/nodes/{id}`
    - On success invalidate `GET_NODE_CHILDREN`; on error show Snackbar; show Skeleton while loading
    - _Requirements: 11.3, 11.5, 11.6, 11.7, 14.6, 14.7_

  - [ ] 15.4 Wire `AdminJobTrendsPage`
    - Add `useQuery(GET_JOB_TRENDS_BY_REGION)` to populate the admin data table
    - Add `useMutation` hooks for `POST /api/job-trends`, `PUT /api/job-trends/{id}`, `DELETE /api/job-trends/{id}`
    - On success invalidate `GET_JOB_TRENDS_BY_REGION`; on error show Snackbar
    - _Requirements: 11.4, 11.5, 11.6, 11.7, 18.4_

- [ ] 16. Checkpoint — All pages wired; ensure TypeScript compiles with `tsc -b`
  - Ensure backend build and frontend TypeScript compilation complete, ask the user if questions arise.


## Notes

- Each task references specific requirements from `requirements.md` for traceability
- Checkpoints at tasks 6 and 16 provide incremental validation gates
- Backend tasks (1.x) must be completed first — the frontend proxy depends on the CORS policy being in place
- Frontend infra tasks (2.x-4.x) are prerequisites for all page wiring (7.x-15.x)
- Route guards (5.x) depend on AuthStore (3.1) being created first
- `appsettings.Production.json` should never be committed; supply secrets via Azure App Service environment variables or Azure Key Vault using the double-underscore delimiter (e.g., `Jwt__Secret`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "3.1", "3.4", "3.5"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3"] },
    { "id": 6, "tasks": ["7.1", "7.2", "8.1", "12.1", "12.2", "13.2"] },
    { "id": 7, "tasks": ["9.1", "10.1", "11.1", "13.1", "14.1"] },
    { "id": 8, "tasks": ["10.2", "15.1", "15.2", "15.3", "15.4"] }
  ]
}
```
