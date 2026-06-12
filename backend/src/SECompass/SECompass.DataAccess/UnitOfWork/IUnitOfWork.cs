using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Repositories;

namespace SECompass.DataAccess.UnitOfWork;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<UserRefreshToken> UserRefreshTokens { get; }
    IRepository<Profile> Profiles { get; }
    IRepository<TechnicalSkill> TechnicalSkills { get; }
    IRepository<NodeTechnicalSkill> NodeTechnicalSkills { get; }
    IRepository<ProfileTechnicalSkill> ProfileTechnicalSkills { get; }
    IRepository<CareerRole> CareerRoles { get; }
    IRepository<CareerRoadmap> CareerRoadmaps { get; }
    IRepository<RoadmapNode> RoadmapNodes { get; }
    IRepository<RoadmapNodeEdge> RoadmapNodeEdges { get; }
    IRepository<Node> Nodes { get; }
    IRepository<LearningResource> LearningResources { get; }
    IRepository<GitHubRepository> GitHubRepositories { get; }
    IRepository<ChatSession> ChatSessions { get; }
    IRepository<ChatMessage> ChatMessages { get; }
    IRepository<JobTrend> JobTrends { get; }
    IPersonalRoadmapRepository PersonalRoadmaps { get; }
    INodeProgressRepository NodeProgresses { get; }
    IChatRepository Chat { get; }
    Task<int> SaveChangesAsync();
}
