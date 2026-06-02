using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class RoadmapNodeConfiguration : IEntityTypeConfiguration<RoadmapNode>
{
    public void Configure(EntityTypeBuilder<RoadmapNode> builder)
    {
        builder.ToTable("RoadmapNodes");
        builder.HasKey(rn => rn.Id);
        builder.Property(rn => rn.Id).HasColumnName("RoadmapNodeId");
        builder.Property(rn => rn.CareerRoadmapId).IsRequired();
        builder.Property(rn => rn.NodeId).IsRequired();
        builder.Property(rn => rn.CreatedAt).IsRequired();
        builder.Property(rn => rn.UpdatedAt).IsRequired(false);
        builder.Property(rn => rn.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(rn => !rn.IsDeleted);

        builder.HasOne(rn => rn.CareerRoadmap)
            .WithMany(cr => cr.RoadmapNodes)
            .HasForeignKey(rn => rn.CareerRoadmapId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rn => rn.Node)
            .WithMany(n => n.RoadmapNodes)
            .HasForeignKey(rn => rn.NodeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
