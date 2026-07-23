using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/personal-roadmaps")]
[Authorize]
public class PersonalRoadmapsController : ControllerBase
{
    private readonly IPersonalRoadmapService _service;

    public PersonalRoadmapsController(IPersonalRoadmapService service) => _service = service;

    [HttpPost("generate")]
    [ProducesResponseType(typeof(PersonalRoadmapDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate([FromBody] GeneratePersonalRoadmapRequestDto dto)
    {
        var result = await _service.GenerateAsync(dto.ProfileId, dto.CareerRoadmapId);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Generate), result.Data);
    }

    [HttpPost("custom")]
    [ProducesResponseType(typeof(PersonalRoadmapDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCustom([FromBody] CreateCustomPersonalRoadmapRequestDto dto)
    {
        var result = await _service.CreateCustomAsync(dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(CreateCustom), result.Data);
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

    [HttpPut("{id:guid}/toggle-active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var result = await _service.ToggleActiveAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }

    [HttpPut("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Activate(Guid id) => ToggleActive(id);
}
