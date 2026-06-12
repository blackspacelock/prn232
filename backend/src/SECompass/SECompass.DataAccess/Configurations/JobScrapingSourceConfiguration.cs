using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class JobScrapingSourceConfiguration : IEntityTypeConfiguration<JobScrapingSource>
{
    private static readonly DateTime SeedCreatedAt = new(2026, 6, 12, 0, 0, 0, DateTimeKind.Unspecified);

    public void Configure(EntityTypeBuilder<JobScrapingSource> builder)
    {
        builder.ToTable("JobScrapingSources");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("JobScrapingSourceId");
        builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Region).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Enabled).IsRequired();
        builder.Property(s => s.Url).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.JobCardXPath).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.TitleXPath).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.TagsXPath).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.MaxPostings).IsRequired();
        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt).IsRequired(false);

        builder.HasData(
            new JobScrapingSource
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "LinkedIn",
                Region = "Global",
                Enabled = true,
                MaxPostings = 40,
                Url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software%20engineer&location=Vietnam&start=0",
                JobCardXPath = "//li[contains(@class,'jobs-search')] | //div[contains(@class,'job-search-card')]",
                TitleXPath = ".//h3 | .//*[contains(@class,'title')]",
                TagsXPath = ".//*[contains(@class,'metadata')] | .//*[contains(@class,'subtitle')]",
                CreatedAt = SeedCreatedAt
            },
            new JobScrapingSource
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "CareerLink",
                Region = "Vietnam",
                Enabled = true,
                MaxPostings = 40,
                Url = "https://www.careerlink.vn/viec-lam/cntt-phan-mem/19",
                JobCardXPath = "//li[contains(@class,'job-item')]",
                TitleXPath = ".//h5[contains(@class,'job-name')]",
                TagsXPath = ".//a[contains(@class,'job-position')]",
                CreatedAt = SeedCreatedAt
            }
        );
    }
}
