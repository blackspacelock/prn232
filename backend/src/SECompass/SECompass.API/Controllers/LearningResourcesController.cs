using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.LearningResource;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Authorize]
public class LearningResourcesController : ControllerBase
{
    private readonly ILearningResourceService _service;

    public LearningResourcesController(ILearningResourceService service) => _service = service;

    [HttpPost("api/nodes/{nodeId:guid}/learning-resources")]
    [ProducesResponseType(typeof(LearningResourceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid nodeId, [FromBody] CreateLearningResourceDto dto)
    {
        var result = await _service.CreateAsync(nodeId, dto);
        if (!result.Success) return NotFound(result.Error);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("api/learning-resources/{id:guid}")]
    [ProducesResponseType(typeof(LearningResourceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLearningResourceDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("api/learning-resources/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
