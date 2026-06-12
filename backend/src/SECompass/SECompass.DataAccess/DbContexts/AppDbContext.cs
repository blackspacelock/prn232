using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.DbContexts;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<UserRefreshToken> UserRefreshTokens { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<TechnicalSkill> TechnicalSkills { get; set; }
    public DbSet<NodeTechnicalSkill> NodeTechnicalSkills { get; set; }
    public DbSet<ProfileTechnicalSkill> ProfileTechnicalSkills { get; set; }
    public DbSet<GitHubRepository> GitHubRepositories { get; set; }
    public DbSet<ChatSession> ChatSessions { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<CareerRole> CareerRoles { get; set; }
    public DbSet<CareerRoadmap> CareerRoadmaps { get; set; }
    public DbSet<Node> Nodes { get; set; }
    public DbSet<RoadmapNode> RoadmapNodes { get; set; }
    public DbSet<RoadmapNodeEdge> RoadmapNodeEdges { get; set; }
    public DbSet<PersonalRoadmap> PersonalRoadmaps { get; set; }
    public DbSet<NodeProgress> NodeProgresses { get; set; }
    public DbSet<LearningResource> LearningResources { get; set; }
    public DbSet<JobTrend> JobTrends { get; set; }
    public DbSet<JobScrapingSetting> JobScrapingSettings { get; set; }
    public DbSet<JobScrapingSource> JobScrapingSources { get; set; }

    public void Delete(BaseAuditableEntity entity)
    {
        Entry(entity).State = EntityState.Deleted;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await ApplyDeleteCascadeAsync(cancellationToken);

        var entries = ChangeTracker.Entries<BaseAuditableEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.Now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.Now;
            }
        }
        var result = await base.SaveChangesAsync(cancellationToken);
        return result;
    }

    private async Task ApplyDeleteCascadeAsync(CancellationToken cancellationToken)
    {
        var deleteQueue = new Queue<BaseAuditableEntity>();
        var deleteQueued = new HashSet<string>();

        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>().ToList())
        {
            if (entry.State == EntityState.Deleted)
            {
                Enqueue(entry.Entity, deleteQueue, deleteQueued);
            }
        }

        while (deleteQueue.Count > 0)
        {
            var entity = deleteQueue.Dequeue();
            await CascadeDependentsAsync(entity, deleteQueue, deleteQueued, cancellationToken);
        }
    }

    private async Task CascadeDependentsAsync(
        BaseAuditableEntity entity,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        CancellationToken cancellationToken)
    {
        switch (entity)
        {
            case User user:
                await CascadeRangeAsync(
                    UserRefreshTokens.Where(t => t.UserId == user.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    Profiles.Where(p => p.UserId == user.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case Profile profile:
                await CascadeRangeAsync(
                    ProfileTechnicalSkills.Where(s => s.ProfileId == profile.UserId),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    GitHubRepositories.Where(r => r.ProfileId == profile.UserId),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    ChatSessions.Where(s => s.ProfileId == profile.UserId),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    PersonalRoadmaps.Where(r => r.ProfileId == profile.UserId),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case ChatSession chatSession:
                await CascadeRangeAsync(
                    ChatMessages.Where(m => m.ChatSessionId == chatSession.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case CareerRole careerRole:
                await CascadeRangeAsync(
                    CareerRoadmaps.Where(r => r.CareerRoleId == careerRole.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case CareerRoadmap careerRoadmap:
                await CascadeRangeAsync(
                    RoadmapNodeEdges.Where(e => e.CareerRoadmapId == careerRoadmap.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodes.Where(n => n.CareerRoadmapId == careerRoadmap.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    PersonalRoadmaps.Where(r => r.CareerRoadmapId == careerRoadmap.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case PersonalRoadmap personalRoadmap:
                await CascadeRangeAsync(
                    NodeProgresses.Where(p => p.PersonalRoadmapId == personalRoadmap.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case Node node:
                await CascadeRangeAsync(
                    Nodes.Where(n => n.ParentNodeId == node.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    LearningResources.Where(r => r.NodeId == node.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodes.Where(r => r.NodeId == node.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    NodeTechnicalSkills.Where(nts => nts.NodeId == node.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case TechnicalSkill technicalSkill:
                await CascadeRangeAsync(
                    NodeTechnicalSkills.Where(nts => nts.TechnicalSkillId == technicalSkill.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    ProfileTechnicalSkills.Where(pts => pts.TechnicalSkillId == technicalSkill.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;

            case RoadmapNode roadmapNode:
                await CascadeRangeAsync(
                    RoadmapNodes.Where(n => n.ParentRoadmapNodeId == roadmapNode.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodeEdges.Where(e =>
                        e.FromRoadmapNodeId == roadmapNode.Id || e.ToRoadmapNodeId == roadmapNode.Id),
                    queue,
                    queued,
                    cancellationToken);
                await CascadeRangeAsync(
                    NodeProgresses.Where(p => p.RoadmapNodeId == roadmapNode.Id),
                    queue,
                    queued,
                    cancellationToken);
                break;
        }
    }

    private void Enqueue(BaseAuditableEntity entity, Queue<BaseAuditableEntity> queue, HashSet<string> queued)
    {
        if (queued.Add(GetEntityKey(entity)))
        {
            queue.Enqueue(entity);
        }
    }

    private async Task CascadeRangeAsync<T>(
        IQueryable<T> query,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        CancellationToken cancellationToken) where T : BaseAuditableEntity
    {
        var dependents = await query.ToListAsync(cancellationToken);
        foreach (var dependent in dependents)
        {
            Entry(dependent).State = EntityState.Deleted;
            Enqueue(dependent, queue, queued);
        }
    }

    private static string GetEntityKey(BaseAuditableEntity entity)
        => entity is Profile profile
            ? $"{entity.GetType().Name}:{profile.UserId}"
            : $"{entity.GetType().Name}:{entity.Id}";
}
