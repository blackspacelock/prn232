using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/skills")]
[Authorize]
public class SkillsController : ControllerBase
{
    private readonly ISkillService _skillService;

    public SkillsController(ISkillService skillService) => _skillService = skillService;

    [HttpPost]
    [ProducesResponseType(typeof(SkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Add([FromBody] AddSkillDto dto)
    {
        var result = await _skillService.AddSkillAsync(dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Add), result.Data);
    }

    [HttpDelete("{skillId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid skillId)
    {
        var result = await _skillService.RemoveSkillAsync(skillId);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
