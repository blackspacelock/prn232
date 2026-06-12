using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class LearningResourceConfiguration : IEntityTypeConfiguration<LearningResource>
{
    public void Configure(EntityTypeBuilder<LearningResource> builder)
    {
        builder.ToTable("LearningResources");
        builder.HasKey(lr => lr.Id);
        builder.Property(lr => lr.Id).HasColumnName("LearningResourceId");
        builder.Property(lr => lr.NodeId).IsRequired();
        builder.Property(lr => lr.Name).IsRequired().HasMaxLength(255);
        builder.Property(lr => lr.ResourceUrl).IsRequired();
        builder.Property(lr => lr.ResourceType).IsRequired().HasMaxLength(100);
        builder.Property(lr => lr.Provider).IsRequired(false).HasMaxLength(255);
        builder.Property(lr => lr.IsFree).IsRequired().HasDefaultValue(true);
        builder.Property(lr => lr.CreatedAt).IsRequired();
        builder.Property(lr => lr.UpdatedAt).IsRequired(false);

        builder.HasOne(lr => lr.Node)
            .WithMany(n => n.LearningResources)
            .HasForeignKey(lr => lr.NodeId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
