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

    [HttpPut("sessions/{sessionId:guid}")]
    [ProducesResponseType(typeof(ChatSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSession(Guid sessionId, [FromBody] UpdateChatSessionDto dto)
    {
        var result = await _chatService.UpdateSessionTitleAsync(sessionId, dto);
        if (!result.Success && result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
        {
            return NotFound(result.Error);
        }

        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        var result = await _chatService.DeleteSessionAsync(sessionId);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
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
