using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;
using SECompass.BusinessLogic.DTOs.RoadmapTag;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/personal-roadmaps")]
[Authorize]
public class PersonalRoadmapsController : ControllerBase
{
    private readonly IPersonalRoadmapService _service;
    private readonly IRoadmapTagService _tagService;

    public PersonalRoadmapsController(IPersonalRoadmapService service, IRoadmapTagService tagService)
    {
        _service = service;
        _tagService = tagService;
    }

    [HttpPost("generate")]
    [ProducesResponseType(typeof(PersonalRoadmapDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate([FromBody] GeneratePersonalRoadmapRequestDto dto)
    {
        var result = await _service.GenerateAsync(dto.ProfileId, dto.CareerRoadmapId);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Generate), result.Data);
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

    // ── Tags ────────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/tags")]
    [ProducesResponseType(typeof(List<RoadmapTagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTags(Guid id)
    {
        var result = await _tagService.GetByRoadmapAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/tags")]
    [ProducesResponseType(typeof(RoadmapTagDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddTag(Guid id, [FromBody] AddRoadmapTagDto dto)
    {
        var result = await _tagService.AddAsync(id, dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(GetTags), new { id }, result.Data);
    }

    [HttpPut("{id:guid}/tags/{tagId:guid}")]
    [ProducesResponseType(typeof(RoadmapTagDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTag(Guid id, Guid tagId, [FromBody] UpdateRoadmapTagDto dto)
    {
        var result = await _tagService.UpdateAsync(tagId, dto);
        if (!result.Success)
        {
            return result.Error == "Tag not found." ? NotFound(result.Error) : BadRequest(result.Error);
        }
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}/tags/{tagId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTag(Guid id, Guid tagId)
    {
        var result = await _tagService.DeleteAsync(tagId);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
