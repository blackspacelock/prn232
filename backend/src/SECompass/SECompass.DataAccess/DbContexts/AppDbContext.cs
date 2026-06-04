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
}
