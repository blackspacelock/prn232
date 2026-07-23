# SECompass — Requirements Specification

> AI-Powered Career Orientation & Learning Roadmap Platform for Software Engineering Students

---

## 1. Project Overview

**Product Name:** SECompass
**Type:** Full-stack SaaS Web Application
**Domain:** EdTech / Career Development
**Target Users:** Software Engineering students (primary), Academic Counselors, Industry Mentors
**UI Framework:** React 19 + TypeScript + Vite + React Router v7
**Design System:** Google Material Design 3 (MD3)

**Core Problem:** SE students graduate as undirected generalists, lack job-ready specialization, and struggle to build a coherent portfolio narrative for employers.

**Core Solution:** An AI-guided platform that maps a student's current skills against real market demand, generates a personalized dynamic learning roadmap, and helps build a story-driven portfolio.

---

## 2. Actors & Roles

| Role Value | Name | Description |
|---|---|---|
| `0` | Admin | Full system access — manages Career Roles, Roadmap templates, Nodes, Job Trends, all users |
| `1` | Manager | Manages roadmap content, nodes, learning resources; views user progress |
| `2` | RoadmapUser | Standard student — owns Profile, Roadmaps, Progress, Chat, GitHub repos |

---

## 3. Functional Requirements

### 3.1 Authentication & Token Management

The platform implements a **dual-token authentication system**: a short-lived Access Token for API authorization and a long-lived Refresh Token for seamless session renewal without requiring the user to re-enter credentials.

---

#### FR-AUTH-01 — Email / Password Registration

- Input: `FullName`, `Email`, `Password`, `Role` (optional, default `RoadmapUser = 2`)
- Hash password with BCrypt before storage
- Create `User` record (`GoogleId = null`, `AvatarUrl = null`)
- Auto-create an empty linked `Profile` for the new user
- Issue both an Access Token and a Refresh Token
- Store Refresh Token in the `UserRefreshToken` table (see §6)
- Return `AuthResponseDto` containing both tokens

#### FR-AUTH-02 — Email / Password Login

- Validate email exists; verify BCrypt hash
- Issue a new Access Token + Refresh Token pair
- Store the new Refresh Token in `UserRefreshToken`
- Return `AuthResponseDto`

#### FR-AUTH-03 — Google OAuth Login (ID Token Flow)

- Frontend obtains a Google ID Token via `@react-oauth/google`
- Send to `POST /api/auth/google` as `GoogleLoginDto { IdToken }`
- Backend calls `GoogleJsonWebSignature.ValidateAsync(idToken, new ValidationSettings { Audience = [GoogleClientId] })`
- Extract `Subject` (GoogleId), `Email`, `Name`, `Picture` from the validated payload
- **Find-or-create logic:**
  - If a `User` with matching `GoogleId` exists → login
  - Else if a `User` with matching `Email` exists → link `GoogleId` + update `AvatarUrl`, then login
  - Else → create new `User` (`PasswordHashed = null`, `GoogleId = payload.Subject`, `AvatarUrl = payload.Picture`, `Role = RoadmapUser`) + auto-create `Profile`
- Issue Access Token + Refresh Token pair; store Refresh Token
- Return `AuthResponseDto`

#### FR-AUTH-04 — Token Refresh

- Endpoint: `POST /api/auth/refresh`
- Input: `RefreshTokenRequestDto { RefreshToken: string }`
- Lookup the `UserRefreshToken` record by token value
- Validate: record exists, `IsRevoked = false`, `ExpiresAt > DateTime.Now`
- If valid:
  - Revoke the old Refresh Token (`IsRevoked = true`, `RevokedAt = DateTime.Now`)
  - Issue a **new** Access Token + **new** Refresh Token (token rotation)
  - Store the new Refresh Token
  - Return `AuthResponseDto` with the new token pair
- If invalid or expired: return `401 Unauthorized`

#### FR-AUTH-05 — Logout

- Endpoint: `POST /api/auth/logout`
- Input: `RefreshTokenRequestDto { RefreshToken: string }`
- Requires valid Access Token (authenticated request)
- Revoke the matching `UserRefreshToken` (`IsRevoked = true`, `RevokedAt = DateTime.Now`)
- Return `200 OK`
- Frontend clears both tokens from storage

#### FR-AUTH-06 — Access Token Specification

- Type: JWT signed with HMACSHA256
- Claims: `UserId` (NameIdentifier), `Email`, `Role` (int as string), `FullName`
- Expiry: **15 minutes** (configurable via `appsettings.json`)
- Settings path: `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:AccessTokenExpiryMinutes`

#### FR-AUTH-07 — Refresh Token Specification

- Value: cryptographically random 64-byte string, Base64Url encoded (`RandomNumberGenerator`)
- Expiry: **7 days** (configurable via `Jwt:RefreshTokenExpiryDays`)
- Storage: `UserRefreshToken` table
- Strategy: **Rotation on every use** — each refresh call invalidates the old token and issues a new one
- A revoked or expired token must never be reusable

#### FR-AUTH-08 — User Deactivation

- Soft-deactivate: `IsActive = false`
- All active Refresh Tokens for the user are also revoked at deactivation time

#### FR-AUTH-09 — Route Protection

- All routes except `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `POST /api/auth/refresh`, and `GET /graphql` (public reads) require a valid Access Token in `Authorization: Bearer <token>`

---

### 3.2 Profile Management

**FR-PROF-01:** Each User has exactly one Profile (1:1, shared PK). Auto-created on registration.
Fields: `BioDescription`, `PhoneNumber`, `University`, `Major`, `StudiedYear`

**FR-PROF-02:** Authenticated users may view and update their own Profile.

**FR-PROF-03:** System returns a Profile together with all linked Skills.

---

### 3.3 Skill Management

**FR-SKILL-01:** Users add named Skills to their Profile (`SkillName`, optional `Note`).

**FR-SKILL-02:** Users soft-delete Skills from their Profile.

**FR-SKILL-03:** System returns all Skills for a given Profile.

---

### 3.4 Career Role & Roadmap Management (Admin / Manager)

**FR-ROLE-01:** Admins/Managers create, update, soft-delete Career Roles.

**FR-ROLE-02:** System returns all Career Roles (used in roadmap generation role selection).

**FR-RMAP-01:** Admins/Managers create Career Roadmaps linked to a Career Role.

**FR-RMAP-02:** Admins/Managers assign and remove Nodes from a Career Roadmap via `RoadmapNode` junction.

**FR-RMAP-03:** System returns a Career Roadmap with all linked Nodes.

**FR-RMAP-04:** Admins/Managers update and soft-delete Career Roadmaps.

---

### 3.5 Node & Learning Resource Management (Admin / Manager)

**FR-NODE-01:** Admins/Managers create Nodes (`Name`, `Description`, `Order`, optional `ParentNodeId`).

**FR-NODE-02:** Node hierarchy via self-referencing nullable `ParentNodeId`.

**FR-NODE-03:** System returns child nodes for a parent and full recursive hierarchy from a root.

**FR-NODE-04:** Admins/Managers update and soft-delete Nodes.

**FR-RES-01:** Admins/Managers create Learning Resources directly on a Node (no junction table).
Fields: `Name`, `ResourceUrl`, `ResourceType` (plain string), `Provider`, `IsFree`

**FR-RES-02 – 04:** System returns resources by Node, filtered by `IsFree`, and filtered by `ResourceType` string.

**FR-RES-05:** Admins/Managers update and soft-delete Learning Resources.

---

### 3.6 Personal Roadmap (Student Core Feature)

**FR-PRMAP-01 — Generate:**
1. Validate `profileId` and `careerRoadmapId` exist
2. Load all `RoadmapNodes` for the selected `CareerRoadmap`
3. Create `PersonalRoadmap` (`ProgressPercentage = 0`)
4. For each Node, create `NodeProgress` (`Status = NotStarted = 0`)
5. BulkInsert all `NodeProgress` entries; `SaveChangesAsync`
6. Return `PersonalRoadmapDetailDto`

**FR-PRMAP-02:** Return all Personal Roadmaps for a Profile.

**FR-PRMAP-03:** Return a Personal Roadmap with full NodeProgress + Node details.

**FR-PRMAP-04:** Update `NodeProgressStatus` for any node (0–4), with optional Note. Triggers progress recalculation.

**FR-PRMAP-05 — Recalculation:** `ProgressPercentage = (Completed count / total count) × 100`, 2 decimal places.

**FR-PRMAP-06:** Soft-delete a Personal Roadmap.

**FR-PRMAP-07:** Return only Completed NodeProgress entries for a Personal Roadmap.

---

### 3.7 AI Virtual Mentor (Chat)

**FR-CHAT-01:** Create a Chat Session (`Title`, scoped to `ProfileId`).

**FR-CHAT-02:** Send messages within a session (`Sender`, `MessageContent`).

**FR-CHAT-03:** Return a Chat Session with all Messages ordered by `CreatedAt ASC`.

**FR-CHAT-04:** Return all Chat Sessions for a Profile.

**FR-CHAT-05:** Update a Chat Session's summary.

**FR-CHAT-06:** Frontend renders Markdown in assistant messages (code blocks, headers, lists, bold). Code blocks use `fill #202124`, `border-radius: 8px`, Roboto Mono 13px white text.

---

### 3.8 Skill Gap Analysis (AI Stub)

**FR-GAP-01:** Compare Profile skills vs CareerRoadmap nodes; return `SkillGapAnalysisDto`.

**FR-GAP-02:** Frontend displays results as a Recharts `RadarChart`:
- Polygon 1 (Your Skills): `fill rgba(26,115,232,0.2)`, `stroke #1A73E8` 2px
- Polygon 2 (Required): `fill rgba(251,188,4,0.15)`, `stroke #FBBC04` 2px dashed
- PolarGrid: `#E8EAED`

**FR-GAP-03:** Frontend allows client-side PDF export of the analysis.

---

### 3.9 Market Pulse / Job Trends

**FR-TREND-01:** Admins create, update, soft-delete Job Trend records (`TechSkill`, `Description`, `Source`, `Region`, `TrendScore`, `SnapshotDate`).

**FR-TREND-02 – 05:** System returns trends by Region, top N by TrendScore, by TechSkill keyword, by SnapshotDate.

**FR-TREND-06:** Frontend displays trends as interactive Recharts `AreaChart`:
- 3 area series (e.g. React, Python, Kubernetes)
- Fills use `#E8F0FE`, `#E6F4EA`, `#F3E8FD` with matching stroke colors
- Grid lines `#E8EAED` dashed, axes Body Small 12px `#5F6368`

---

### 3.10 E-Portfolio & GitHub Integration

**FR-PORT-01:** Students link GitHub repositories (`RepositoryName`, `RepoUrl`, `Description`, `IsPrivate`).

**FR-PORT-02:** System returns all GitHub Repositories for a Profile.

**FR-PORT-03:** Students soft-delete repositories.

**FR-PORT-04:** Portfolio Analysis stub returns placeholder AI summaries per repo.

**FR-PORT-05:** Public portfolio view at `/portfolio/{userId}` — no auth required. Displays: Profile info, Skills chip cloud, Roadmap progress bars, GitHub projects. Uses minimal navbar (no Navigation Rail).

---

### 3.11 AI Recommendation Stubs

**FR-AI-01:** `AnalyzeSkillGapAsync` — profile skills vs roadmap nodes → gap list.

**FR-AI-02:** `AnalyzeGitHubPortfolioAsync` — repos → placeholder AI summary.

**FR-AI-03:** `RecommendLearningResourcesAsync` — node resources, `IsFree = true` prioritized.

**FR-AI-04:** `GetTrendingSkillRecommendationsAsync` — top JobTrends by TrendScore minus skills student already has.

*Real LLM integration (GPT-4 / Gemini) is a future milestone.*

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **NFR-PERF-01:** Standard CRUD API responses < 500ms under normal load.
- **NFR-PERF-02:** `PerformanceMonitoringMiddleware` logs a warning for requests > 500ms.
- **NFR-PERF-03:** React Flow canvas renders up to 100 nodes without visible jank on the Roadmap Canvas page.
- **NFR-PERF-04:** TanStack Query caches REST responses (30-second stale window by default).
- **NFR-PERF-05:** Apollo Client caches GraphQL results until explicitly invalidated.

### 4.2 Security

- **NFR-SEC-01:** Passwords hashed with BCrypt; never logged or stored in plaintext.
- **NFR-SEC-02:** JWT secret and token config loaded from environment / `appsettings.json`; never hardcoded.
- **NFR-SEC-03:** Google ID Token validated with `GoogleJsonWebSignature.ValidateAsync` including audience check.
- **NFR-SEC-04:** Access Tokens short-lived (15 min); Refresh Tokens rotated on every use.
- **NFR-SEC-05:** Revoked or expired Refresh Tokens rejected with `401`.
- **NFR-SEC-06:** All endpoints except `/api/auth/*` require valid Access Token.
- **NFR-SEC-07:** Role-based access restricts Admin/Manager endpoints from RoadmapUsers.
- **NFR-SEC-08:** Frontend stores Access Token in Zustand (in-memory); Refresh Token in `sessionStorage` (dev) or secure HttpOnly cookie (production). Never `localStorage`.

### 4.3 Data Integrity

- **NFR-DATA-01:** All deletes are soft (`IsDeleted = true`, `UpdatedAt = DateTime.Now`). Hard DELETEs prohibited.
- **NFR-DATA-02:** `HasQueryFilter(e => !e.IsDeleted)` applied globally in `AppDbContext`.
- **NFR-DATA-03:** `DateTime.Now` throughout the backend. `DateTime.UtcNow` prohibited.
- **NFR-DATA-04:** All primary keys are `Guid`.
- **NFR-DATA-05:** `Email` unique at DB level. `GoogleId` unique nullable index. `UserRefreshToken.Token` unique index.

### 4.4 Scalability

- **NFR-SCALE-01:** All list endpoints support `PaginationRequest` / `PaginationResponse<T>`.
- **NFR-SCALE-02:** GraphQL collection resolvers support `[UseFiltering]`, `[UseSorting]`, `[UsePaging]`.

### 4.5 Maintainability

- **NFR-MAINT-01:** Strict 3-layer separation: API → Business → DataAccess.
- **NFR-MAINT-02:** No EF Core / DbContext references outside DataAccess layer.
- **NFR-MAINT-03:** No business logic in Controllers or GraphQL resolvers.
- **NFR-MAINT-04:** All service methods return `ServiceResult<T>`.
- **NFR-MAINT-05:** AutoMapper for all Entity ↔ DTO mapping. Manual mapping prohibited.

### 4.6 Observability

- **NFR-OBS-01:** Serilog → console + rolling daily file (`logs/app-.log`, retain 30 days).
- **NFR-OBS-02:** `ExceptionHandlingMiddleware` catches all unhandled exceptions → RFC 7807 ProblemDetails JSON, status 500.
- **NFR-OBS-03:** `RequestLoggingMiddleware` logs method, path, query, status code, elapsed ms.
- **NFR-OBS-04:** `PerformanceMonitoringMiddleware` `Log.Warning` for requests > 500ms.

### 4.7 Compatibility

- **NFR-COMPAT-01:** Backend: ASP.NET Core .NET 10, SQL Server (Code First Migrations).
- **NFR-COMPAT-02:** Frontend: React 19, TypeScript, Vite, React Router v7, Google Material Design 3.
- **NFR-COMPAT-03:** Latest 2 stable versions of Chrome, Firefox, Safari, Edge.
- **NFR-COMPAT-04:** Functional and visually complete on screens ≥ 375px.

### 4.8 UI/UX — MD3 Compliance

- **NFR-UI-01:** All interactive components follow MD3 component specifications (buttons, text fields, chips, cards, dialogs, navigation rail, FAB, snackbars, segmented buttons).
- **NFR-UI-02:** All colors use the MD3 color role tokens defined in `Design.md §3`.
- **NFR-UI-03:** All text uses the MD3 type scale defined in `Design.md §4`.
- **NFR-UI-04:** Elevation is expressed using the 5-level MD3 drop-shadow system defined in `Design.md §5`.
- **NFR-UI-05:** All corner radii use the MD3 shape scale defined in `Design.md §6`.
- **NFR-UI-06:** Node status is communicated exclusively through the 5-color status map (`#F1F3F4 / #E8F0FE / #FEF7E0 / #F3E8FD / #E6F4EA`) with matching stroke and text colors.
- **NFR-UI-07:** The Navigation Rail (80px) replaces any sidebar pattern on all authenticated pages.
- **NFR-UI-08:** All buttons are pill-shaped (`border-radius: 9999px`). No square or slightly-rounded buttons.
- **NFR-UI-09:** Text fields use MD3 Outlined variant with floating labels throughout.

---

## 5. API Contract

### 5.1 REST Endpoints (Write Operations)

All endpoints require `Authorization: Bearer <accessToken>` unless marked **Public**.

#### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register with email/password → Access + Refresh Token |
| POST | `/api/auth/login` | Public | Login with email/password → Access + Refresh Token |
| POST | `/api/auth/google` | Public | Google ID Token login → Access + Refresh Token |
| POST | `/api/auth/refresh` | Public | Exchange Refresh Token → new Access + Refresh Token |
| POST | `/api/auth/logout` | Required | Revoke Refresh Token |

#### Users
| Method | Path | Description |
|---|---|---|
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Deactivate user (also revokes all refresh tokens) |

#### Profiles
| Method | Path | Description |
|---|---|---|
| PUT | `/api/profiles/{userId}` | Update profile |

#### Skills
| Method | Path | Description |
|---|---|---|
| POST | `/api/skills` | Add skill |
| DELETE | `/api/skills/{skillId}` | Remove skill |

#### Career Roles
| Method | Path | Description |
|---|---|---|
| POST | `/api/career-roles` | Create |
| PUT | `/api/career-roles/{id}` | Update |
| DELETE | `/api/career-roles/{id}` | Delete |

#### Career Roadmaps
| Method | Path | Description |
|---|---|---|
| POST | `/api/career-roadmaps` | Create |
| PUT | `/api/career-roadmaps/{id}` | Update |
| DELETE | `/api/career-roadmaps/{id}` | Delete |
| POST | `/api/career-roadmaps/{id}/nodes/{nodeId}` | Assign node |
| DELETE | `/api/career-roadmaps/{id}/nodes/{nodeId}` | Remove node |

#### Nodes
| Method | Path | Description |
|---|---|---|
| POST | `/api/nodes` | Create |
| PUT | `/api/nodes/{id}` | Update |
| DELETE | `/api/nodes/{id}` | Delete |

#### Learning Resources
| Method | Path | Description |
|---|---|---|
| POST | `/api/nodes/{nodeId}/learning-resources` | Create |
| PUT | `/api/learning-resources/{id}` | Update |
| DELETE | `/api/learning-resources/{id}` | Delete |

#### Personal Roadmaps
| Method | Path | Description |
|---|---|---|
| POST | `/api/personal-roadmaps/generate` | Generate |
| DELETE | `/api/personal-roadmaps/{id}` | Delete |

#### Node Progress
| Method | Path | Description |
|---|---|---|
| PUT | `/api/node-progress/{nodeProgressId}/status` | Update status |

#### GitHub Repositories
| Method | Path | Description |
|---|---|---|
| POST | `/api/github-repositories` | Link repo |
| DELETE | `/api/github-repositories/{id}` | Remove repo |

#### Chat
| Method | Path | Description |
|---|---|---|
| POST | `/api/chat/sessions` | Create session |
| POST | `/api/chat/sessions/{sessionId}/messages` | Send message |

#### Job Trends
| Method | Path | Description |
|---|---|---|
| POST | `/api/job-trends` | Create |
| PUT | `/api/job-trends/{id}` | Update |
| DELETE | `/api/job-trends/{id}` | Delete |

### 5.2 GraphQL Queries (Read Operations)

Endpoint: `POST /graphql` with `Authorization: Bearer <accessToken>`.

```graphql
GetUserById(id: UUID): UserDto
GetUsers(pagination: PaginationRequest): PaginationResponse<UserDto>

GetProfileByUserId(userId: UUID): ProfileDto
GetProfileWithSkills(userId: UUID): ProfileWithSkillsDto
GetSkillsByProfile(profileId: UUID): [SkillDto]

GetCareerRoleById(id: UUID): CareerRoleDto
GetCareerRoles: [CareerRoleDto]

GetCareerRoadmapById(id: UUID): CareerRoadmapDto
GetCareerRoadmapsByRole(careerRoleId: UUID): [CareerRoadmapDto]
GetCareerRoadmapWithNodes(roadmapId: UUID): CareerRoadmapWithNodesDto

GetPersonalRoadmapsByProfile(profileId: UUID): [PersonalRoadmapDto]
GetPersonalRoadmapWithProgress(personalRoadmapId: UUID): PersonalRoadmapDetailDto

GetNodeById(id: UUID): NodeDto
GetNodeChildren(parentId: UUID): [NodeDto]
GetNodeHierarchy(rootId: UUID): NodeHierarchyDto

GetNodeProgress(personalRoadmapId: UUID): [NodeProgressDto]
GetCompletedNodes(personalRoadmapId: UUID): [NodeProgressDto]

GetLearningResourcesByNode(nodeId: UUID): [LearningResourceDto]
GetFreeResourcesByNode(nodeId: UUID): [LearningResourceDto]

GetGitHubRepositoriesByProfile(profileId: UUID): [GitHubRepositoryDto]

GetChatSessionsByProfile(profileId: UUID): [ChatSessionDto]
GetChatSessionWithMessages(sessionId: UUID): ChatSessionDetailDto

GetJobTrendsByRegion(region: String): [JobTrendDto]
GetTopTrendingSkills(count: Int): [JobTrendDto]

GetSkillGapAnalysis(profileId: UUID, careerRoadmapId: UUID): SkillGapAnalysisDto
GetPortfolioAnalysis(profileId: UUID): PortfolioAnalysisDto
GetTrendingSkillRecommendations(profileId: UUID): [String]
GetRecommendedResources(profileId: UUID, nodeId: UUID): [LearningResourceDto]
```

---

## 6. Database Design

### 6.1 UserRefreshToken Entity

```
UserRefreshToken
─────────────────────────────────────────────
UserRefreshTokenId   UUID          PK
UserId               UUID          FK → User.UserId  NOT NULL
Token                NVARCHAR(512) NOT NULL  UNIQUE INDEX
ExpiresAt            DATETIME      NOT NULL
IsRevoked            BIT           NOT NULL  DEFAULT 0
RevokedAt            DATETIME      NULLABLE
CreatedAt            DATETIME      NOT NULL
UpdatedAt            DATETIME      NULLABLE
IsDeleted            BIT           NOT NULL  DEFAULT 0
```

- Inherits `BaseAuditableEntity`
- `Token`: cryptographically random 64 bytes, Base64Url encoded
- `ExpiresAt`: `DateTime.Now.AddDays(RefreshTokenExpiryDays)`
- `IsRevoked`: set `true` on logout, token rotation, or user deactivation
- Unique index on `Token`
- Relationship: `User 1:M UserRefreshToken`

### 6.2 Full Entity & Relationship Summary

```
User              1:1   Profile               (Profile.UserId = PK + FK)
User              1:M   UserRefreshToken      (UserId FK)
Profile           1:M   Skill
Profile           1:M   GitHubRepository
Profile           1:M   ChatSession
ChatSession       1:M   ChatMessage
Profile           1:M   PersonalRoadmap
CareerRole        1:M   CareerRoadmap
CareerRoadmap     1:M   PersonalRoadmap
CareerRoadmap     M:M   Node                  via RoadmapNode
PersonalRoadmap   M:M   Node                  via NodeProgress (Status + Note)
Node              1:M   LearningResource      DIRECT — no junction table
Node              1:M   Node (self)           via ParentNodeId (nullable)
JobTrend          (standalone — no FK)
```

### 6.3 appsettings.json — Token Configuration

```json
{
  "Jwt": {
    "Issuer":                   "SECompass",
    "Audience":                 "SECompassUsers",
    "Secret":                   "<minimum 32 character secret key>",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays":   7
  },
  "Google": {
    "ClientId": "<your Google OAuth client ID>"
  }
}
```

---

## 7. Auth DTOs

```typescript
// RegisterUserDto
{ FullName: string, Email: string, Password: string, Role?: UserRole }

// LoginUserDto
{ Email: string, Password: string }

// GoogleLoginDto
{ IdToken: string }

// RefreshTokenRequestDto
{ RefreshToken: string }

// AuthResponseDto  ← returned by all auth endpoints
{
  accessToken:  string,   // JWT, short-lived (15 min)
  refreshToken: string,   // Opaque random token, long-lived (7 days)
  userId:       string,
  fullName:     string,
  email:        string,
  role:         number,   // UserRole int
  avatarUrl?:   string
}
```

---

## 8. Frontend Architecture

### 8.1 Tech Stack

| Concern | Library / Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Routing | React Router v7 |
| Design System | Google Material Design 3 |
| State (auth) | Zustand |
| REST data fetching | TanStack Query + Axios |
| GraphQL client | Apollo Client |
| Roadmap canvas | React Flow |
| Charts | Recharts |
| Icons | Material Symbols / Lucide React |
| Markdown rendering | react-markdown + remark-gfm |

### 8.2 MD3 Implementation Notes

- Use **MUI (Material UI v6+)** configured with MD3 theme tokens, or a headless component library styled against the MD3 tokens from `Design.md`
- The MD3 color tokens must be registered as CSS custom properties (see `Design.md §3.4`) and consumed via Tailwind's `extend.colors` or MUI `createTheme`
- All component overrides must match the specifications in `Design.md §8` exactly: pill buttons, 4px/8px/12px/28px/9999px radius scale, MD3 Outlined text fields with floating labels, Navigation Rail (not sidebar/drawer) for authenticated layout

### 8.3 Token Storage Strategy

| Token | Storage | Rationale |
|---|---|---|
| Access Token | Zustand store (in-memory) | Short-lived (15 min); never written to disk |
| Refresh Token | `sessionStorage` (dev) / secure HttpOnly cookie (prod) | Survives page refresh; isolated from JS in production |

### 8.4 Automatic Token Refresh (Axios Interceptor)

```
Request → Axios interceptor injects Access Token header
Response → If 401 received:
  1. Call POST /api/auth/refresh with stored Refresh Token
  2. If refresh succeeds → store new tokens → retry original request
  3. If refresh fails (expired/revoked) → clearAuth() → redirect to /login
```

### 8.5 Apollo Client Token Refresh

- Apollo `authLink` reads the Access Token from `AuthStore`
- On `UNAUTHENTICATED` GraphQL error: trigger the same refresh flow via `@apollo/client/link/error` `onError` handler
- On refresh failure: `client.clearStore()` + navigate to `/login`

### 8.6 Logout Flow

1. Call `POST /api/auth/logout` with current Refresh Token (server revocation)
2. `AuthStore.clearAuth()` (clear in-memory tokens)
3. `client.clearStore()` (clear Apollo cache)
4. Clear `sessionStorage`
5. Navigate to `/login`

---

## 9. Core TypeScript Types

```typescript
enum UserRole {
  Admin       = 0,
  Manager     = 1,
  RoadmapUser = 2,
}

enum NodeProgressStatus {
  NotStarted = 0,
  InProgress = 1,
  Paused     = 2,
  Skipped    = 3,
  Completed  = 4,
}

// MD3 Node Status Color Map (matches Design.md §3.3)
const NODE_STATUS_COLORS: Record<NodeProgressStatus, {
  fill: string; text: string; stroke: string; label: string;
}> = {
  [NodeProgressStatus.NotStarted]: { fill: '#F1F3F4', text: '#5F6368', stroke: '#DADCE0', label: 'Not Started' },
  [NodeProgressStatus.InProgress]: { fill: '#E8F0FE', text: '#1A73E8', stroke: '#4285F4', label: 'In Progress' },
  [NodeProgressStatus.Paused]:     { fill: '#FEF7E0', text: '#E37400', stroke: '#FBBC04', label: 'Paused'      },
  [NodeProgressStatus.Skipped]:    { fill: '#F3E8FD', text: '#7B1FA2', stroke: '#AB47BC', label: 'Skipped'     },
  [NodeProgressStatus.Completed]:  { fill: '#E6F4EA', text: '#1E8E3E', stroke: '#34A853', label: 'Done'        },
};

interface AuthResponseDto {
  accessToken:  string;
  refreshToken: string;
  userId:       string;
  fullName:     string;
  email:        string;
  role:         number;
  avatarUrl?:   string;
}

interface AuthStore {
  accessToken:     string | null;
  refreshToken:    string | null;
  user:            UserDto | null;
  isAuthenticated: boolean;
  setAuth:         (response: AuthResponseDto) => void;
  clearAuth:       () => void;
}

interface NodeProgressDto {
  nodeProgressId:    string;
  personalRoadmapId: string;
  nodeId:            string;
  status:            number;  // NodeProgressStatus int
  note?:             string;
  node:              NodeDto;
}

interface LearningResourceDto {
  learningResourceId: string;
  nodeId:             string;
  name:               string;
  resourceUrl:        string;
  resourceType:       string;  // plain string — NOT an enum
  provider?:          string;
  isFree:             boolean;
}

interface JobTrendDto {
  jobTrendId:   string;
  techSkill:    string;
  description?: string;
  source?:      string;
  region?:      string;
  trendScore:   number;
  snapshotDate: string;
}
```

---

## 10. Key Constraints & Decisions

| Constraint | Decision |
|---|---|
| Design system | Google Material Design 3 throughout all 19 screens |
| Layout pattern | Navigation Rail (80px) — not a sidebar — on all authenticated pages |
| Button shape | Pill (`border-radius: 9999px`) on all buttons, no exceptions |
| Text fields | MD3 Outlined with floating labels only |
| Read operations | ALL via GraphQL (Apollo Client) |
| Write operations | ALL via REST (TanStack Query + Axios) |
| Access Token expiry | 15 minutes |
| Refresh Token expiry | 7 days, rotated on every use |
| Refresh Token storage | `UserRefreshToken` table in SQL Server |
| Date/time | `DateTime.Now` (local) throughout backend |
| Enum storage | `UserRole` and `NodeProgressStatus` as INT in SQL Server |
| ResourceType | Plain NVARCHAR string — not an enum anywhere in the stack |
| Soft delete | `IsDeleted = true` on all entities; no hard DELETEs |
| Password | BCrypt hashed for email users; `null` for Google OAuth users |
| Node resources | Direct 1:M (`LearningResource.NodeId` FK) — no junction table |
| Architecture | 3-layer only: API → Business → DataAccess. No MediatR, no CQRS |
| Node status colors | Defined once in `NODE_STATUS_COLORS` constant; consumed by React Flow nodes, drawers, chips, and legend |

---

## 11. Out of Scope (v1.0)

- Real LLM API integration (GPT-4 / Gemini) — AI stubs only
- Real LinkedIn / TopCV scraping — Job Trend data manually entered
- GitHub API OAuth — repos linked manually by URL
- Email notifications / verification
- Real-time WebSocket chat
- Multi-tenancy
- CI/CD pipeline configuration
- Dark mode