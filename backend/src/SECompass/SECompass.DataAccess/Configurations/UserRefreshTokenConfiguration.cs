using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class UserRefreshTokenConfiguration : IEntityTypeConfiguration<UserRefreshToken>
{
    public void Configure(EntityTypeBuilder<UserRefreshToken> builder)
    {
        builder.ToTable("UserRefreshTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("UserRefreshTokenId");
        builder.Property(t => t.UserId).IsRequired();
        builder.Property(t => t.Token).IsRequired().HasMaxLength(512);
        builder.Property(t => t.ExpiresAt).IsRequired();
        builder.Property(t => t.IsRevoked).IsRequired().HasDefaultValue(false);
        builder.Property(t => t.RevokedAt).IsRequired(false);
        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.UpdatedAt).IsRequired(false);

        builder.HasIndex(t => t.Token).IsUnique();

        builder.HasOne(t => t.User)
            .WithMany(u => u.UserRefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
