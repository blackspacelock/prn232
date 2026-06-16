using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class ProfileTechnicalSkillConfiguration : IEntityTypeConfiguration<ProfileTechnicalSkill>
{
    public void Configure(EntityTypeBuilder<ProfileTechnicalSkill> builder)
    {
        builder.ToTable("ProfileTechnicalSkills");
        builder.HasKey(pts => pts.Id);
        builder.Property(pts => pts.Id).HasColumnName("ProfileTechnicalSkillId");
        builder.Property(pts => pts.ProfileId).IsRequired();
        builder.Property(pts => pts.TechnicalSkillId).IsRequired();
        builder.Property(pts => pts.Note).IsRequired(false);
        builder.Property(pts => pts.CreatedAt).IsRequired();
        builder.Property(pts => pts.UpdatedAt).IsRequired(false);

        builder.HasOne(pts => pts.Profile)
            .WithMany(p => p.ProfileTechnicalSkills)
            .HasForeignKey(pts => pts.ProfileId)
            .HasPrincipalKey(p => p.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasOne(pts => pts.TechnicalSkill)
            .WithMany(t => t.ProfileTechnicalSkills)
            .HasForeignKey(pts => pts.TechnicalSkillId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasIndex(pts => new { pts.ProfileId, pts.TechnicalSkillId }).IsUnique();
    }
}
