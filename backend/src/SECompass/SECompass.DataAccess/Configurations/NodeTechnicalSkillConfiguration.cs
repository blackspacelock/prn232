using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class NodeTechnicalSkillConfiguration : IEntityTypeConfiguration<NodeTechnicalSkill>
{
    public void Configure(EntityTypeBuilder<NodeTechnicalSkill> builder)
    {
        builder.ToTable("NodeTechnicalSkills");
        builder.HasKey(nts => nts.Id);
        builder.Property(nts => nts.Id).HasColumnName("NodeTechnicalSkillId");
        builder.Property(nts => nts.NodeId).IsRequired();
        builder.Property(nts => nts.TechnicalSkillId).IsRequired();
        builder.Property(nts => nts.CreatedAt).IsRequired();
        builder.Property(nts => nts.UpdatedAt).IsRequired(false);

        builder.HasOne(nts => nts.Node)
            .WithMany(n => n.NodeTechnicalSkills)
            .HasForeignKey(nts => nts.NodeId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasOne(nts => nts.TechnicalSkill)
            .WithMany(t => t.NodeTechnicalSkills)
            .HasForeignKey(nts => nts.TechnicalSkillId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasIndex(nts => new { nts.NodeId, nts.TechnicalSkillId }).IsUnique();
    }
}
