using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class PublicPortfolioConfiguration : IEntityTypeConfiguration<PublicPortfolio>
{
    public void Configure(EntityTypeBuilder<PublicPortfolio> builder)
    {
        builder.ToTable("PublicPortfolios");
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => p.ProfileId).IsUnique();

        builder.Property(p => p.Headline).HasMaxLength(160);
        builder.Property(p => p.PublicBio).HasMaxLength(2000);
        builder.Property(p => p.Location).HasMaxLength(120);
        builder.Property(p => p.WebsiteUrl).HasMaxLength(500);
        builder.Property(p => p.LinkedInUrl).HasMaxLength(500);
        builder.Property(p => p.ContactEmail).HasMaxLength(256);
        builder.Property(p => p.CachedPortfolioAnalysisJson).HasColumnType("nvarchar(max)");

        builder.HasOne(p => p.Profile)
            .WithOne(p => p.PublicPortfolio)
            .HasForeignKey<PublicPortfolio>(p => p.ProfileId)
            .HasPrincipalKey<Profile>(p => p.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
