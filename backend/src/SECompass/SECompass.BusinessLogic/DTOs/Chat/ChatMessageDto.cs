namespace SECompass.BusinessLogic.DTOs.Chat;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid ChatSessionId { get; set; }
    public string Sender { get; set; } = string.Empty;
    public string MessageContent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
