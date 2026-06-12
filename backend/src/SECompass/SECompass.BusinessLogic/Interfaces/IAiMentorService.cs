using SECompass.BusinessLogic.DTOs.Chat;

namespace SECompass.BusinessLogic.Interfaces;

public interface IAiMentorService
{
    Task<string> GetMentorReplyAsync(IReadOnlyList<AiChatMessageDto> conversation, CancellationToken cancellationToken = default);
}
