using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class NodeProgressConfiguration : IEntityTypeConfiguration<NodeProgress>
{
    public void Configure(EntityTypeBuilder<NodeProgress> builder)
    {
        builder.ToTable("NodeProgresses");
        builder.HasKey(np => np.Id);
        builder.Property(np => np.Id).HasColumnName("NodeProgressId");
        builder.Property(np => np.PersonalRoadmapId).IsRequired();
        builder.Property(np => np.RoadmapNodeId).IsRequired();
        builder.Property(np => np.Status).HasConversion<int>().IsRequired();
        builder.Property(np => np.Note).IsRequired(false);
        builder.Property(np => np.CreatedAt).IsRequired();
        builder.Property(np => np.UpdatedAt).IsRequired(false);
        builder.Property(np => np.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(np => !np.IsDeleted);
        builder.HasIndex(np => new { np.PersonalRoadmapId, np.RoadmapNodeId })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasOne(np => np.PersonalRoadmap)
            .WithMany(pr => pr.NodeProgresses)
            .HasForeignKey(np => np.PersonalRoadmapId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(np => np.RoadmapNode)
            .WithMany(rn => rn.NodeProgresses)
            .HasForeignKey(np => np.RoadmapNodeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
