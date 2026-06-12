using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.Chat;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService) => _chatService = chatService;

    [HttpPost("sessions")]
    [ProducesResponseType(typeof(ChatSessionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSession([FromQuery] Guid profileId, [FromBody] CreateChatSessionDto dto)
    {
        var result = await _chatService.CreateSessionAsync(profileId, dto);
        return CreatedAtAction(nameof(CreateSession), result.Data);
    }

    [HttpPost("sessions/{sessionId:guid}/messages")]
    [ProducesResponseType(typeof(SendMessageResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage(Guid sessionId, [FromBody] SendMessageDto dto, CancellationToken cancellationToken)
    {
        var result = await _chatService.SendMessageAsync(sessionId, dto, cancellationToken);
        if (!result.Success) return NotFound(result.Error);
        return CreatedAtAction(nameof(SendMessage), result.Data);
    }
}
