using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class CareerRoleConfiguration : IEntityTypeConfiguration<CareerRole>
{
    public void Configure(EntityTypeBuilder<CareerRole> builder)
    {
        builder.ToTable("CareerRoles");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("CareerRoleId");
        builder.Property(r => r.Name).IsRequired().HasMaxLength(255);
        builder.Property(r => r.Description).IsRequired(false);
        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt).IsRequired(false);
    }
}
