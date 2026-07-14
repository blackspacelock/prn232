using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class RoadmapTagConfiguration : IEntityTypeConfiguration<RoadmapTag>
{
    public void Configure(EntityTypeBuilder<RoadmapTag> builder)
    {
        builder.ToTable("RoadmapTags");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("RoadmapTagId");
        builder.Property(t => t.PersonalRoadmapId).IsRequired();
        builder.Property(t => t.Name).IsRequired().HasMaxLength(100);
        builder.Property(t => t.Color).IsRequired(false).HasMaxLength(50);
        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.UpdatedAt).IsRequired(false);

        builder.HasOne(t => t.PersonalRoadmap)
            .WithMany(pr => pr.Tags)
            .HasForeignKey(t => t.PersonalRoadmapId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasIndex(t => new { t.PersonalRoadmapId, t.Name }).IsUnique();
    }
}
