using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/career-roadmaps")]
[Authorize]
public class CareerRoadmapsController : ControllerBase
{
    private readonly ICareerRoadmapService _service;

    public CareerRoadmapsController(ICareerRoadmapService service) => _service = service;

    [HttpPost]
    [ProducesResponseType(typeof(CareerRoadmapDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateCareerRoadmapDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CareerRoadmapDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCareerRoadmapDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }

    [HttpPost("{id:guid}/nodes/{nodeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignNode(Guid id, Guid nodeId)
    {
        var result = await _service.AssignNodeAsync(id, nodeId);
        if (!result.Success) return BadRequest(result.Error);
        return Ok();
    }

    [HttpDelete("{id:guid}/nodes/{nodeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveNode(Guid id, Guid nodeId)
    {
        var result = await _service.RemoveNodeAsync(id, nodeId);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
