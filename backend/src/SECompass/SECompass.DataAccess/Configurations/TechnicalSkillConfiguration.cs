using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class TechnicalSkillConfiguration : IEntityTypeConfiguration<TechnicalSkill>
{
    public void Configure(EntityTypeBuilder<TechnicalSkill> builder)
    {
        builder.ToTable("TechnicalSkills");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("TechnicalSkillId");
        builder.Property(t => t.Name).IsRequired().HasMaxLength(255);
        builder.Property(t => t.Category).IsRequired().HasMaxLength(100);
        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.UpdatedAt).IsRequired(false);

        builder.HasIndex(t => t.Name).IsUnique();
    }
}
