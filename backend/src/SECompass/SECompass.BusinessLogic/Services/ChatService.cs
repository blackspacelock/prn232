using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Chat;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ChatService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<ChatSessionDto>> CreateSessionAsync(Guid profileId, CreateChatSessionDto dto)
    {
        var session = new ChatSession
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Title = dto.Title
        };
        await _uow.ChatSessions.AddAsync(session);
        await _uow.SaveChangesAsync();
        return ServiceResult<ChatSessionDto>.Ok(_mapper.Map<ChatSessionDto>(session));
    }

    public async Task<ServiceResult<ChatMessageDto>> SendMessageAsync(Guid sessionId, SendMessageDto dto)
    {
        var sessionExists = await _uow.ChatSessions.ExistsAsync(s => s.Id == sessionId);
        if (!sessionExists) return ServiceResult<ChatMessageDto>.Fail("Chat session not found.");

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatSessionId = sessionId,
            Sender = dto.Sender,
            MessageContent = dto.MessageContent
        };
        await _uow.ChatMessages.AddAsync(message);
        await _uow.SaveChangesAsync();
        return ServiceResult<ChatMessageDto>.Ok(_mapper.Map<ChatMessageDto>(message));
    }

    public async Task<ServiceResult<ChatSessionDetailDto>> GetSessionWithMessagesAsync(Guid sessionId)
    {
        var session = await _uow.Chat.GetSessionWithMessagesAsync(sessionId);
        if (session == null) return ServiceResult<ChatSessionDetailDto>.Fail("Chat session not found.");
        return ServiceResult<ChatSessionDetailDto>.Ok(_mapper.Map<ChatSessionDetailDto>(session));
    }

    public async Task<ServiceResult<List<ChatSessionDto>>> GetSessionsByProfileAsync(Guid profileId)
    {
        var sessions = await _uow.ChatSessions.FindAsync(s => s.ProfileId == profileId);
        return ServiceResult<List<ChatSessionDto>>.Ok(_mapper.Map<List<ChatSessionDto>>(sessions));
    }

    public async Task<ServiceResult<ChatSessionDto>> UpdateSummaryAsync(Guid sessionId, string summary)
    {
        var session = await _uow.ChatSessions.GetByIdAsync(sessionId);
        if (session == null) return ServiceResult<ChatSessionDto>.Fail("Chat session not found.");

        session.Summary = summary;
        _uow.ChatSessions.Update(session);
        await _uow.SaveChangesAsync();
        return ServiceResult<ChatSessionDto>.Ok(_mapper.Map<ChatSessionDto>(session));
    }
}
