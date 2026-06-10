using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.ToTable("Skills");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("SkillId");
        builder.Property(s => s.ProfileId).IsRequired();
        builder.Property(s => s.SkillName).IsRequired().HasMaxLength(255);
        builder.Property(s => s.Note).IsRequired(false);
        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt).IsRequired(false);
        builder.Property(s => s.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(s => !s.IsDeleted);

        builder.HasOne(s => s.Profile)
            .WithMany(p => p.Skills)
            .HasForeignKey(s => s.ProfileId)
            .HasPrincipalKey(p => p.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
