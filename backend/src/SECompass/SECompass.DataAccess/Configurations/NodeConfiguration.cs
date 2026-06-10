using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class NodeConfiguration : IEntityTypeConfiguration<Node>
{
    public void Configure(EntityTypeBuilder<Node> builder)
    {
        builder.ToTable("Nodes");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasColumnName("NodeId");
        builder.Property(n => n.ParentNodeId).IsRequired(false);
        builder.Property(n => n.Name).IsRequired().HasMaxLength(255);
        builder.Property(n => n.Description).IsRequired(false);
        builder.Property(n => n.Order).IsRequired().HasDefaultValue(0);
        builder.Property(n => n.CreatedAt).IsRequired();
        builder.Property(n => n.UpdatedAt).IsRequired(false);
        builder.Property(n => n.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(n => !n.IsDeleted);

        builder.HasOne(n => n.ParentNode)
            .WithMany(n => n.Children)
            .HasForeignKey(n => n.ParentNodeId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
