using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.DbContexts;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<UserRefreshToken> UserRefreshTokens { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<Skill> Skills { get; set; }
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await ApplySoftDeleteCascadeAsync(cancellationToken);

        var entries = ChangeTracker.Entries<BaseAuditableEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.Now;
                entry.Entity.IsDeleted = false;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.Now;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }

    private async Task ApplySoftDeleteCascadeAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.Now;
        var queue = new Queue<BaseAuditableEntity>();
        var queued = new HashSet<string>();

        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>().ToList())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.UpdatedAt = now;
            }

            if (entry.Entity.IsDeleted && entry.State is EntityState.Modified or EntityState.Added)
            {
                Enqueue(entry.Entity, queue, queued);
            }
        }

        while (queue.Count > 0)
        {
            var entity = queue.Dequeue();
            await SoftDeleteDependentsAsync(entity, queue, queued, now, cancellationToken);
        }
    }

    private async Task SoftDeleteDependentsAsync(
        BaseAuditableEntity entity,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        DateTime now,
        CancellationToken cancellationToken)
    {
        switch (entity)
        {
            case User user:
                await SoftDeleteRangeAsync(
                    UserRefreshTokens.IgnoreQueryFilters().Where(t => t.UserId == user.Id && !t.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    Profiles.IgnoreQueryFilters().Where(p => p.UserId == user.Id && !p.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case Profile profile:
                await SoftDeleteRangeAsync(
                    Skills.IgnoreQueryFilters().Where(s => s.ProfileId == profile.UserId && !s.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    GitHubRepositories.IgnoreQueryFilters().Where(r => r.ProfileId == profile.UserId && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    ChatSessions.IgnoreQueryFilters().Where(s => s.ProfileId == profile.UserId && !s.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    PersonalRoadmaps.IgnoreQueryFilters().Where(r => r.ProfileId == profile.UserId && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case ChatSession chatSession:
                await SoftDeleteRangeAsync(
                    ChatMessages.IgnoreQueryFilters().Where(m => m.ChatSessionId == chatSession.Id && !m.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case CareerRole careerRole:
                await SoftDeleteRangeAsync(
                    CareerRoadmaps.IgnoreQueryFilters().Where(r => r.CareerRoleId == careerRole.Id && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case CareerRoadmap careerRoadmap:
                await SoftDeleteRangeAsync(
                    RoadmapNodeEdges.IgnoreQueryFilters().Where(e => e.CareerRoadmapId == careerRoadmap.Id && !e.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(n => n.CareerRoadmapId == careerRoadmap.Id && !n.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    PersonalRoadmaps.IgnoreQueryFilters().Where(r => r.CareerRoadmapId == careerRoadmap.Id && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case PersonalRoadmap personalRoadmap:
                await SoftDeleteRangeAsync(
                    NodeProgresses.IgnoreQueryFilters().Where(p => p.PersonalRoadmapId == personalRoadmap.Id && !p.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case Node node:
                await SoftDeleteRangeAsync(
                    Nodes.IgnoreQueryFilters().Where(n => n.ParentNodeId == node.Id && !n.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    LearningResources.IgnoreQueryFilters().Where(r => r.NodeId == node.Id && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(r => r.NodeId == node.Id && !r.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case RoadmapNode roadmapNode:
                await SoftDeleteRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(n => n.ParentRoadmapNodeId == roadmapNode.Id && !n.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    RoadmapNodeEdges.IgnoreQueryFilters().Where(e =>
                        (e.FromRoadmapNodeId == roadmapNode.Id || e.ToRoadmapNodeId == roadmapNode.Id) && !e.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await SoftDeleteRangeAsync(
                    NodeProgresses.IgnoreQueryFilters().Where(p => p.RoadmapNodeId == roadmapNode.Id && !p.IsDeleted),
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;
        }
    }

    private void Enqueue(BaseAuditableEntity entity, Queue<BaseAuditableEntity> queue, HashSet<string> queued)
    {
        if (queued.Add(GetSoftDeleteKey(entity)))
        {
            queue.Enqueue(entity);
        }
    }

    private async Task SoftDeleteRangeAsync<T>(
        IQueryable<T> query,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        DateTime now,
        CancellationToken cancellationToken) where T : BaseAuditableEntity
    {
        var dependents = await query.ToListAsync(cancellationToken);
        foreach (var dependent in dependents)
        {
            dependent.IsDeleted = true;
            dependent.UpdatedAt = now;
            Entry(dependent).State = EntityState.Modified;
            Enqueue(dependent, queue, queued);
        }
    }

    private static string GetSoftDeleteKey(BaseAuditableEntity entity)
        => entity is Profile profile
            ? $"{entity.GetType().Name}:{profile.UserId}"
            : $"{entity.GetType().Name}:{entity.Id}";
}
