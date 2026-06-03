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
        builder.Property(np => np.NodeId).IsRequired();
        builder.Property(np => np.Status).HasConversion<int>().IsRequired();
        builder.Property(np => np.Note).IsRequired(false);
        builder.Property(np => np.CreatedAt).IsRequired();
        builder.Property(np => np.UpdatedAt).IsRequired(false);
        builder.Property(np => np.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(np => !np.IsDeleted);

        builder.HasOne(np => np.PersonalRoadmap)
            .WithMany(pr => pr.NodeProgresses)
            .HasForeignKey(np => np.PersonalRoadmapId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(np => np.Node)
            .WithMany(n => n.NodeProgresses)
            .HasForeignKey(np => np.NodeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
