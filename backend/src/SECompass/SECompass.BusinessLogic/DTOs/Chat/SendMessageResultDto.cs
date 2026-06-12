namespace SECompass.BusinessLogic.DTOs.Chat;

public class SendMessageResultDto
{
    public ChatMessageDto UserMessage { get; set; } = null!;
    public ChatMessageDto AssistantMessage { get; set; } = null!;
}
