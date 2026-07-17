using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.NodeProgress;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/node-progress")]
[Authorize]
public class NodeProgressController : ControllerBase
{
    private readonly INodeProgressService _service;

    public NodeProgressController(INodeProgressService service) => _service = service;

    [HttpPut("{nodeProgressId:guid}/status")]
    [ProducesResponseType(typeof(NodeProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid nodeProgressId, [FromBody] UpdateNodeProgressStatusDto dto)
    {
        var result = await _service.UpdateStatusAsync(nodeProgressId, dto.Status, dto.Note);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpPut("{nodeProgressId:guid}/details")]
    [ProducesResponseType(typeof(NodeProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDetails(Guid nodeProgressId, [FromBody] UpdateNodeProgressDetailsDto dto)
    {
        var result = await _service.UpdateDetailsAsync(nodeProgressId, dto);
        if (!result.Success)
        {
            return result.Error == "Step name is required." ? BadRequest(result.Error) : NotFound(result.Error);
        }
        return Ok(result.Data);
    }
}
