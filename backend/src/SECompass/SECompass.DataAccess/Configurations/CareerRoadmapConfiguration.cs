using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class CareerRoadmapConfiguration : IEntityTypeConfiguration<CareerRoadmap>
{
    public void Configure(EntityTypeBuilder<CareerRoadmap> builder)
    {
        builder.ToTable("CareerRoadmaps");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("CareerRoadmapId");
        builder.Property(r => r.CareerRoleId).IsRequired();
        builder.Property(r => r.Name).IsRequired().HasMaxLength(255);
        builder.Property(r => r.Description).IsRequired(false);
        builder.Property(r => r.IsCustom).IsRequired().HasDefaultValue(false);
        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt).IsRequired(false);

        builder.HasOne(r => r.CareerRole)
            .WithMany(cr => cr.CareerRoadmaps)
            .HasForeignKey(r => r.CareerRoleId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
