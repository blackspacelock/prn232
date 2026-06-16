using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/technical-skills")]
[Authorize(Roles = "0")]
public class TechnicalSkillsController : ControllerBase
{
    private readonly ITechnicalSkillService _service;

    public TechnicalSkillsController(ITechnicalSkillService service) => _service = service;

    [HttpPost]
    [ProducesResponseType(typeof(TechnicalSkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTechnicalSkillDto dto)
    {
        var result = await _service.CreateAsync(dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TechnicalSkillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTechnicalSkillDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success && result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true) return NotFound(result.Error);
        if (!result.Success) return BadRequest(result.Error);
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
}
