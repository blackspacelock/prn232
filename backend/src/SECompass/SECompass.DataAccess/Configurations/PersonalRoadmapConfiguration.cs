using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class PersonalRoadmapConfiguration : IEntityTypeConfiguration<PersonalRoadmap>
{
    public void Configure(EntityTypeBuilder<PersonalRoadmap> builder)
    {
        builder.ToTable("PersonalRoadmaps");
        builder.HasKey(pr => pr.Id);
        builder.Property(pr => pr.Id).HasColumnName("PersonalRoadmapId");
        builder.Property(pr => pr.ProfileId).IsRequired();
        builder.Property(pr => pr.CareerRoadmapId).IsRequired();
        builder.Property(pr => pr.Note).IsRequired(false);
        builder.Property(pr => pr.ProgressPercentage).HasColumnType("decimal(5,2)").IsRequired().HasDefaultValue(0m);
        builder.Property(pr => pr.CreatedAt).IsRequired();
        builder.Property(pr => pr.UpdatedAt).IsRequired(false);

        builder.HasOne(pr => pr.Profile)
            .WithMany(p => p.PersonalRoadmaps)
            .HasForeignKey(pr => pr.ProfileId)
            .HasPrincipalKey(p => p.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasOne(pr => pr.CareerRoadmap)
            .WithMany(cr => cr.PersonalRoadmaps)
            .HasForeignKey(pr => pr.CareerRoadmapId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
