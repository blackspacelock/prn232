using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class GitHubRepositoryConfiguration : IEntityTypeConfiguration<GitHubRepository>
{
    public void Configure(EntityTypeBuilder<GitHubRepository> builder)
    {
        builder.ToTable("GitHubRepositories");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("GithubRepositoryId");
        builder.Property(g => g.ProfileId).IsRequired();
        builder.Property(g => g.RepositoryName).IsRequired().HasMaxLength(255);
        builder.Property(g => g.RepoUrl).IsRequired();
        builder.Property(g => g.Description).IsRequired(false);
        builder.Property(g => g.IsPrivate).IsRequired().HasDefaultValue(false);
        builder.Property(g => g.CreatedAt).IsRequired();
        builder.Property(g => g.UpdatedAt).IsRequired(false);
        builder.Property(g => g.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(g => !g.IsDeleted);

        builder.HasOne(g => g.Profile)
            .WithMany(p => p.GitHubRepositories)
            .HasForeignKey(g => g.ProfileId)
            .HasPrincipalKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
