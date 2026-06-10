using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class RoadmapNodeEdgeConfiguration : IEntityTypeConfiguration<RoadmapNodeEdge>
{
    public void Configure(EntityTypeBuilder<RoadmapNodeEdge> builder)
    {
        builder.ToTable("RoadmapNodeEdges");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("RoadmapNodeEdgeId");
        builder.Property(e => e.CareerRoadmapId).IsRequired();
        builder.Property(e => e.FromRoadmapNodeId).IsRequired();
        builder.Property(e => e.ToRoadmapNodeId).IsRequired();
        builder.Property(e => e.EdgeType).IsRequired().HasMaxLength(100).HasDefaultValue("Next");
        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt).IsRequired(false);
        builder.Property(e => e.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(e => !e.IsDeleted);
        builder.HasIndex(e => new { e.CareerRoadmapId, e.FromRoadmapNodeId, e.ToRoadmapNodeId, e.EdgeType })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasOne(e => e.CareerRoadmap)
            .WithMany(r => r.RoadmapNodeEdges)
            .HasForeignKey(e => e.CareerRoadmapId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.FromRoadmapNode)
            .WithMany(n => n.OutgoingEdges)
            .HasForeignKey(e => e.FromRoadmapNodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ToRoadmapNode)
            .WithMany(n => n.IncomingEdges)
            .HasForeignKey(e => e.ToRoadmapNodeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
