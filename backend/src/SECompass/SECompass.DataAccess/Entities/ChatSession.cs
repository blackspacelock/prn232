namespace SECompass.DataAccess.Entities;

public class ChatSession : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }

    public Profile Profile { get; set; } = null!;
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
