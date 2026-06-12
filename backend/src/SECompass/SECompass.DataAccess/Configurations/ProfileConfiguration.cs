using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    private static readonly Guid AdminUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly DateTime SeedCreatedAt = new(2026, 6, 12, 0, 0, 0, DateTimeKind.Unspecified);

    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("Profiles");
        builder.HasKey(p => p.UserId);
        builder.Ignore(p => p.Id);
        builder.Property(p => p.BioDescription).IsRequired(false);
        builder.Property(p => p.PhoneNumber).IsRequired(false);
        builder.Property(p => p.University).IsRequired(false).HasMaxLength(255);
        builder.Property(p => p.Major).IsRequired(false).HasMaxLength(255);
        builder.Property(p => p.StudiedYear).IsRequired(false);
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired(false);

        builder.HasOne(p => p.User)
            .WithOne(u => u.Profile)
            .HasForeignKey<Profile>(p => p.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasData(new Profile
        {
            UserId = AdminUserId,
            CreatedAt = SeedCreatedAt
        });
    }
}
