using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("ChatMessageId");
        builder.Property(m => m.ChatSessionId).IsRequired();
        builder.Property(m => m.Sender).IsRequired().HasMaxLength(100);
        builder.Property(m => m.MessageContent).IsRequired();
        builder.Property(m => m.CreatedAt).IsRequired();
        builder.Property(m => m.UpdatedAt).IsRequired(false);
        builder.Property(m => m.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasQueryFilter(m => !m.IsDeleted);

        builder.HasOne(m => m.ChatSession)
            .WithMany(s => s.ChatMessages)
            .HasForeignKey(m => m.ChatSessionId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
