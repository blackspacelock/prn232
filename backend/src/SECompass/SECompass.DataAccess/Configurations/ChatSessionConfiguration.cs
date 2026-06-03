using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
{
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.ToTable("ChatSessions");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("ChatSessionId");
        builder.Property(c => c.ProfileId).IsRequired();
        builder.Property(c => c.Title).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Summary).IsRequired(false);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired(false);
        builder.Property(c => c.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasOne(c => c.Profile)
            .WithMany(p => p.ChatSessions)
            .HasForeignKey(c => c.ProfileId)
            .HasPrincipalKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
