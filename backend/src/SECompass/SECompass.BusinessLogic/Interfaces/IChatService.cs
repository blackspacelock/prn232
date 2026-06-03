using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Chat;

namespace SECompass.BusinessLogic.Interfaces;

public interface IChatService
{
    Task<ServiceResult<ChatSessionDto>> CreateSessionAsync(Guid profileId, CreateChatSessionDto dto);
    Task<ServiceResult<ChatMessageDto>> SendMessageAsync(Guid sessionId, SendMessageDto dto);
    Task<ServiceResult<ChatSessionDetailDto>> GetSessionWithMessagesAsync(Guid sessionId);
    Task<ServiceResult<List<ChatSessionDto>>> GetSessionsByProfileAsync(Guid profileId);
    Task<ServiceResult<ChatSessionDto>> UpdateSummaryAsync(Guid sessionId, string summary);
}
