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
    private const int MaxRoadmapsInPrompt = 3;
    private const int MaxRoadmapNodesInPrompt = 12;
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

    public async Task<ServiceResult<ChatSessionDto>> UpdateSessionTitleAsync(Guid sessionId, UpdateChatSessionDto dto)
    {
        var title = dto.Title.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return ServiceResult<ChatSessionDto>.Fail("Chat session title is required.");
        }

        var session = await _uow.ChatSessions.GetByIdAsync(sessionId);
        if (session == null) return ServiceResult<ChatSessionDto>.Fail("Chat session not found.");

        session.Title = title;
        _uow.ChatSessions.Update(session);
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
        var skills = (await _uow.ProfileTechnicalSkills.FindAsync(s => s.ProfileId == session.ProfileId)).ToList();
        if (skills.Count > 0)
        {
            var technicalSkillIds = skills.Select(s => s.TechnicalSkillId).Distinct().ToList();
            var technicalSkills = (await _uow.TechnicalSkills.FindAsync(t => technicalSkillIds.Contains(t.Id)))
                .ToDictionary(t => t.Id);
            foreach (var skill in skills)
            {
                skill.TechnicalSkill = technicalSkills[skill.TechnicalSkillId];
            }
        }

        var personalRoadmaps = (await _uow.PersonalRoadmaps.GetByProfileWithProgressAsync(session.ProfileId)).ToList();
        var conversation = BuildConversation(profile, skills, personalRoadmaps, session.ChatMessages, userMessage);
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

    private static List<AiChatMessageDto> BuildConversation(
        DataAccess.Entities.Profile? profile,
        List<ProfileTechnicalSkill> skills,
        List<PersonalRoadmap> personalRoadmaps,
        IEnumerable<ChatMessage> priorMessages,
        ChatMessage newUserMessage)
    {
        var conversation = new List<AiChatMessageDto>
        {
            new() { Role = "system", Content = BuildSystemPrompt(profile, skills, personalRoadmaps) }
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

    private static string BuildSystemPrompt(DataAccess.Entities.Profile? profile, List<ProfileTechnicalSkill> skills, List<PersonalRoadmap> personalRoadmaps)
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
                ? $"- Current skills: {string.Join(", ", skills.Select(s => s.TechnicalSkill.Name))}"
                : "- Current skills: none recorded yet");
        }

        AppendPersonalRoadmaps(sb, personalRoadmaps);

        sb.AppendLine();
        sb.AppendLine("Guidelines:");
        sb.AppendLine("- Be concise, practical, and encouraging.");
        sb.AppendLine("- Use Markdown (headings, bullet lists, bold text, and fenced code blocks) where it improves clarity.");
        sb.AppendLine("- Recommend specific technologies, tools, and resources rather than vague suggestions.");
        sb.AppendLine("- Use the student's personal roadmap progress when it is relevant. Mention completed, in-progress, and next unfinished nodes by name.");
        sb.AppendLine("- Prefer advice that advances the active roadmap before suggesting unrelated topics.");
        sb.AppendLine("- If the student's goal is unclear, ask a brief clarifying question before going deep.");

        return sb.ToString();
    }

    private static void AppendPersonalRoadmaps(StringBuilder sb, List<PersonalRoadmap> personalRoadmaps)
    {
        sb.AppendLine();
        sb.AppendLine("Student personal roadmaps:");
        if (personalRoadmaps.Count == 0)
        {
            sb.AppendLine("- No personal roadmap has been generated yet. If useful, suggest creating one before deep planning.");
            return;
        }

        foreach (var roadmap in personalRoadmaps.Take(MaxRoadmapsInPrompt))
        {
            var nodeProgresses = roadmap.NodeProgresses
                .OrderBy(np => np.RoadmapNode.Order)
                .ThenBy(np => np.RoadmapNode.Node.Name)
                .ToList();
            var total = nodeProgresses.Count;
            var completed = nodeProgresses.Count(np => np.Status == DataAccess.Enums.NodeProgressStatus.Completed);
            var inProgress = nodeProgresses.Count(np => np.Status == DataAccess.Enums.NodeProgressStatus.InProgress);
            var paused = nodeProgresses.Count(np => np.Status == DataAccess.Enums.NodeProgressStatus.Paused);
            var skipped = nodeProgresses.Count(np => np.Status == DataAccess.Enums.NodeProgressStatus.Skipped);
            var notStarted = nodeProgresses.Count(np => np.Status == DataAccess.Enums.NodeProgressStatus.NotStarted);

            sb.AppendLine($"- Roadmap: {roadmap.CareerRoadmap.Name}{(roadmap.IsActive ? " (active)" : "")}");
            if (!string.IsNullOrWhiteSpace(roadmap.CareerRoadmap.Description))
            {
                sb.AppendLine($"  Description: {roadmap.CareerRoadmap.Description}");
            }
            if (!string.IsNullOrWhiteSpace(roadmap.Note))
            {
                sb.AppendLine($"  Student note: {roadmap.Note}");
            }
            sb.AppendLine($"  Progress: {roadmap.ProgressPercentage:0.##}% ({completed}/{total} completed, {inProgress} in progress, {paused} paused, {skipped} skipped, {notStarted} not started)");

            var relevantNodes = nodeProgresses
                .OrderBy(np => np.Status == DataAccess.Enums.NodeProgressStatus.InProgress ? 0 :
                    np.Status == DataAccess.Enums.NodeProgressStatus.Paused ? 1 :
                    np.Status == DataAccess.Enums.NodeProgressStatus.NotStarted ? 2 :
                    np.Status == DataAccess.Enums.NodeProgressStatus.Completed ? 3 : 4)
                .ThenBy(np => np.RoadmapNode.Order)
                .Take(MaxRoadmapNodesInPrompt)
                .ToList();

            if (relevantNodes.Count == 0)
            {
                sb.AppendLine("  Nodes: none recorded yet");
                continue;
            }

            sb.AppendLine("  Key nodes:");
            foreach (var progress in relevantNodes)
            {
                var note = string.IsNullOrWhiteSpace(progress.Note) ? string.Empty : $" - note: {progress.Note}";
                sb.AppendLine($"  - [{progress.Status}] {progress.RoadmapNode.Node.Name} ({progress.RoadmapNode.RequirementType}, {progress.RoadmapNode.NodeType}){note}");
            }
        }
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
