# SECompass Backend — Implementation Tasks

## Task Overview
Generate the complete, production-ready backend for the SECompass platform following the architecture defined in `document/instruction.md`, `document/Requirements.md`, and `document/Design.md`.

All code targets **ASP.NET Core .NET 10**, SQL Server (Code First), and follows the strict 3-layer pattern: `SECompass.API` → `SECompass.BusinessLogic` → `SECompass.DataAccess`.

---

## Task 1: NuGet Packages & Project References
Set up all NuGet package references and project cross-references.

- [ ] 1.1 Add NuGet packages to `SECompass.DataAccess.csproj`:
  - `Microsoft.EntityFrameworkCore.SqlServer` (latest stable)
  - `Microsoft.EntityFrameworkCore.Tools` (latest stable)
  - `BCrypt.Net-Next` (latest stable)
- [ ] 1.2 Add NuGet packages to `SECompass.BusinessLogic.csproj`:
  - `AutoMapper` (latest stable)
  - `Google.Apis.Auth` (latest stable)
  - `Microsoft.AspNetCore.Authentication.JwtBearer` (latest stable for .NET 10)
  - `System.IdentityModel.Tokens.Jwt` (latest stable)
  - Confirm `ProjectReference` to `SECompass.DataAccess` is present
- [ ] 1.3 Add NuGet packages to `SECompass.API.csproj`:
  - `Serilog.AspNetCore` (latest stable)
  - `Serilog.Sinks.File` (latest stable)
  - `Swashbuckle.AspNetCore` (latest stable)
  - `HotChocolate.AspNetCore` (latest stable)
  - `HotChocolate.Data` (latest stable)
  - Confirm `ProjectReference` to `SECompass.BusinessLogic` is present

---

## Task 2: DataAccess Layer — Enums & Base Entity
Create the foundational types in `SECompass.DataAccess`.

- [ ] 2.1 Create `SECompass.DataAccess/Enums/UserRole.cs` — `Admin=0, Manager=1, RoadmapUser=2`
- [ ] 2.2 Create `SECompass.DataAccess/Enums/NodeProgressStatus.cs` — `NotStarted=0, InProgress=1, Paused=2, Skipped=3, Completed=4`
- [ ] 2.3 Create `SECompass.DataAccess/Entities/BaseAuditableEntity.cs` — `Id (Guid)`, `CreatedAt`, `UpdatedAt?`, `IsDeleted`

---

## Task 3: DataAccess Layer — All Entities
Create all 14 entity classes in `SECompass.DataAccess/Entities/`. No data annotations — Fluent API only.

- [ ] 3.1 `User.cs` — FullName, Email, PasswordHashed?, Role (UserRole), IsActive, GoogleId?, AvatarUrl?, navigation to Profile & UserRefreshTokens
- [ ] 3.2 `UserRefreshToken.cs` — UserId FK, Token, ExpiresAt, IsRevoked, RevokedAt?, navigation to User
- [ ] 3.3 `Profile.cs` — UserId (PK+FK shared), BioDescription?, PhoneNumber?, University?, Major?, StudiedYear?, navigations to Skill/GitHubRepository/ChatSession/PersonalRoadmap
- [ ] 3.4 `Skill.cs` — ProfileId FK, SkillName, Note?
- [ ] 3.5 `GitHubRepository.cs` — ProfileId FK, RepositoryName, RepoUrl, Description?, IsPrivate
- [ ] 3.6 `ChatSession.cs` — ProfileId FK, Title, Summary?, navigation to ChatMessages
- [ ] 3.7 `ChatMessage.cs` — ChatSessionId FK, Sender, MessageContent
- [ ] 3.8 `CareerRole.cs` — Name, Description?, navigation to CareerRoadmaps
- [ ] 3.9 `CareerRoadmap.cs` — CareerRoleId FK, Name, Description?, IsCustom, navigation to RoadmapNodes & PersonalRoadmaps
- [ ] 3.10 `Node.cs` — ParentNodeId? (self-ref FK), Name, Description?, Order, navigation to Children/LearningResources
- [ ] 3.11 `RoadmapNode.cs` — CareerRoadmapId FK, NodeId FK (junction)
- [ ] 3.12 `PersonalRoadmap.cs` — ProfileId FK, CareerRoadmapId FK, Note?, ProgressPercentage decimal(5,2), navigation to NodeProgresses
- [ ] 3.13 `NodeProgress.cs` — PersonalRoadmapId FK, NodeId FK, Status (NodeProgressStatus), Note?, navigation to Node
- [ ] 3.14 `LearningResource.cs` — NodeId FK, Name, ResourceUrl, ResourceType (string), Provider?, IsFree
- [ ] 3.15 `JobTrend.cs` — TechSkill, Description?, Source?, Region?, TrendScore, SnapshotDate

---

## Task 4: DataAccess Layer — EF Core Configurations
Create all Fluent API configuration classes in `SECompass.DataAccess/Configurations/`.

- [ ] 4.1 `UserConfiguration.cs` — PK, unique index on Email, unique nullable index on GoogleId, Role stored as int, soft-delete filter
- [ ] 4.2 `UserRefreshTokenConfiguration.cs` — PK, FK to User, unique index on Token, soft-delete filter
- [ ] 4.3 `ProfileConfiguration.cs` — shared PK (UserId is both PK and FK to User), 1:1 with User, soft-delete filter
- [ ] 4.4 `SkillConfiguration.cs` — PK, FK to Profile (ProfileId → Profile.UserId), soft-delete filter
- [ ] 4.5 `GitHubRepositoryConfiguration.cs` — PK, FK to Profile, soft-delete filter
- [ ] 4.6 `ChatSessionConfiguration.cs` — PK, FK to Profile, soft-delete filter
- [ ] 4.7 `ChatMessageConfiguration.cs` — PK, FK to ChatSession, soft-delete filter
- [ ] 4.8 `CareerRoleConfiguration.cs` — PK, soft-delete filter
- [ ] 4.9 `CareerRoadmapConfiguration.cs` — PK, FK to CareerRole, soft-delete filter
- [ ] 4.10 `NodeConfiguration.cs` — PK, self-ref FK (ParentNodeId) with DeleteBehavior.Restrict, soft-delete filter
- [ ] 4.11 `RoadmapNodeConfiguration.cs` — PK, FK to CareerRoadmap (Cascade), FK to Node (Cascade), soft-delete filter
- [ ] 4.12 `PersonalRoadmapConfiguration.cs` — PK, FK to Profile (Cascade), FK to CareerRoadmap (Restrict to avoid cycles), decimal(5,2) for ProgressPercentage, soft-delete filter
- [ ] 4.13 `NodeProgressConfiguration.cs` — PK, FK to PersonalRoadmap (Cascade), FK to Node (Restrict), Status stored as int, soft-delete filter
- [ ] 4.14 `LearningResourceConfiguration.cs` — PK, FK to Node (Cascade), ResourceType as nvarchar(100), soft-delete filter
- [ ] 4.15 `JobTrendConfiguration.cs` — PK, soft-delete filter

---

## Task 5: DataAccess Layer — AppDbContext
Create `SECompass.DataAccess/DbContexts/AppDbContext.cs`.

- [ ] 5.1 Inherit `DbContext`, add DbSet for every entity
- [ ] 5.2 Apply all IEntityTypeConfiguration classes via `ApplyConfigurationsFromAssembly`
- [ ] 5.3 Apply global `HasQueryFilter(e => !e.IsDeleted)` on all `BaseAuditableEntity` types
- [ ] 5.4 Override `SaveChangesAsync` to auto-set `CreatedAt = DateTime.Now` on new entities and `UpdatedAt = DateTime.Now` on modified entities

---

## Task 6: DataAccess Layer — Repository Pattern
Create all repository interfaces and implementations.

- [ ] 6.1 `IRepository<T>` interface in `SECompass.DataAccess/Repositories/IRepository.cs` — GetByIdAsync, GetAllAsync, FindAsync, ExistsAsync, AddAsync, Update, Delete (soft), GetPagedAsync
- [ ] 6.2 `GenericRepository<T>` full implementation in `SECompass.DataAccess/Repositories/GenericRepository.cs`
- [ ] 6.3 `IPersonalRoadmapRepository` + `PersonalRoadmapRepository` — `GetWithNodesAndProgressAsync` (eager loads NodeProgress → Node)
- [ ] 6.4 `INodeProgressRepository` + `NodeProgressRepository` — `GetByPersonalRoadmapAsync`, `BulkInsertAsync`
- [ ] 6.5 `IChatRepository` + `ChatRepository` — `GetSessionWithMessagesAsync` (eager loads ChatMessages ordered by CreatedAt ASC)

---

## Task 7: DataAccess Layer — Unit of Work
Create `IUnitOfWork` and `UnitOfWork` in `SECompass.DataAccess/UnitOfWork/`.

- [ ] 7.1 `IUnitOfWork.cs` — expose all repositories (Users, Profiles, Skills, CareerRoles, CareerRoadmaps, RoadmapNodes, Nodes, LearningResources, GitHubRepositories, ChatSessions, ChatMessages, JobTrends, PersonalRoadmaps, NodeProgresses, Chat, UserRefreshTokens), plus `SaveChangesAsync()`
- [ ] 7.2 `UnitOfWork.cs` — full implementation wiring all repositories to AppDbContext, lazy-initialize each repository property

---

## Task 8: DataAccess Layer — EF Core Migration
Create the initial migration file.

- [ ] 8.1 Create `SECompass.DataAccess/Migrations/20250101000000_InitialCreate.cs` — complete `Up()` and `Down()` covering all 15 tables in dependency order:
  `JobTrend → User → UserRefreshToken → Profile → CareerRole → CareerRoadmap → Node → RoadmapNode → PersonalRoadmap → NodeProgress → LearningResource → Skill → GitHubRepository → ChatSession → ChatMessage`
  All columns, nullability, defaults, FK constraints, and indexes as specified. Self-ref Node FK uses DeleteBehavior.Restrict. `Down()` drops in reverse order.

---

## Task 9: Business Layer — Common Classes & DTOs (Auth + User + Profile + Skill)
Create `SECompass.BusinessLogic/Common/` and the first set of DTOs.

- [ ] 9.1 `Common/ServiceResult.cs` — `bool Success`, `T? Data`, `string? Error`, static `Ok(T)` and `Fail(string)` factory methods
- [ ] 9.2 `Common/PaginationRequest.cs` — PageNumber, PageSize
- [ ] 9.3 `Common/PaginationResponse.cs` — Items, TotalCount, PageNumber, PageSize, TotalPages, HasNextPage, HasPreviousPage
- [ ] 9.4 `Common/FilterRequest.cs` — SearchTerm?, Filters dictionary
- [ ] 9.5 `Common/SortRequest.cs` — SortBy?, Descending
- [ ] 9.6 Auth DTOs: `RegisterUserDto`, `LoginUserDto`, `GoogleLoginDto`, `RefreshTokenRequestDto`, `AuthResponseDto`
- [ ] 9.7 User DTOs: `UserDto`, `UpdateUserDto`
- [ ] 9.8 Profile DTOs: `ProfileDto`, `UpdateProfileDto`, `ProfileWithSkillsDto`
- [ ] 9.9 Skill DTOs: `SkillDto`, `AddSkillDto`

---

## Task 10: Business Layer — DTOs (Domain Entities)
Create remaining DTO classes.

- [ ] 10.1 CareerRole DTOs: `CareerRoleDto`, `CreateCareerRoleDto`, `UpdateCareerRoleDto`
- [ ] 10.2 CareerRoadmap DTOs: `CareerRoadmapDto`, `CareerRoadmapWithNodesDto`, `CreateCareerRoadmapDto`, `UpdateCareerRoadmapDto`
- [ ] 10.3 Node DTOs: `NodeDto`, `NodeHierarchyDto` (recursive Children list), `CreateNodeDto`, `UpdateNodeDto`
- [ ] 10.4 PersonalRoadmap DTOs: `PersonalRoadmapDto`, `PersonalRoadmapDetailDto` (with NodeProgress list), `GeneratePersonalRoadmapRequestDto`
- [ ] 10.5 NodeProgress DTOs: `NodeProgressDto` (includes NodeDto), `UpdateNodeProgressStatusDto`
- [ ] 10.6 LearningResource DTOs: `LearningResourceDto`, `CreateLearningResourceDto`, `UpdateLearningResourceDto`
- [ ] 10.7 GitHubRepository DTOs: `GitHubRepositoryDto`, `AddGitHubRepoDto`
- [ ] 10.8 Chat DTOs: `ChatSessionDto`, `ChatSessionDetailDto` (with Messages list), `ChatMessageDto`, `CreateChatSessionDto`, `SendMessageDto`
- [ ] 10.9 JobTrend DTOs: `JobTrendDto`, `CreateJobTrendDto`, `UpdateJobTrendDto`
- [ ] 10.10 AI DTOs: `SkillGapAnalysisDto`, `PortfolioAnalysisDto`

---

## Task 11: Business Layer — AutoMapper MappingProfile
Create `SECompass.BusinessLogic/Mappings/MappingProfile.cs`.

- [ ] 11.1 All Entity → ResponseDto mappings (User→UserDto excluding PasswordHashed, Profile→ProfileDto/ProfileWithSkillsDto, CareerRoadmap→CareerRoadmapWithNodesDto, PersonalRoadmap→PersonalRoadmapDetailDto, Node→NodeHierarchyDto recursive, NodeProgress→NodeProgressDto with Node, etc.)
- [ ] 11.2 All CreateDto/AddDto → Entity mappings

---

## Task 12: Business Layer — Service Interfaces
Create all service interfaces in `SECompass.BusinessLogic/Interfaces/`.

- [ ] 12.1 `IAuthService.cs` — RegisterAsync, LoginAsync, GoogleLoginAsync, RefreshTokenAsync, LogoutAsync
- [ ] 12.2 `IUserService.cs` — GetByIdAsync, UpdateAsync, DeactivateAsync
- [ ] 12.3 `IProfileService.cs` — GetByUserIdAsync, UpdateAsync, GetProfileWithSkillsAsync
- [ ] 12.4 `ISkillService.cs` — AddSkillAsync, RemoveSkillAsync, GetSkillsByProfileAsync
- [ ] 12.5 `ICareerRoleService.cs` — CreateAsync, GetAllAsync, GetByIdAsync, UpdateAsync, DeleteAsync
- [ ] 12.6 `ICareerRoadmapService.cs` — CreateAsync, GetByIdAsync, GetByCareerRoleAsync, GetRoadmapWithNodesAsync, AssignNodeAsync, RemoveNodeAsync, UpdateAsync, DeleteAsync
- [ ] 12.7 `IPersonalRoadmapService.cs` — GenerateAsync, GetByProfileAsync, GetWithProgressAsync, RecalculateProgressAsync, DeleteAsync
- [ ] 12.8 `INodeService.cs` — CreateAsync, GetByIdAsync, GetChildrenAsync, GetHierarchyAsync, UpdateAsync, DeleteAsync
- [ ] 12.9 `INodeProgressService.cs` — UpdateStatusAsync, GetByPersonalRoadmapAsync, GetCompletedNodesAsync
- [ ] 12.10 `ILearningResourceService.cs` — CreateAsync, GetByNodeAsync, GetFreeByNodeAsync, GetByTypeAsync, UpdateAsync, DeleteAsync
- [ ] 12.11 `IGitHubRepositoryService.cs` — AddAsync, GetByProfileAsync, RemoveAsync
- [ ] 12.12 `IChatService.cs` — CreateSessionAsync, SendMessageAsync, GetSessionWithMessagesAsync, GetSessionsByProfileAsync, UpdateSummaryAsync
- [ ] 12.13 `IAIRecommendationService.cs` — AnalyzeSkillGapAsync, AnalyzeGitHubPortfolioAsync, RecommendLearningResourcesAsync, GetTrendingSkillRecommendationsAsync
- [ ] 12.14 `IJobTrendService.cs` — CreateAsync, GetByRegionAsync, GetTopTrendingAsync, GetBySkillAsync, GetBySnapshotDateAsync, UpdateAsync, DeleteAsync

---

## Task 13: Business Layer — AuthService
Create `SECompass.BusinessLogic/Services/AuthService.cs`.

- [ ] 13.1 Implement `RegisterAsync` — BCrypt hash, create User + empty Profile, generate JWT + Refresh Token, store RefreshToken, return AuthResponseDto
- [ ] 13.2 Implement `LoginAsync` — find by email, BCrypt verify, generate JWT + Refresh Token, return AuthResponseDto
- [ ] 13.3 Implement `GoogleLoginAsync` — `GoogleJsonWebSignature.ValidateAsync` with audience, find-or-create user + Profile, generate tokens
- [ ] 13.4 Implement `RefreshTokenAsync` — lookup token, validate not revoked/expired, rotate (revoke old, issue new pair), return AuthResponseDto
- [ ] 13.5 Implement `LogoutAsync` — revoke matching RefreshToken record
- [ ] 13.6 Private `GenerateJwtToken(User)` — NameIdentifier=UserId, Email, Role (int string), FullName; signed HMACSHA256; reads Jwt:Secret/Issuer/Audience/AccessTokenExpiryMinutes from IConfiguration
- [ ] 13.7 Private `GenerateRefreshToken()` — `RandomNumberGenerator`, 64 bytes, Base64Url encoded; create & save `UserRefreshToken` record

---

## Task 14: Business Layer — Core Domain Services
Create the remaining service implementations.

- [ ] 14.1 `UserService.cs` — GetByIdAsync, UpdateAsync, DeactivateAsync (sets IsActive=false, revokes all user refresh tokens)
- [ ] 14.2 `ProfileService.cs` — GetByUserIdAsync, UpdateAsync, GetProfileWithSkillsAsync
- [ ] 14.3 `SkillService.cs` — AddSkillAsync, RemoveSkillAsync (soft delete), GetSkillsByProfileAsync
- [ ] 14.4 `CareerRoleService.cs` — full CRUD with soft delete
- [ ] 14.5 `CareerRoadmapService.cs` — full CRUD + AssignNodeAsync (create RoadmapNode) + RemoveNodeAsync (soft delete RoadmapNode)
- [ ] 14.6 `PersonalRoadmapService.cs` — GenerateAsync (validate, load RoadmapNodes, bulk-create NodeProgress), GetByProfileAsync, GetWithProgressAsync, RecalculateProgressAsync (completed/total * 100, 2dp), DeleteAsync
- [ ] 14.7 `NodeService.cs` — CreateAsync, GetByIdAsync, GetChildrenAsync, GetHierarchyAsync (recursive), UpdateAsync, DeleteAsync
- [ ] 14.8 `NodeProgressService.cs` — UpdateStatusAsync (update + trigger RecalculateProgressAsync), GetByPersonalRoadmapAsync, GetCompletedNodesAsync
- [ ] 14.9 `LearningResourceService.cs` — CreateAsync (validate node exists, ResourceType as plain string), GetByNodeAsync, GetFreeByNodeAsync, GetByTypeAsync, UpdateAsync, DeleteAsync
- [ ] 14.10 `GitHubRepositoryService.cs` — AddAsync, GetByProfileAsync, RemoveAsync (soft delete)
- [ ] 14.11 `ChatService.cs` — CreateSessionAsync, SendMessageAsync, GetSessionWithMessagesAsync (ordered CreatedAt ASC), GetSessionsByProfileAsync, UpdateSummaryAsync
- [ ] 14.12 `AIRecommendationService.cs` — all 4 stub implementations
- [ ] 14.13 `JobTrendService.cs` — CreateAsync, GetByRegionAsync, GetTopTrendingAsync, GetBySkillAsync, GetBySnapshotDateAsync, UpdateAsync, DeleteAsync

---

## Task 15: API Layer — Middleware
Create the 3 middleware classes in `SECompass.API/Middleware/`.

- [ ] 15.1 `ExceptionHandlingMiddleware.cs` — catch all unhandled exceptions, Log.Error with Serilog, return RFC 7807 ProblemDetails JSON, status 500
- [ ] 15.2 `RequestLoggingMiddleware.cs` — log HTTP method, path, query string, status code, elapsed ms via Serilog structured logging
- [ ] 15.3 `PerformanceMonitoringMiddleware.cs` — measure elapsed time, Log.Warning if > 500ms with path and elapsed

---

## Task 16: API Layer — Controllers (Auth, Users, Profiles, Skills)
Create the first set of controllers in `SECompass.API/Controllers/`.

- [ ] 16.1 `AuthController.cs` — POST /api/auth/register, /login, /google, /refresh, /logout. Thin: call IAuthService, check ServiceResult, return correct HTTP codes. No [Authorize] on register/login/google/refresh; [Authorize] on logout.
- [ ] 16.2 `UsersController.cs` — PUT /api/users/{id}, DELETE /api/users/{id}. Requires [Authorize].
- [ ] 16.3 `ProfilesController.cs` — PUT /api/profiles/{userId}. Requires [Authorize].
- [ ] 16.4 `SkillsController.cs` — POST /api/skills, DELETE /api/skills/{skillId}. Requires [Authorize].

---

## Task 17: API Layer — Controllers (Domain Entities)
Create the remaining domain controllers.

- [ ] 17.1 `CareerRolesController.cs` — POST, PUT /{id}, DELETE /{id}
- [ ] 17.2 `CareerRoadmapsController.cs` — POST, PUT /{id}, DELETE /{id}, POST /{id}/nodes/{nodeId}, DELETE /{id}/nodes/{nodeId}
- [ ] 17.3 `NodesController.cs` — POST, PUT /{id}, DELETE /{id}
- [ ] 17.4 `LearningResourcesController.cs` — POST /api/nodes/{nodeId}/learning-resources, PUT /api/learning-resources/{id}, DELETE /api/learning-resources/{id}
- [ ] 17.5 `PersonalRoadmapsController.cs` — POST /api/personal-roadmaps/generate, DELETE /api/personal-roadmaps/{id}
- [ ] 17.6 `NodeProgressController.cs` — PUT /api/node-progress/{nodeProgressId}/status
- [ ] 17.7 `GitHubRepositoriesController.cs` — POST, DELETE /{id}
- [ ] 17.8 `ChatController.cs` — POST /api/chat/sessions, POST /api/chat/sessions/{sessionId}/messages
- [ ] 17.9 `JobTrendsController.cs` — POST, PUT /{id}, DELETE /{id}

---

## Task 18: API Layer — GraphQL Query
Create `SECompass.API/GraphQL/Queries/Query.cs` with all read resolvers.

- [ ] 18.1 User resolvers: GetUserById, GetUsers (paginated)
- [ ] 18.2 Profile resolvers: GetProfileByUserId, GetProfileWithSkills, GetSkillsByProfile
- [ ] 18.3 CareerRole resolvers: GetCareerRoleById, GetCareerRoles
- [ ] 18.4 CareerRoadmap resolvers: GetCareerRoadmapById, GetCareerRoadmapsByRole, GetCareerRoadmapWithNodes
- [ ] 18.5 PersonalRoadmap resolvers: GetPersonalRoadmapsByProfile, GetPersonalRoadmapWithProgress
- [ ] 18.6 Node resolvers: GetNodeById, GetNodeChildren, GetNodeHierarchy
- [ ] 18.7 NodeProgress resolvers: GetNodeProgress, GetCompletedNodes
- [ ] 18.8 LearningResource resolvers: GetLearningResourcesByNode, GetFreeResourcesByNode
- [ ] 18.9 Misc resolvers: GetGitHubRepositoriesByProfile, GetChatSessionsByProfile, GetChatSessionWithMessages, GetJobTrendsByRegion, GetTopTrendingSkills
- [ ] 18.10 AI resolvers: GetSkillGapAnalysis, GetPortfolioAnalysis, GetTrendingSkillRecommendations, GetRecommendedResources
- [ ] 18.11 Create `SECompass.API/GraphQL/ExampleQueries.graphql` with one example query per resolver

---

## Task 19: API Layer — DI Extensions & appsettings
Wire everything together.

- [ ] 19.1 Create `SECompass.API/Extensions/ServiceCollectionExtensions.cs` — register AppDbContext (SQL Server), IUnitOfWork, all repository interfaces, all service interfaces, AutoMapper, JWT Bearer auth (reads Jwt:* from config), HotChocolate GraphQL server (Query type + filtering + sorting + paging), Swagger/OpenAPI with JWT bearer security definition, Serilog
- [ ] 19.2 Create `SECompass.API/Extensions/ApplicationBuilderExtensions.cs` — extension methods for middleware pipeline order
- [ ] 19.3 Update `SECompass.API/appsettings.json` — add Jwt section (Issuer=SECompass, Audience=SECompassUsers, Secret, AccessTokenExpiryMinutes=15, RefreshTokenExpiryDays=7), Google:ClientId, Serilog section (console + rolling file logs/app-.log, retain 30 days)
- [ ] 19.4 Update `SECompass.API/Program.cs` — call ServiceCollectionExtensions, middleware pipeline in correct order: ExceptionHandlingMiddleware → RequestLoggingMiddleware → PerformanceMonitoringMiddleware → UseSwagger/UI → UseRouting → UseAuthentication → UseAuthorization → MapControllers → MapGraphQL

---

## Task 20: Build Verification
Verify the solution compiles successfully.

- [ ] 20.1 Run `dotnet build` on the solution and confirm zero errors
- [ ] 20.2 Fix any compilation errors found during the build
