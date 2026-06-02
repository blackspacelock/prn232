# Backend Generation Prompt — AI-Powered Career Orientation & Learning Roadmap Platform

---

You are a Principal .NET Backend Architect and Senior SaaS Backend Engineer.

Your task is to generate the COMPLETE, PRODUCTION-READY backend for an AI-Powered Career Orientation & Learning Roadmap Platform — a modern educational SaaS.

Generate ALL files in full. Do NOT abbreviate, summarize, or use placeholders like "// same as above" or "// implement as needed". Every file must be complete and compilable.

══════════════════════════════════════════
ARCHITECTURE: SIMPLE 3-LAYER REPOSITORY PATTERN
══════════════════════════════════════════

Folder structure (strictly enforce):

src/
 ├── API/
 │    ├── Controllers/
 │    │    ├── UsersController.cs
 │    │    ├── ProfilesController.cs
 │    │    ├── SkillsController.cs
 │    │    ├── CareerRolesController.cs
 │    │    ├── CareerRoadmapsController.cs
 │    │    ├── NodesController.cs
 │    │    ├── LearningResourcesController.cs
 │    │    ├── PersonalRoadmapsController.cs
 │    │    ├── NodeProgressController.cs
 │    │    ├── GitHubRepositoriesController.cs
 │    │    ├── ChatController.cs
 │    │    └── JobTrendsController.cs
 │    ├── GraphQL/
 │    │    ├── Queries/
 │    │    │    └── Query.cs
 │    │    └── Types/
 │    ├── Middleware/
 │    │    ├── ExceptionHandlingMiddleware.cs
 │    │    ├── RequestLoggingMiddleware.cs
 │    │    └── PerformanceMonitoringMiddleware.cs
 │    ├── Extensions/
 │    │    ├── ServiceCollectionExtensions.cs
 │    │    └── ApplicationBuilderExtensions.cs
 │    └── Program.cs
 │
 ├── Business/
 │    ├── DTOs/
 │    │    ├── Auth/
 │    │    │    ├── RegisterUserDto.cs
 │    │    │    ├── LoginUserDto.cs
 │    │    │    ├── GoogleLoginDto.cs
 │    │    │    └── AuthResponseDto.cs
 │    │    ├── User/
 │    │    ├── Profile/
 │    │    ├── Skill/
 │    │    ├── CareerRole/
 │    │    ├── CareerRoadmap/
 │    │    ├── PersonalRoadmap/
 │    │    ├── Node/
 │    │    ├── NodeProgress/
 │    │    ├── LearningResource/
 │    │    ├── GitHubRepository/
 │    │    ├── Chat/
 │    │    ├── JobTrend/
 │    │    └── Common/
 │    ├── Interfaces/
 │    │    ├── IAuthService.cs
 │    │    ├── IUserService.cs
 │    │    ├── IProfileService.cs
 │    │    ├── ISkillService.cs
 │    │    ├── ICareerRoleService.cs
 │    │    ├── ICareerRoadmapService.cs
 │    │    ├── IPersonalRoadmapService.cs
 │    │    ├── INodeService.cs
 │    │    ├── INodeProgressService.cs
 │    │    ├── ILearningResourceService.cs
 │    │    ├── IGitHubRepositoryService.cs
 │    │    ├── IChatService.cs
 │    │    ├── IAIRecommendationService.cs
 │    │    └── IJobTrendService.cs
 │    ├── Services/
 │    │    ├── AuthService.cs
 │    │    ├── UserService.cs
 │    │    ├── ProfileService.cs
 │    │    ├── SkillService.cs
 │    │    ├── CareerRoleService.cs
 │    │    ├── CareerRoadmapService.cs
 │    │    ├── PersonalRoadmapService.cs
 │    │    ├── NodeService.cs
 │    │    ├── NodeProgressService.cs
 │    │    ├── LearningResourceService.cs
 │    │    ├── GitHubRepositoryService.cs
 │    │    ├── ChatService.cs
 │    │    ├── AIRecommendationService.cs
 │    │    └── JobTrendService.cs
 │    ├── Mappings/
 │    │    └── MappingProfile.cs
 │    └── Common/
 │         ├── PaginationRequest.cs
 │         ├── PaginationResponse.cs
 │         ├── FilterRequest.cs
 │         ├── SortRequest.cs
 │         └── ServiceResult.cs
 │
 └── DataAccess/
      ├── Entities/
      │    ├── BaseAuditableEntity.cs
      │    ├── User.cs
      │    ├── Profile.cs
      │    ├── Skill.cs
      │    ├── CareerRole.cs
      │    ├── CareerRoadmap.cs
      │    ├── RoadmapNode.cs
      │    ├── Node.cs
      │    ├── PersonalRoadmap.cs
      │    ├── NodeProgress.cs
      │    ├── LearningResource.cs
      │    ├── GitHubRepository.cs
      │    ├── ChatSession.cs
      │    ├── ChatMessage.cs
      │    └── JobTrend.cs
      ├── Enums/
      │    ├── UserRole.cs
      │    └── NodeProgressStatus.cs
      ├── DbContexts/
      │    └── AppDbContext.cs
      ├── Configurations/
      │    ├── UserConfiguration.cs
      │    ├── ProfileConfiguration.cs
      │    ├── SkillConfiguration.cs
      │    ├── CareerRoleConfiguration.cs
      │    ├── CareerRoadmapConfiguration.cs
      │    ├── RoadmapNodeConfiguration.cs
      │    ├── NodeConfiguration.cs
      │    ├── PersonalRoadmapConfiguration.cs
      │    ├── NodeProgressConfiguration.cs
      │    ├── LearningResourceConfiguration.cs
      │    ├── GitHubRepositoryConfiguration.cs
      │    ├── ChatSessionConfiguration.cs
      │    ├── ChatMessageConfiguration.cs
      │    └── JobTrendConfiguration.cs
      ├── Repositories/
      │    ├── IRepository.cs
      │    ├── GenericRepository.cs
      │    ├── IPersonalRoadmapRepository.cs
      │    ├── PersonalRoadmapRepository.cs
      │    ├── INodeProgressRepository.cs
      │    ├── NodeProgressRepository.cs
      │    ├── IChatRepository.cs
      │    └── ChatRepository.cs
      ├── UnitOfWork/
      │    ├── IUnitOfWork.cs
      │    └── UnitOfWork.cs
      └── Migrations/
           └── 20250101000000_InitialCreate.cs

══════════════════════════════════════════
DEPENDENCY FLOW — STRICTLY ENFORCE
══════════════════════════════════════════

API → Business → DataAccess

NEVER: API → DataAccess

Rules:
- Controllers call ONLY Business layer services via interfaces
- Business services call ONLY repositories via IUnitOfWork
- GraphQL resolvers call ONLY Business layer services via interfaces
- No DbContext, EF Core, or SQL logic in API or Business layers

══════════════════════════════════════════
TECH STACK
══════════════════════════════════════════

- ASP.NET Core .NET 10
- SQL Server + Entity Framework Core (Code First, Migrations)
- AutoMapper
- Serilog (structured logging, console + rolling file)
- Swagger/OpenAPI — NO XML doc comments; use [ProducesResponseType] attributes only
- HotChocolate GraphQL (ALL read operations go through GraphQL)
- Microsoft.AspNetCore.Authentication.JwtBearer (JWT for email/password login)
- Google.Apis.Auth (for Google ID token verification — Google OAuth login)

══════════════════════════════════════════
DO NOT USE
══════════════════════════════════════════

- Clean Architecture
- MediatR / CQRS
- Domain Events / Event Sourcing
- Microservices / Distributed Messaging
- NodeLearningResource junction table (removed)
- XML doc comments on Swagger
- ResourceType enum (ResourceType is stored as plain NVARCHAR string)

══════════════════════════════════════════
BASE ENTITY
══════════════════════════════════════════

public abstract class BaseAuditableEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

IMPORTANT:
- Use DateTime.Now (local time) everywhere — NEVER DateTime.UtcNow
- All entities use Guid primary keys
- All entities inherit BaseAuditableEntity
- All entities support soft delete (IsDeleted = true, never hard DELETE)
- AppDbContext must apply .HasQueryFilter(e => !e.IsDeleted) on all BaseAuditableEntity types

══════════════════════════════════════════
ENUMS — EXACT DEFINITIONS
══════════════════════════════════════════

There are ONLY TWO enums. Do NOT create a ResourceType enum.

── UserRole (stored as INT in database) ──
public enum UserRole
{
    Admin       = 0,
    Manager     = 1,
    RoadmapUser = 2
}

── NodeProgressStatus (stored as INT in database) ──
public enum NodeProgressStatus
{
    NotStarted = 0,
    InProgress = 1,
    Paused     = 2,
    Skipped    = 3,
    Completed  = 4
}

IMPORTANT:
- Both enums stored as INT in SQL Server
- Use .HasConversion<int>() in Fluent API configurations
- ResourceType on LearningResource is NVARCHAR(100) plain string — NOT an enum
- No other enums are allowed

══════════════════════════════════════════
DATABASE DESIGN — ENTITIES & EXACT COLUMNS
══════════════════════════════════════════

Implement each entity exactly as specified.
Use EF Core Fluent API for ALL configurations (NO data annotations on entity classes).

──────────────────────────────────────────
1. JobTrend  (standalone — no FK)
──────────────────────────────────────────
  JobTrendId     UUID         PK
  TechSkill      NVARCHAR(255) NOT NULL
  Description    NVARCHAR(MAX)
  Source         NVARCHAR(255)
  Region         NVARCHAR(255)
  TrendScore     INT
  SnapshotDate   DATETIME      NOT NULL
  CreatedAt      DATETIME      NOT NULL
  UpdatedAt      DATETIME
  IsDeleted      BIT           NOT NULL  DEFAULT 0

──────────────────────────────────────────
2. User
──────────────────────────────────────────
  UserId           UUID          PK
  FullName         NVARCHAR(255) NOT NULL
  Email            NVARCHAR(255) NOT NULL  UNIQUE INDEX
  PasswordHashed   NVARCHAR(MAX) NULLABLE
    — nullable because Google OAuth users have no password
  Role             INT           NOT NULL  (UserRole enum stored as int)
  IsActive         BIT           NOT NULL  DEFAULT 1
  GoogleId         NVARCHAR(255) NULLABLE  UNIQUE INDEX
    — stores the Google subject ID ("sub") from the Google ID token
    — null for email/password users
  AvatarUrl        NVARCHAR(MAX) NULLABLE
    — stores profile picture URL from Google; null for email/password users
  CreatedAt        DATETIME      NOT NULL
  UpdatedAt        DATETIME
  IsDeleted        BIT           NOT NULL  DEFAULT 0

──────────────────────────────────────────
3. Profile
──────────────────────────────────────────
  UserId           UUID          PK  (also FK → User.UserId — shared PK, 1:1)
  BioDescription   NVARCHAR(MAX)
  PhoneNumber      NVARCHAR(MAX)
  University       NVARCHAR(255)
  Major            NVARCHAR(255)
  StudiedYear      INT
  CreatedAt        DATETIME      NOT NULL
  UpdatedAt        DATETIME
  IsDeleted        BIT           NOT NULL  DEFAULT 0

Relationship: User 1:1 Profile
  — Profile.UserId is both PK and FK → User.UserId
  — Profile is the dependent entity

──────────────────────────────────────────
4. Skill
──────────────────────────────────────────
  SkillId    UUID          PK
  ProfileId  UUID          FK → Profile.UserId  NOT NULL
  SkillName  NVARCHAR(255) NOT NULL
  Note       NVARCHAR(MAX)
  CreatedAt  DATETIME      NOT NULL
  UpdatedAt  DATETIME
  IsDeleted  BIT           NOT NULL  DEFAULT 0

Relationship: Profile 1:M Skill

──────────────────────────────────────────
5. GitHubRepository
──────────────────────────────────────────
  GithubRepositoryId  UUID          PK
  ProfileId           UUID          FK → Profile.UserId  NOT NULL
  RepositoryName      NVARCHAR(255) NOT NULL
  RepoUrl             NVARCHAR(MAX) NOT NULL
  Description         NVARCHAR(MAX)
  IsPrivate           BIT           NOT NULL  DEFAULT 0
  CreatedAt           DATETIME      NOT NULL
  UpdatedAt           DATETIME
  IsDeleted           BIT           NOT NULL  DEFAULT 0

Relationship: Profile 1:M GitHubRepository

──────────────────────────────────────────
6. ChatSession
──────────────────────────────────────────
  ChatSessionId  UUID          PK
  ProfileId      UUID          FK → Profile.UserId  NOT NULL
  Title          NVARCHAR(255) NOT NULL
  Summary        NVARCHAR(MAX)
  CreatedAt      DATETIME      NOT NULL
  UpdatedAt      DATETIME
  IsDeleted      BIT           NOT NULL  DEFAULT 0

Relationship: Profile 1:M ChatSession

──────────────────────────────────────────
7. ChatMessage
──────────────────────────────────────────
  ChatMessageId   UUID          PK
  ChatSessionId   UUID          FK → ChatSession.ChatSessionId  NOT NULL
  Sender          NVARCHAR(100) NOT NULL
  MessageContent  NVARCHAR(MAX) NOT NULL
  CreatedAt       DATETIME      NOT NULL
  UpdatedAt       DATETIME
  IsDeleted       BIT           NOT NULL  DEFAULT 0

Relationship: ChatSession 1:M ChatMessage

──────────────────────────────────────────
8. CareerRole
──────────────────────────────────────────
  CareerRoleId  UUID          PK
  Name          NVARCHAR(255) NOT NULL
  Description   NVARCHAR(MAX)
  CreatedAt     DATETIME      NOT NULL
  UpdatedAt     DATETIME
  IsDeleted     BIT           NOT NULL  DEFAULT 0

──────────────────────────────────────────
9. CareerRoadmap
──────────────────────────────────────────
  CareerRoadmapId  UUID          PK
  CareerRoleId     UUID          FK → CareerRole.CareerRoleId  NOT NULL
  Name             NVARCHAR(255) NOT NULL
  Description      NVARCHAR(MAX)
  IsCustom         BIT           NOT NULL  DEFAULT 0
  CreatedAt        DATETIME      NOT NULL
  UpdatedAt        DATETIME
  IsDeleted        BIT           NOT NULL  DEFAULT 0

Relationship: CareerRole 1:M CareerRoadmap

──────────────────────────────────────────
10. PersonalRoadmap
──────────────────────────────────────────
  PersonalRoadmapId   UUID          PK
  ProfileId           UUID          FK → Profile.UserId  NOT NULL
  CareerRoadmapId     UUID          FK → CareerRoadmap.CareerRoadmapId  NOT NULL
  Note                NVARCHAR(MAX)
  ProgressPercentage  DECIMAL(5,2)  NOT NULL  DEFAULT 0
  CreatedAt           DATETIME      NOT NULL
  UpdatedAt           DATETIME
  IsDeleted           BIT           NOT NULL  DEFAULT 0

Relationships:
  — Profile 1:M PersonalRoadmap
  — CareerRoadmap 1:M PersonalRoadmap
    (many students can each have a PersonalRoadmap based on the same CareerRoadmap)

──────────────────────────────────────────
11. Node
──────────────────────────────────────────
  NodeId        UUID          PK
  ParentNodeId  UUID          FK → Node.NodeId  NULLABLE (self-reference for hierarchy)
  Name          NVARCHAR(255) NOT NULL
  Description   NVARCHAR(MAX)
  Order         INT           NOT NULL  DEFAULT 0
  CreatedAt     DATETIME      NOT NULL
  UpdatedAt     DATETIME
  IsDeleted     BIT           NOT NULL  DEFAULT 0

Relationships:
  — Node self-references via ParentNodeId (nullable)
  — Node 1:M LearningResource (direct — no junction table)

──────────────────────────────────────────
12. RoadmapNode  (junction: CareerRoadmap ↔ Node)
──────────────────────────────────────────
  RoadmapNodeId   UUID     PK
  CareerRoadmapId UUID     FK → CareerRoadmap.CareerRoadmapId  NOT NULL
  NodeId          UUID     FK → Node.NodeId  NOT NULL
  CreatedAt       DATETIME NOT NULL
  UpdatedAt       DATETIME
  IsDeleted       BIT      NOT NULL  DEFAULT 0

Relationship: CareerRoadmap M:M Node via RoadmapNode

──────────────────────────────────────────
13. NodeProgress  (junction: PersonalRoadmap ↔ Node, carries progress data)
──────────────────────────────────────────
  NodeProgressId    UUID     PK
  PersonalRoadmapId UUID     FK → PersonalRoadmap.PersonalRoadmapId  NOT NULL
  NodeId            UUID     FK → Node.NodeId  NOT NULL
  Status            INT      NOT NULL  (NodeProgressStatus enum stored as int)
  Note              NVARCHAR(MAX)
  CreatedAt         DATETIME NOT NULL
  UpdatedAt         DATETIME
  IsDeleted         BIT      NOT NULL  DEFAULT 0

Relationship: PersonalRoadmap M:M Node via NodeProgress

──────────────────────────────────────────
14. LearningResource  (directly owned by Node — 1:M, NOT a junction)
──────────────────────────────────────────
  LearningResourceId  UUID           PK
  NodeId              UUID           FK → Node.NodeId  NOT NULL
  Name                NVARCHAR(255)  NOT NULL
  ResourceUrl         NVARCHAR(MAX)  NOT NULL
  ResourceType        NVARCHAR(100)  NOT NULL
    — plain string, NOT an enum (e.g. "Article", "Video", "Course", "Book", "Podcast", "Tool")
  Provider            NVARCHAR(255)
  IsFree              BIT            NOT NULL  DEFAULT 1
  CreatedAt           DATETIME       NOT NULL
  UpdatedAt           DATETIME
  IsDeleted           BIT            NOT NULL  DEFAULT 0

Relationship: Node 1:M LearningResource
  — LearningResource.NodeId FK → Node.NodeId
  — DO NOT create a NodeLearningResource junction table

══════════════════════════════════════════
COMPLETE RELATIONSHIP SUMMARY
══════════════════════════════════════════

User            1:1   Profile              (Profile.UserId = PK + FK)
Profile         1:M   Skill
Profile         1:M   GitHubRepository
Profile         1:M   ChatSession
ChatSession     1:M   ChatMessage
Profile         1:M   PersonalRoadmap
CareerRole      1:M   CareerRoadmap
CareerRoadmap   1:M   PersonalRoadmap
CareerRoadmap   M:M   Node                 via RoadmapNode
PersonalRoadmap M:M   Node                 via NodeProgress (Status + Note)
Node            1:M   LearningResource     DIRECT — no junction table
Node            1:M   Node (self)          via ParentNodeId (nullable)

══════════════════════════════════════════
AUTHENTICATION DESIGN
══════════════════════════════════════════

The platform supports TWO login methods. Both return a JWT access token.

── Method 1: Email / Password login ──────

Flow:
  POST /api/auth/register
    — accepts: FullName, Email, Password, Role (optional, default RoadmapUser = 2)
    — hashes password with BCrypt
    — creates User (GoogleId = null, AvatarUrl = null)
    — auto-creates an empty Profile for the new User
    — returns AuthResponseDto { AccessToken, UserId, FullName, Email, Role, AvatarUrl }

  POST /api/auth/login
    — accepts: Email, Password
    — validates email exists
    — verifies BCrypt password hash
    — generates JWT
    — returns AuthResponseDto

── Method 2: Google OAuth (ID Token login) ─

Flow:
  POST /api/auth/google
    — accepts: GoogleLoginDto { IdToken: string }
    — calls Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(IdToken)
      to verify the token with Google's servers
    — extracts from the validated payload: Subject (GoogleId), Email, Name, Picture
    — if User with matching GoogleId exists → login (generate JWT, return AuthResponseDto)
    — else if User with matching Email exists (email/password account) → link GoogleId to
      existing User, update AvatarUrl, login (generate JWT, return AuthResponseDto)
    — else → create new User (PasswordHashed = null, GoogleId = payload.Subject,
      AvatarUrl = payload.Picture, Role = RoadmapUser = 2), auto-create empty Profile,
      generate JWT, return AuthResponseDto

IMPORTANT — Google ID Token validation:
  — Use Google.Apis.Auth NuGet package
  — Call GoogleJsonWebSignature.ValidateAsync(idToken, new ValidationSettings { Audience = [GoogleClientId] })
  — GoogleClientId is read from appsettings.json "Google:ClientId"
  — If validation throws → return 400 Bad Request with error message

── JWT generation ─────────────────────────

  — Use Microsoft.AspNetCore.Authentication.JwtBearer
  — Claims in token: UserId (NameIdentifier), Email, Role (int as string), FullName
  — JWT settings read from appsettings.json "Jwt" section: Issuer, Audience, Secret, ExpiryMinutes
  — Token expiry: configurable via appsettings.json (default 60 minutes)
  — IAuthService generates the JWT — Business layer, no EF Core

── AuthService responsibilities ──────────

  IAuthService:
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterUserDto dto)
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginUserDto dto)
    Task<ServiceResult<AuthResponseDto>> GoogleLoginAsync(GoogleLoginDto dto)

  AuthService (implements IAuthService):
    — Inject IUnitOfWork, IMapper, IConfiguration
    — RegisterAsync: hash password with BCrypt, create User + empty Profile, generate JWT
    — LoginAsync: find user by email, verify BCrypt hash, generate JWT
    — GoogleLoginAsync: validate Google ID token, find-or-create user, generate JWT
    — Private method GenerateJwtToken(User user): builds and signs JWT

── AuthController ─────────────────────────

  [ApiController]
  [Route("api/auth")]
  AuthController (thin — only calls IAuthService):
    POST /api/auth/register     → RegisterAsync
    POST /api/auth/login        → LoginAsync
    POST /api/auth/google       → GoogleLoginAsync

── DTOs ────────────────────────────────────

  RegisterUserDto:
    string FullName
    string Email
    string Password
    UserRole Role = UserRole.RoadmapUser  (optional)

  LoginUserDto:
    string Email
    string Password

  GoogleLoginDto:
    string IdToken  (the raw Google ID token string from the frontend)

  AuthResponseDto:
    string AccessToken
    Guid UserId
    string FullName
    string Email
    int Role
    string? AvatarUrl

══════════════════════════════════════════
REPOSITORY PATTERN
══════════════════════════════════════════

IRepository<T>:
  Task<T?> GetByIdAsync(Guid id)
  Task<IEnumerable<T>> GetAllAsync()
  Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
  Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
  Task AddAsync(T entity)
  void Update(T entity)
  void Delete(T entity)   // soft delete: entity.IsDeleted = true, entity.UpdatedAt = DateTime.Now
  Task<PaginationResponse<T>> GetPagedAsync(FilterRequest filter, SortRequest sort, PaginationRequest pagination)

GenericRepository<T>: full implementation of IRepository<T> using AppDbContext.

Feature-specific repositories (only where complex queries are needed):

IPersonalRoadmapRepository / PersonalRoadmapRepository:
  Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId)
  — eagerly loads: NodeProgress entries → Node entities

INodeProgressRepository / NodeProgressRepository:
  Task<IEnumerable<NodeProgress>> GetByPersonalRoadmapAsync(Guid personalRoadmapId)
  Task BulkInsertAsync(IEnumerable<NodeProgress> entries)

IChatRepository / ChatRepository:
  Task<ChatSession?> GetSessionWithMessagesAsync(Guid chatSessionId)
  — eagerly loads: ChatMessage list ordered by CreatedAt ASC

IUnitOfWork (expose ALL repositories):
  IRepository<User>             Users
  IRepository<Profile>          Profiles
  IRepository<Skill>            Skills
  IRepository<CareerRole>       CareerRoles
  IRepository<CareerRoadmap>    CareerRoadmaps
  IRepository<RoadmapNode>      RoadmapNodes
  IRepository<Node>             Nodes
  IRepository<LearningResource> LearningResources
  IRepository<GitHubRepository> GitHubRepositories
  IRepository<ChatSession>      ChatSessions
  IRepository<ChatMessage>      ChatMessages
  IRepository<JobTrend>         JobTrends
  IPersonalRoadmapRepository    PersonalRoadmaps
  INodeProgressRepository       NodeProgresses
  IChatRepository               Chat
  Task<int> SaveChangesAsync()

UnitOfWork: full implementation wiring all repositories to AppDbContext.

NOTE: There is NO NodeLearningResource repository.
LearningResource is queried via IRepository<LearningResource>.FindAsync(r => r.NodeId == nodeId).

══════════════════════════════════════════
BUSINESS LAYER — SERVICES
══════════════════════════════════════════

Generate interface + full implementation for ALL services.

Each service must:
- Inject IUnitOfWork and IMapper
- Use async/await throughout
- Return ServiceResult<T>
- NEVER reference DbContext, EF Core, or DataAccess namespaces directly

─────────────────────────────────────────
AuthService  (see Authentication Design section above for full spec)
─────────────────────────────────────────

─────────────────────────────────────────
UserService
─────────────────────────────────────────
  GetByIdAsync(Guid userId) → ServiceResult<UserDto>
  UpdateAsync(Guid userId, UpdateUserDto dto) → ServiceResult<UserDto>
  DeactivateAsync(Guid userId) → ServiceResult<bool>

─────────────────────────────────────────
ProfileService
─────────────────────────────────────────
  GetByUserIdAsync(Guid userId) → ServiceResult<ProfileDto>
  UpdateAsync(Guid userId, UpdateProfileDto dto) → ServiceResult<ProfileDto>
  GetProfileWithSkillsAsync(Guid userId) → ServiceResult<ProfileWithSkillsDto>

─────────────────────────────────────────
SkillService
─────────────────────────────────────────
  AddSkillAsync(Guid profileId, AddSkillDto dto) → ServiceResult<SkillDto>
  RemoveSkillAsync(Guid skillId) → ServiceResult<bool>
  GetSkillsByProfileAsync(Guid profileId) → ServiceResult<List<SkillDto>>

─────────────────────────────────────────
CareerRoleService
─────────────────────────────────────────
  CreateAsync(CreateCareerRoleDto dto) → ServiceResult<CareerRoleDto>
  GetAllAsync() → ServiceResult<List<CareerRoleDto>>
  GetByIdAsync(Guid id) → ServiceResult<CareerRoleDto>
  UpdateAsync(Guid id, UpdateCareerRoleDto dto) → ServiceResult<CareerRoleDto>
  DeleteAsync(Guid id) → ServiceResult<bool>

─────────────────────────────────────────
CareerRoadmapService
─────────────────────────────────────────
  CreateAsync(CreateCareerRoadmapDto dto) → ServiceResult<CareerRoadmapDto>
  GetByIdAsync(Guid id) → ServiceResult<CareerRoadmapDto>
  GetByCareerRoleAsync(Guid careerRoleId) → ServiceResult<List<CareerRoadmapDto>>
  GetRoadmapWithNodesAsync(Guid roadmapId) → ServiceResult<CareerRoadmapWithNodesDto>
  AssignNodeAsync(Guid roadmapId, Guid nodeId) → ServiceResult<bool>
  RemoveNodeAsync(Guid roadmapId, Guid nodeId) → ServiceResult<bool>
  UpdateAsync(Guid id, UpdateCareerRoadmapDto dto) → ServiceResult<CareerRoadmapDto>
  DeleteAsync(Guid id) → ServiceResult<bool>

─────────────────────────────────────────
PersonalRoadmapService
─────────────────────────────────────────
  GenerateAsync(Guid profileId, Guid careerRoadmapId) → ServiceResult<PersonalRoadmapDetailDto>
    LOGIC:
      1. Validate profileId exists
      2. Validate careerRoadmapId exists
      3. Load all RoadmapNodes for that CareerRoadmap
      4. Create PersonalRoadmap (ProfileId, CareerRoadmapId, ProgressPercentage = 0)
      5. For each RoadmapNode, create a NodeProgress (Status = NotStarted = 0)
      6. BulkInsert all NodeProgress entries
      7. SaveChangesAsync()
      8. Return PersonalRoadmapDetailDto with full NodeProgress list

  GetByProfileAsync(Guid profileId) → ServiceResult<List<PersonalRoadmapDto>>
  GetWithProgressAsync(Guid personalRoadmapId) → ServiceResult<PersonalRoadmapDetailDto>
  RecalculateProgressAsync(Guid personalRoadmapId) → ServiceResult<decimal>
    LOGIC:
      — count total NodeProgress entries for this PersonalRoadmap
      — count entries where Status = Completed (4)
      — ProgressPercentage = (completed / total) * 100, rounded to 2 decimal places
      — update PersonalRoadmap.ProgressPercentage + UpdatedAt = DateTime.Now
      — SaveChangesAsync()
  DeleteAsync(Guid personalRoadmapId) → ServiceResult<bool>

─────────────────────────────────────────
NodeService
─────────────────────────────────────────
  CreateAsync(CreateNodeDto dto) → ServiceResult<NodeDto>
  GetByIdAsync(Guid id) → ServiceResult<NodeDto>
  GetChildrenAsync(Guid parentId) → ServiceResult<List<NodeDto>>
  GetHierarchyAsync(Guid rootId) → ServiceResult<NodeHierarchyDto>
  UpdateAsync(Guid id, UpdateNodeDto dto) → ServiceResult<NodeDto>
  DeleteAsync(Guid id) → ServiceResult<bool>

─────────────────────────────────────────
NodeProgressService
─────────────────────────────────────────
  UpdateStatusAsync(Guid nodeProgressId, NodeProgressStatus status, string? note)
    → ServiceResult<NodeProgressDto>
    — after updating, call PersonalRoadmapService.RecalculateProgressAsync()
  GetByPersonalRoadmapAsync(Guid personalRoadmapId) → ServiceResult<List<NodeProgressDto>>
  GetCompletedNodesAsync(Guid personalRoadmapId) → ServiceResult<List<NodeProgressDto>>
    — Status = Completed (4)

─────────────────────────────────────────
LearningResourceService
─────────────────────────────────────────
  CreateAsync(Guid nodeId, CreateLearningResourceDto dto) → ServiceResult<LearningResourceDto>
    — validate nodeId exists
    — ResourceType stored as plain string
  GetByNodeAsync(Guid nodeId) → ServiceResult<List<LearningResourceDto>>
  GetFreeByNodeAsync(Guid nodeId) → ServiceResult<List<LearningResourceDto>>
  GetByTypeAsync(Guid nodeId, string resourceType) → ServiceResult<List<LearningResourceDto>>
  UpdateAsync(Guid id, UpdateLearningResourceDto dto) → ServiceResult<LearningResourceDto>
  DeleteAsync(Guid id) → ServiceResult<bool>

─────────────────────────────────────────
GitHubRepositoryService
─────────────────────────────────────────
  AddAsync(Guid profileId, AddGitHubRepoDto dto) → ServiceResult<GitHubRepositoryDto>
  GetByProfileAsync(Guid profileId) → ServiceResult<List<GitHubRepositoryDto>>
  RemoveAsync(Guid repoId) → ServiceResult<bool>

─────────────────────────────────────────
ChatService
─────────────────────────────────────────
  CreateSessionAsync(Guid profileId, CreateChatSessionDto dto) → ServiceResult<ChatSessionDto>
  SendMessageAsync(Guid sessionId, SendMessageDto dto) → ServiceResult<ChatMessageDto>
  GetSessionWithMessagesAsync(Guid sessionId) → ServiceResult<ChatSessionDetailDto>
  GetSessionsByProfileAsync(Guid profileId) → ServiceResult<List<ChatSessionDto>>
  UpdateSummaryAsync(Guid sessionId, string summary) → ServiceResult<ChatSessionDto>

─────────────────────────────────────────
AIRecommendationService  (stub architecture — no real AI API)
─────────────────────────────────────────
  AnalyzeSkillGapAsync(Guid profileId, Guid careerRoadmapId)
    → ServiceResult<SkillGapAnalysisDto>
    STUB: load profile skills + roadmap nodes → return placeholder gap analysis

  AnalyzeGitHubPortfolioAsync(Guid profileId)
    → ServiceResult<PortfolioAnalysisDto>
    STUB: load GitHubRepositories → return placeholder portfolio summary

  RecommendLearningResourcesAsync(Guid profileId, Guid nodeId)
    → ServiceResult<List<LearningResourceDto>>
    STUB: load LearningResources for node, prioritise IsFree = true

  GetTrendingSkillRecommendationsAsync(Guid profileId)
    → ServiceResult<List<string>>
    STUB: load top JobTrends by TrendScore, compare with profile SkillNames, return gaps

─────────────────────────────────────────
JobTrendService
─────────────────────────────────────────
  CreateAsync(CreateJobTrendDto dto) → ServiceResult<JobTrendDto>
  GetByRegionAsync(string region) → ServiceResult<List<JobTrendDto>>
  GetTopTrendingAsync(int count) → ServiceResult<List<JobTrendDto>>
  GetBySkillAsync(string techSkill) → ServiceResult<List<JobTrendDto>>
  GetBySnapshotDateAsync(DateTime date) → ServiceResult<List<JobTrendDto>>
  UpdateAsync(Guid id, UpdateJobTrendDto dto) → ServiceResult<JobTrendDto>
  DeleteAsync(Guid id) → ServiceResult<bool>

══════════════════════════════════════════
COMMON CLASSES (Business/Common/)
══════════════════════════════════════════

ServiceResult<T>:
  bool Success
  T? Data
  string? Error
  static ServiceResult<T> Ok(T data)
  static ServiceResult<T> Fail(string error)

PaginationRequest:   int PageNumber = 1, int PageSize = 10
PaginationResponse<T>: List<T> Items, int TotalCount, int PageNumber, int PageSize,
                        int TotalPages, bool HasNextPage, bool HasPreviousPage
FilterRequest:       string? SearchTerm, Dictionary<string, string>? Filters
SortRequest:         string? SortBy, bool Descending = false

Execution order in GetPagedAsync: Filter → Sort → Paginate

══════════════════════════════════════════
AUTOMAPPER — MappingProfile.cs
══════════════════════════════════════════

Entity → ResponseDto:
  User → UserDto  (include AvatarUrl, exclude PasswordHashed)
  Profile → ProfileDto
  Profile → ProfileWithSkillsDto  (includes List<SkillDto> Skills)
  Skill → SkillDto
  CareerRole → CareerRoleDto
  CareerRoadmap → CareerRoadmapDto
  CareerRoadmap → CareerRoadmapWithNodesDto  (includes List<NodeDto> Nodes)
  PersonalRoadmap → PersonalRoadmapDto
  PersonalRoadmap → PersonalRoadmapDetailDto  (includes List<NodeProgressDto>)
  Node → NodeDto
  Node → NodeHierarchyDto  (recursive — includes List<NodeHierarchyDto> Children)
  NodeProgress → NodeProgressDto  (includes NodeDto Node)
  LearningResource → LearningResourceDto  (ResourceType as plain string)
  GitHubRepository → GitHubRepositoryDto
  ChatSession → ChatSessionDto
  ChatSession → ChatSessionDetailDto  (includes List<ChatMessageDto>)
  ChatMessage → ChatMessageDto
  JobTrend → JobTrendDto

CreateDto → Entity:
  RegisterUserDto → User
  CreateCareerRoleDto → CareerRole
  CreateCareerRoadmapDto → CareerRoadmap
  CreateNodeDto → Node
  CreateLearningResourceDto → LearningResource
  AddSkillDto → Skill
  AddGitHubRepoDto → GitHubRepository
  CreateChatSessionDto → ChatSession
  SendMessageDto → ChatMessage
  CreateJobTrendDto → JobTrend

══════════════════════════════════════════
API LAYER — REST CONTROLLERS (Write ops only)
══════════════════════════════════════════

Controllers must:
- [ApiController] + [Route("api/[controller]")]
- Inject only the relevant Business interface
- Return IActionResult with correct HTTP status codes (200, 201, 400, 404, 500)
- Use [ProducesResponseType] attributes (NO XML comments)
- Contain ZERO business logic

AuthController:
  POST   /api/auth/register       → RegisterAsync
  POST   /api/auth/login          → LoginAsync
  POST   /api/auth/google         → GoogleLoginAsync

UsersController:
  PUT    /api/users/{id}          → UpdateAsync
  DELETE /api/users/{id}          → DeactivateAsync

ProfilesController:
  PUT    /api/profiles/{userId}   → UpdateAsync

SkillsController:
  POST   /api/skills              → AddSkillAsync
  DELETE /api/skills/{skillId}    → RemoveSkillAsync

CareerRolesController:
  POST   /api/career-roles        → CreateAsync
  PUT    /api/career-roles/{id}   → UpdateAsync
  DELETE /api/career-roles/{id}   → DeleteAsync

CareerRoadmapsController:
  POST   /api/career-roadmaps                           → CreateAsync
  PUT    /api/career-roadmaps/{id}                      → UpdateAsync
  DELETE /api/career-roadmaps/{id}                      → DeleteAsync
  POST   /api/career-roadmaps/{id}/nodes/{nodeId}       → AssignNodeAsync
  DELETE /api/career-roadmaps/{id}/nodes/{nodeId}       → RemoveNodeAsync

NodesController:
  POST   /api/nodes               → CreateAsync
  PUT    /api/nodes/{id}          → UpdateAsync
  DELETE /api/nodes/{id}          → DeleteAsync

LearningResourcesController:
  POST   /api/nodes/{nodeId}/learning-resources         → CreateAsync
  PUT    /api/learning-resources/{id}                   → UpdateAsync
  DELETE /api/learning-resources/{id}                   → DeleteAsync

PersonalRoadmapsController:
  POST   /api/personal-roadmaps/generate                → GenerateAsync
  DELETE /api/personal-roadmaps/{id}                    → DeleteAsync

NodeProgressController:
  PUT    /api/node-progress/{nodeProgressId}/status     → UpdateStatusAsync

GitHubRepositoriesController:
  POST   /api/github-repositories                       → AddAsync
  DELETE /api/github-repositories/{id}                  → RemoveAsync

ChatController:
  POST   /api/chat/sessions                             → CreateSessionAsync
  POST   /api/chat/sessions/{sessionId}/messages        → SendMessageAsync

JobTrendsController:
  POST   /api/job-trends          → CreateAsync
  PUT    /api/job-trends/{id}     → UpdateAsync
  DELETE /api/job-trends/{id}     → DeleteAsync

══════════════════════════════════════════
API LAYER — GRAPHQL (Read ops only — HotChocolate)
══════════════════════════════════════════

ALL read operations go through GraphQL.
Resolvers call Business layer services ONLY — never repositories or DbContext.
Register with AddGraphQLServer().
Support [UseFiltering], [UseSorting], [UsePaging].

Generate a single Query.cs with ALL resolvers:

  GetUserById(Guid id) → UserDto?
  GetUsers(PaginationRequest) → PaginationResponse<UserDto>

  GetProfileByUserId(Guid userId) → ProfileDto?
  GetProfileWithSkills(Guid userId) → ProfileWithSkillsDto?

  GetSkillsByProfile(Guid profileId) → List<SkillDto>

  GetCareerRoleById(Guid id) → CareerRoleDto?
  GetCareerRoles() → List<CareerRoleDto>

  GetCareerRoadmapById(Guid id) → CareerRoadmapDto?
  GetCareerRoadmapsByRole(Guid careerRoleId) → List<CareerRoadmapDto>
  GetCareerRoadmapWithNodes(Guid roadmapId) → CareerRoadmapWithNodesDto?

  GetPersonalRoadmapsByProfile(Guid profileId) → List<PersonalRoadmapDto>
  GetPersonalRoadmapWithProgress(Guid personalRoadmapId) → PersonalRoadmapDetailDto?

  GetNodeById(Guid id) → NodeDto?
  GetNodeChildren(Guid parentId) → List<NodeDto>
  GetNodeHierarchy(Guid rootId) → NodeHierarchyDto?

  GetNodeProgress(Guid personalRoadmapId) → List<NodeProgressDto>
  GetCompletedNodes(Guid personalRoadmapId) → List<NodeProgressDto>

  GetLearningResourcesByNode(Guid nodeId) → List<LearningResourceDto>
  GetFreeResourcesByNode(Guid nodeId) → List<LearningResourceDto>

  GetGitHubRepositoriesByProfile(Guid profileId) → List<GitHubRepositoryDto>

  GetChatSessionsByProfile(Guid profileId) → List<ChatSessionDto>
  GetChatSessionWithMessages(Guid sessionId) → ChatSessionDetailDto?

  GetJobTrendsByRegion(string region) → List<JobTrendDto>
  GetTopTrendingSkills(int count) → List<JobTrendDto>

  GetSkillGapAnalysis(Guid profileId, Guid careerRoadmapId) → SkillGapAnalysisDto
  GetPortfolioAnalysis(Guid profileId) → PortfolioAnalysisDto
  GetTrendingSkillRecommendations(Guid profileId) → List<string>
  GetRecommendedResources(Guid profileId, Guid nodeId) → List<LearningResourceDto>

Also generate ExampleQueries.graphql with one example query per resolver.

══════════════════════════════════════════
MIDDLEWARE
══════════════════════════════════════════

ExceptionHandlingMiddleware:
  — catch all unhandled exceptions
  — log full exception with Serilog (Log.Error)
  — return JSON ProblemDetails (RFC 7807) with status 500

RequestLoggingMiddleware:
  — log: HTTP method, path, query string, response status code, elapsed ms
  — use Serilog structured logging

PerformanceMonitoringMiddleware:
  — measure elapsed time per request
  — if elapsed > 500ms: Log.Warning with path and elapsed ms

══════════════════════════════════════════
DEPENDENCY INJECTION — ServiceCollectionExtensions.cs
══════════════════════════════════════════

Register (all Scoped unless noted):
  — AppDbContext with SQL Server connection string
  — IUnitOfWork → UnitOfWork
  — IPersonalRoadmapRepository, INodeProgressRepository, IChatRepository
  — IAuthService → AuthService
  — All Business service interfaces → implementations
  — AutoMapper (scan Business assembly)
  — JWT Bearer authentication:
      read Jwt:Secret, Jwt:Issuer, Jwt:Audience from appsettings.json
      configure AddAuthentication().AddJwtBearer(...)
  — HotChocolate GraphQL server with Query type, filtering, sorting, paging
  — Swagger/OpenAPI with JWT bearer security definition (no XML)
  — Serilog

══════════════════════════════════════════
PROGRAM.cs
══════════════════════════════════════════

Complete Program.cs:
  — Read config from appsettings.json
  — Call ServiceCollectionExtensions
  — Middleware pipeline order:
      1. ExceptionHandlingMiddleware
      2. RequestLoggingMiddleware
      3. PerformanceMonitoringMiddleware
      4. UseSwagger / UseSwaggerUI
      5. UseRouting
      6. UseAuthentication
      7. UseAuthorization
      8. MapControllers
      9. MapGraphQL

══════════════════════════════════════════
APPSETTINGS.json
══════════════════════════════════════════

Generate appsettings.json containing:
  ConnectionStrings:
    DefaultConnection: "<SQL Server connection string>"

  Jwt:
    Issuer: "CareerPlatform"
    Audience: "CareerPlatformUsers"
    Secret: "<minimum 32 character secret key>"
    ExpiryMinutes: 60

  Google:
    ClientId: "<your Google OAuth client ID>"

  Serilog:
    MinimumLevel: Information
    WriteTo:
      - Console
      - File (path: logs/app-.log, rollingInterval: Day, retainedFileCountLimit: 30)

══════════════════════════════════════════
SERILOG CONFIGURATION
══════════════════════════════════════════

Configure Serilog to write to:
  — Console (human-readable output template)
  — File: logs/app-.log (rolling daily, retain 30 days)

Read all config from appsettings.json Serilog section.

══════════════════════════════════════════
SWAGGER CONFIGURATION
══════════════════════════════════════════

  — Title: "Career Orientation Platform API"
  — Version: "v1"
  — NO XML comments
  — [ProducesResponseType] on all controller actions
  — Add JWT Bearer security definition so Swagger UI shows "Authorize" button
  — Group by controller tag
  — Swagger UI at /swagger

══════════════════════════════════════════
EF CORE MIGRATIONS
══════════════════════════════════════════

Generate the COMPLETE initial migration as a single file.

── File to generate ─────────────────────────────────────

DataAccess/Migrations/20250101000000_InitialCreate.cs
   — Full Migration class with Up() and Down() methods
   — Up() must create ALL tables in correct dependency order:
       JobTrend, User, Profile, CareerRole, CareerRoadmap,
       Node, RoadmapNode, PersonalRoadmap, NodeProgress,
       LearningResource, Skill, GitHubRepository,
       ChatSession, ChatMessage
   — Every table must include ALL columns with exact types, nullability,
     default values, and constraints as specified in the DATABASE DESIGN section
   — Every foreign key constraint must be declared explicitly
   — Self-referencing FK on Node (ParentNodeId → NodeId) must use
     .OnDelete(DeleteBehavior.Restrict) to avoid cascade cycles
   — All other FKs use .OnDelete(DeleteBehavior.Cascade) unless a cascade
     cycle would result (SQL Server will reject circular cascades — use
     Restrict/NoAction for those)
   — Down() must drop all tables in exact reverse order (children before parents)

The .Designer.cs file and AppDbContextModelSnapshot.cs are auto-generated by
EF Core tooling when running CLI commands and must NOT be written manually.
Only InitialCreate.cs is needed.

── Column type mapping rules ─────────────

  Guid          → uniqueidentifier
  string        → nvarchar(N) or nvarchar(max)
  int           → int
  bool          → bit
  decimal(5,2)  → decimal(5, 2)
  DateTime      → datetime2(7)
  nullable      → .IsRequired(false)
  non-nullable  → .IsRequired()

── Enum storage rules ─────────────────────

  UserRole (int)            → stored as int column
  NodeProgressStatus (int)  → stored as int column
  ResourceType              → stored as nvarchar(100) plain string — NOT an enum

── Soft delete filter ─────────────────────

  Every table has IsDeleted bit NOT NULL DEFAULT 0
  AppDbContext applies .HasQueryFilter(e => !e.IsDeleted) globally

── CLI commands ───────────────────────────

After generating the migration file, also output these exact CLI commands
the developer must run from the solution root:

  Step 1 — Install EF Core tools (if not already installed):
    dotnet tool install --global dotnet-ef

  Step 2 — Add the initial migration (skip if files above are already generated):
    dotnet ef migrations add InitialCreate \
      --project src/DataAccess \
      --startup-project src/API \
      --output-dir Migrations

  Step 3 — Apply the migration and create the database:
    dotnet ef database update \
      --project src/DataAccess \
      --startup-project src/API

  Step 4 — Verify the migration was applied:
    dotnet ef migrations list \
      --project src/DataAccess \
      --startup-project src/API

IMPORTANT:
  — Since the migration files are already generated above, the developer
    only needs to run Step 3 (database update) to apply them
  — The developer must ensure the connection string in appsettings.json
    points to a running SQL Server instance before running Step 3
  — The API project must reference the DataAccess project so EF tooling
    can resolve the DbContext via the startup project

══════════════════════════════════════════
REQUIRED NUGET PACKAGES
══════════════════════════════════════════

List all required NuGet packages with version guidance:
  — Microsoft.EntityFrameworkCore.SqlServer
  — Microsoft.EntityFrameworkCore.Tools
  — AutoMapper
  — Serilog.AspNetCore
  — Serilog.Sinks.File
  — Swashbuckle.AspNetCore
  — HotChocolate.AspNetCore
  — HotChocolate.Data
  — Microsoft.AspNetCore.Authentication.JwtBearer
  — System.IdentityModel.Tokens.Jwt
  — Google.Apis.Auth
  — BCrypt.Net-Next

══════════════════════════════════════════
COMPLETE END-TO-END WALKTHROUGH
══════════════════════════════════════════

Generate a fully detailed end-to-end walkthrough for:
"Google Login → Auto Profile Creation → Generate Personal Roadmap"

Include:
  1. GoogleLoginDto, AuthResponseDto
  2. IAuthService.GoogleLoginAsync signature
  3. AuthService.GoogleLoginAsync — full implementation (validate token, find-or-create user,
     auto-create Profile, generate JWT)
  4. AuthController POST /api/auth/google — thin controller action
  5. GeneratePersonalRoadmapRequest DTO
  6. PersonalRoadmapService.GenerateAsync — full implementation
  7. PersonalRoadmapsController POST /api/personal-roadmaps/generate
  8. GraphQL resolver: GetPersonalRoadmapWithProgress(Guid personalRoadmapId)
  9. Example GraphQL query string

══════════════════════════════════════════
SOLID PRINCIPLES — apply throughout
══════════════════════════════════════════

S — Single Responsibility: Controller calls service. Service calls repository. No mixing.
O — Open/Closed: Services depend on IUnitOfWork / IRepository<T> interfaces.
L — Liskov Substitution: All repositories honour IRepository<T> fully.
I — Interface Segregation: Small focused interfaces per domain (IAuthService, IUserService, etc.)
D — Dependency Inversion: API depends on Business interfaces. Business depends on IUnitOfWork.

══════════════════════════════════════════
FINAL ENGINEERING RULES
══════════════════════════════════════════

ALWAYS:
  — Generate every file completely — no stubs, no "// TODO", no "// implement here"
  — Use async/await on all data access and service methods
  — Use soft delete (IsDeleted = true, UpdatedAt = DateTime.Now) — never SQL DELETE
  — Use DateTime.Now everywhere — NEVER DateTime.UtcNow
  — Use Guid primary keys on all entities
  — Use AutoMapper in services — never map manually
  — Keep controllers thin (call service → check ServiceResult → return response)
  — Keep GraphQL resolvers thin (call service → return data)
  — Place ALL business logic inside Services
  — Use IUnitOfWork in services — never inject IRepository<T> directly into services
  — Apply global soft-delete query filter in AppDbContext
  — Store UserRole and NodeProgressStatus as INT in database
  — Store ResourceType as plain NVARCHAR string (not an enum)

NEVER:
  — Access DbContext outside DataAccess layer
  — Access repositories directly from Controllers or GraphQL resolvers
  — Place business logic in Controllers or GraphQL resolvers
  — Use MediatR, CQRS, Clean Architecture, Domain Events
  — Create NodeLearningResource entity or repository
  — Create a ResourceType enum
  — Use DateTime.UtcNow
  — Use hard DELETE in repositories
  — Store PasswordHashed for Google OAuth users (leave it null)

Generate all files now, one by one, complete and compilable.