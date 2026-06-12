using System.Text;
using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Chat;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class ChatService : IChatService
{
    private const int MaxHistoryMessages = 20;
    private const string AssistantSender = "Assistant";

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAiMentorService _aiMentorService;

    public ChatService(IUnitOfWork uow, IMapper mapper, IAiMentorService aiMentorService)
    {
        _uow = uow;
        _mapper = mapper;
        _aiMentorService = aiMentorService;
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

    public async Task<ServiceResult<SendMessageResultDto>> SendMessageAsync(Guid sessionId, SendMessageDto dto, CancellationToken cancellationToken = default)
    {
        var session = await _uow.Chat.GetSessionWithMessagesAsync(sessionId);
        if (session == null) return ServiceResult<SendMessageResultDto>.Fail("Chat session not found.");

        var userMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatSessionId = sessionId,
            Sender = dto.Sender,
            MessageContent = dto.MessageContent
        };
        await _uow.ChatMessages.AddAsync(userMessage);
        await _uow.SaveChangesAsync();

        var profile = (await _uow.Profiles.FindAsync(p => p.UserId == session.ProfileId)).FirstOrDefault();
        var skills = (await _uow.Skills.FindAsync(s => s.ProfileId == session.ProfileId)).ToList();

        var conversation = BuildConversation(profile, skills, session.ChatMessages, userMessage);
        var replyContent = await _aiMentorService.GetMentorReplyAsync(conversation, cancellationToken);

        var assistantMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatSessionId = sessionId,
            Sender = AssistantSender,
            MessageContent = replyContent
        };
        await _uow.ChatMessages.AddAsync(assistantMessage);
        await _uow.SaveChangesAsync();

        return ServiceResult<SendMessageResultDto>.Ok(new SendMessageResultDto
        {
            UserMessage = _mapper.Map<ChatMessageDto>(userMessage),
            AssistantMessage = _mapper.Map<ChatMessageDto>(assistantMessage)
        });
    }

    private static List<AiChatMessageDto> BuildConversation(DataAccess.Entities.Profile? profile, List<Skill> skills, IEnumerable<ChatMessage> priorMessages, ChatMessage newUserMessage)
    {
        var conversation = new List<AiChatMessageDto>
        {
            new() { Role = "system", Content = BuildSystemPrompt(profile, skills) }
        };

        var history = priorMessages
            .OrderBy(m => m.CreatedAt)
            .Append(newUserMessage)
            .TakeLast(MaxHistoryMessages)
            .Select(m => new AiChatMessageDto
            {
                Role = string.Equals(m.Sender, AssistantSender, StringComparison.OrdinalIgnoreCase) ? "assistant" : "user",
                Content = m.MessageContent
            });

        conversation.AddRange(history);
        return conversation;
    }

    private static string BuildSystemPrompt(DataAccess.Entities.Profile? profile, List<Skill> skills)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are the SECompass AI Virtual Mentor, a friendly and knowledgeable career advisor for Software Engineering students.");
        sb.AppendLine("Help the student choose a career specialization, close skill gaps, plan a prioritized learning roadmap, and build a coherent project portfolio.");

        if (profile != null)
        {
            sb.AppendLine();
            sb.AppendLine("Student profile:");
            if (!string.IsNullOrWhiteSpace(profile.University)) sb.AppendLine($"- University: {profile.University}");
            if (!string.IsNullOrWhiteSpace(profile.Major)) sb.AppendLine($"- Major: {profile.Major}");
            if (profile.StudiedYear.HasValue) sb.AppendLine($"- Year of study: {profile.StudiedYear}");
            if (!string.IsNullOrWhiteSpace(profile.BioDescription)) sb.AppendLine($"- About: {profile.BioDescription}");
            sb.AppendLine(skills.Count > 0
                ? $"- Current skills: {string.Join(", ", skills.Select(s => s.SkillName))}"
                : "- Current skills: none recorded yet");
        }

        sb.AppendLine();
        sb.AppendLine("Guidelines:");
        sb.AppendLine("- Be concise, practical, and encouraging.");
        sb.AppendLine("- Use Markdown (headings, bullet lists, bold text, and fenced code blocks) where it improves clarity.");
        sb.AppendLine("- Recommend specific technologies, tools, and resources rather than vague suggestions.");
        sb.AppendLine("- If the student's goal is unclear, ask a brief clarifying question before going deep.");

        return sb.ToString();
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
