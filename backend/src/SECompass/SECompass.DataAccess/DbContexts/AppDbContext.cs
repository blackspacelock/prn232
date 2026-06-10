using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.DbContexts;

public class AppDbContext : DbContext
{
    private readonly HashSet<string> _physicalDeleteKeys = new();

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

    public void Delete(BaseAuditableEntity entity)
    {
        _physicalDeleteKeys.Add(GetEntityKey(entity));
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
                entry.Entity.IsDeleted = false;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.Now;
            }
        }
        var result = await base.SaveChangesAsync(cancellationToken);
        _physicalDeleteKeys.Clear();
        return result;
    }

    private async Task ApplyDeleteCascadeAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.Now;
        var softDeleteQueue = new Queue<BaseAuditableEntity>();
        var physicalDeleteQueue = new Queue<BaseAuditableEntity>();
        var softDeleteQueued = new HashSet<string>();
        var physicalDeleteQueued = new HashSet<string>();

        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>().ToList())
        {
            if (entry.State == EntityState.Deleted)
            {
                if (_physicalDeleteKeys.Contains(GetEntityKey(entry.Entity)))
                {
                    Enqueue(entry.Entity, physicalDeleteQueue, physicalDeleteQueued);
                    continue;
                }

                MarkSoftDeleted(entry.Entity, now);
            }

            if (entry.Entity.IsDeleted && entry.State is EntityState.Modified or EntityState.Added)
            {
                Enqueue(entry.Entity, softDeleteQueue, softDeleteQueued);
            }
        }

        while (softDeleteQueue.Count > 0)
        {
            var entity = softDeleteQueue.Dequeue();
            await CascadeDependentsAsync(entity, physicalDelete: false, softDeleteQueue, softDeleteQueued, now, cancellationToken);
        }

        while (physicalDeleteQueue.Count > 0)
        {
            var entity = physicalDeleteQueue.Dequeue();
            await CascadeDependentsAsync(entity, physicalDelete: true, physicalDeleteQueue, physicalDeleteQueued, now, cancellationToken);
        }
    }

    private async Task CascadeDependentsAsync(
        BaseAuditableEntity entity,
        bool physicalDelete,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        DateTime now,
        CancellationToken cancellationToken)
    {
        switch (entity)
        {
            case User user:
                await CascadeRangeAsync(
                    UserRefreshTokens.IgnoreQueryFilters().Where(t => t.UserId == user.Id && (physicalDelete || !t.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    Profiles.IgnoreQueryFilters().Where(p => p.UserId == user.Id && (physicalDelete || !p.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case Profile profile:
                await CascadeRangeAsync(
                    Skills.IgnoreQueryFilters().Where(s => s.ProfileId == profile.UserId && (physicalDelete || !s.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    GitHubRepositories.IgnoreQueryFilters().Where(r => r.ProfileId == profile.UserId && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    ChatSessions.IgnoreQueryFilters().Where(s => s.ProfileId == profile.UserId && (physicalDelete || !s.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    PersonalRoadmaps.IgnoreQueryFilters().Where(r => r.ProfileId == profile.UserId && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case ChatSession chatSession:
                await CascadeRangeAsync(
                    ChatMessages.IgnoreQueryFilters().Where(m => m.ChatSessionId == chatSession.Id && (physicalDelete || !m.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case CareerRole careerRole:
                await CascadeRangeAsync(
                    CareerRoadmaps.IgnoreQueryFilters().Where(r => r.CareerRoleId == careerRole.Id && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case CareerRoadmap careerRoadmap:
                await CascadeRangeAsync(
                    RoadmapNodeEdges.IgnoreQueryFilters().Where(e => e.CareerRoadmapId == careerRoadmap.Id && (physicalDelete || !e.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(n => n.CareerRoadmapId == careerRoadmap.Id && (physicalDelete || !n.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    PersonalRoadmaps.IgnoreQueryFilters().Where(r => r.CareerRoadmapId == careerRoadmap.Id && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case PersonalRoadmap personalRoadmap:
                await CascadeRangeAsync(
                    NodeProgresses.IgnoreQueryFilters().Where(p => p.PersonalRoadmapId == personalRoadmap.Id && (physicalDelete || !p.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case Node node:
                await CascadeRangeAsync(
                    Nodes.IgnoreQueryFilters().Where(n => n.ParentNodeId == node.Id && (physicalDelete || !n.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    LearningResources.IgnoreQueryFilters().Where(r => r.NodeId == node.Id && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(r => r.NodeId == node.Id && (physicalDelete || !r.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                break;

            case RoadmapNode roadmapNode:
                await CascadeRangeAsync(
                    RoadmapNodes.IgnoreQueryFilters().Where(n => n.ParentRoadmapNodeId == roadmapNode.Id && (physicalDelete || !n.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    RoadmapNodeEdges.IgnoreQueryFilters().Where(e =>
                        (e.FromRoadmapNodeId == roadmapNode.Id || e.ToRoadmapNodeId == roadmapNode.Id) && (physicalDelete || !e.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
                    cancellationToken);
                await CascadeRangeAsync(
                    NodeProgresses.IgnoreQueryFilters().Where(p => p.RoadmapNodeId == roadmapNode.Id && (physicalDelete || !p.IsDeleted)),
                    physicalDelete,
                    queue,
                    queued,
                    now,
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
        bool physicalDelete,
        Queue<BaseAuditableEntity> queue,
        HashSet<string> queued,
        DateTime now,
        CancellationToken cancellationToken) where T : BaseAuditableEntity
    {
        var dependents = await query.ToListAsync(cancellationToken);
        foreach (var dependent in dependents)
        {
            if (physicalDelete)
            {
                Entry(dependent).State = EntityState.Deleted;
            }
            else
            {
                MarkSoftDeleted(dependent, now);
            }

            Enqueue(dependent, queue, queued);
        }
    }

    private void MarkSoftDeleted(BaseAuditableEntity entity, DateTime now)
    {
        entity.IsDeleted = true;
        entity.UpdatedAt = now;
        Entry(entity).State = EntityState.Modified;
    }

    private static string GetEntityKey(BaseAuditableEntity entity)
        => entity is Profile profile
            ? $"{entity.GetType().Name}:{profile.UserId}"
            : $"{entity.GetType().Name}:{entity.Id}";
}
