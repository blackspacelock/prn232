using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class JobTrendConfiguration : IEntityTypeConfiguration<JobTrend>
{
    public void Configure(EntityTypeBuilder<JobTrend> builder)
    {
        builder.ToTable("JobTrends");
        builder.HasKey(jt => jt.Id);
        builder.Property(jt => jt.Id).HasColumnName("JobTrendId");
        builder.Property(jt => jt.TechSkill).IsRequired().HasMaxLength(255);
        builder.Property(jt => jt.Description).IsRequired(false);
        builder.Property(jt => jt.Source).IsRequired(false).HasMaxLength(255);
        builder.Property(jt => jt.Region).IsRequired(false).HasMaxLength(255);
        builder.Property(jt => jt.TrendScore).IsRequired();
        builder.Property(jt => jt.SnapshotDate).IsRequired();
        builder.Property(jt => jt.CreatedAt).IsRequired();
        builder.Property(jt => jt.UpdatedAt).IsRequired(false);
        builder.Property(jt => jt.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(jt => !jt.IsDeleted);
    }
}
