using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Repositories;

namespace SECompass.DataAccess.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    private IRepository<User>? _users;
    private IRepository<UserRefreshToken>? _userRefreshTokens;
    private IRepository<Profile>? _profiles;
    private IRepository<TechnicalSkill>? _technicalSkills;
    private IRepository<NodeTechnicalSkill>? _nodeTechnicalSkills;
    private IRepository<ProfileTechnicalSkill>? _profileTechnicalSkills;
    private IRepository<CareerRole>? _careerRoles;
    private IRepository<CareerRoadmap>? _careerRoadmaps;
    private IRepository<RoadmapNode>? _roadmapNodes;
    private IRepository<RoadmapNodeEdge>? _roadmapNodeEdges;
    private IRepository<Node>? _nodes;
    private IRepository<LearningResource>? _learningResources;
    private IRepository<GitHubRepository>? _gitHubRepositories;
    private IRepository<ChatSession>? _chatSessions;
    private IRepository<ChatMessage>? _chatMessages;
    private IRepository<JobTrend>? _jobTrends;
    private IPersonalRoadmapRepository? _personalRoadmaps;
    private INodeProgressRepository? _nodeProgresses;
    private IChatRepository? _chat;

    public UnitOfWork(AppDbContext context) => _context = context;

    public IRepository<User> Users => _users ??= new GenericRepository<User>(_context);
    public IRepository<UserRefreshToken> UserRefreshTokens => _userRefreshTokens ??= new GenericRepository<UserRefreshToken>(_context);
    public IRepository<Profile> Profiles => _profiles ??= new GenericRepository<Profile>(_context);
    public IRepository<TechnicalSkill> TechnicalSkills => _technicalSkills ??= new GenericRepository<TechnicalSkill>(_context);
    public IRepository<NodeTechnicalSkill> NodeTechnicalSkills => _nodeTechnicalSkills ??= new GenericRepository<NodeTechnicalSkill>(_context);
    public IRepository<ProfileTechnicalSkill> ProfileTechnicalSkills => _profileTechnicalSkills ??= new GenericRepository<ProfileTechnicalSkill>(_context);
    public IRepository<CareerRole> CareerRoles => _careerRoles ??= new GenericRepository<CareerRole>(_context);
    public IRepository<CareerRoadmap> CareerRoadmaps => _careerRoadmaps ??= new GenericRepository<CareerRoadmap>(_context);
    public IRepository<RoadmapNode> RoadmapNodes => _roadmapNodes ??= new GenericRepository<RoadmapNode>(_context);
    public IRepository<RoadmapNodeEdge> RoadmapNodeEdges => _roadmapNodeEdges ??= new GenericRepository<RoadmapNodeEdge>(_context);
    public IRepository<Node> Nodes => _nodes ??= new GenericRepository<Node>(_context);
    public IRepository<LearningResource> LearningResources => _learningResources ??= new GenericRepository<LearningResource>(_context);
    public IRepository<GitHubRepository> GitHubRepositories => _gitHubRepositories ??= new GenericRepository<GitHubRepository>(_context);
    public IRepository<ChatSession> ChatSessions => _chatSessions ??= new GenericRepository<ChatSession>(_context);
    public IRepository<ChatMessage> ChatMessages => _chatMessages ??= new GenericRepository<ChatMessage>(_context);
    public IRepository<JobTrend> JobTrends => _jobTrends ??= new GenericRepository<JobTrend>(_context);
    public IPersonalRoadmapRepository PersonalRoadmaps => _personalRoadmaps ??= new PersonalRoadmapRepository(_context);
    public INodeProgressRepository NodeProgresses => _nodeProgresses ??= new NodeProgressRepository(_context);
    public IChatRepository Chat => _chat ??= new ChatRepository(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}
