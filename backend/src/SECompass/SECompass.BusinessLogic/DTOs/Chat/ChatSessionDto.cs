namespace SECompass.BusinessLogic.DTOs.Chat;

public class ChatSessionDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public DateTime CreatedAt { get; set; }
}
