using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Enums;

namespace SECompass.DataAccess.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    private static readonly Guid AdminUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly DateTime SeedCreatedAt = new(2026, 6, 12, 0, 0, 0, DateTimeKind.Unspecified);

    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("UserId");
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(255);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.Property(u => u.PasswordHashed).IsRequired(false);
        builder.Property(u => u.Role).HasConversion<int>().IsRequired();
        builder.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(u => u.GoogleId).IsRequired(false).HasMaxLength(255);
        builder.Property(u => u.AvatarUrl).IsRequired(false);
        builder.Property(u => u.CreatedAt).IsRequired();
        builder.Property(u => u.UpdatedAt).IsRequired(false);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.GoogleId).IsUnique().HasFilter("[GoogleId] IS NOT NULL");

        builder.HasData(new User
        {
            Id = AdminUserId,
            FullName = "Admin Administrator",
            Email = "admin@secompass.com",
            PasswordHashed = "$2b$12$x60evDbGMbtCfCLsHPITg.F90EITs5NYkcp/zoKMuwzsZ3TRcqBHK",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = SeedCreatedAt
        });
    }
}
