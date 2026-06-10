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

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.DeleteAsync(id, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
