namespace SECompass.DataAccess.Entities;

public class ChatMessage : BaseAuditableEntity
{
    public Guid ChatSessionId { get; set; }
    public string Sender { get; set; } = string.Empty;
    public string MessageContent { get; set; } = string.Empty;

    public ChatSession ChatSession { get; set; } = null!;
}
