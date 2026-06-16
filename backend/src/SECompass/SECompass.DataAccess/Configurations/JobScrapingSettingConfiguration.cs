using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class JobScrapingSettingConfiguration : IEntityTypeConfiguration<JobScrapingSetting>
{
    public void Configure(EntityTypeBuilder<JobScrapingSetting> builder)
    {
        builder.ToTable("JobScrapingSettings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("JobScrapingSettingId");
        builder.Property(s => s.Enabled).IsRequired();
        builder.Property(s => s.Frequency).IsRequired().HasMaxLength(20);
        builder.Property(s => s.TimeOfDay).IsRequired().HasMaxLength(8);
        builder.Property(s => s.DayOfWeek).IsRequired().HasMaxLength(20);
        builder.Property(s => s.LastRunAt).IsRequired(false);
        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt).IsRequired(false);

        builder.HasData(new JobScrapingSetting
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            Enabled = true,
            Frequency = "Weekly",
            TimeOfDay = "00:00:00",
            DayOfWeek = "Sunday",
            CreatedAt = new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Unspecified)
        });
    }
}
