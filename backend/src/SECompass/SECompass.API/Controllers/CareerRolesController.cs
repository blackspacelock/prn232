using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.CareerRole;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/career-roles")]
[Authorize(Roles = "Admin,0")]
public class CareerRolesController : ControllerBase
{
    private readonly ICareerRoleService _careerRoleService;

    public CareerRolesController(ICareerRoleService careerRoleService) => _careerRoleService = careerRoleService;

    [HttpPost]
    [ProducesResponseType(typeof(CareerRoleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateCareerRoleDto dto)
    {
        var result = await _careerRoleService.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CareerRoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCareerRoleDto dto)
    {
        var result = await _careerRoleService.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _careerRoleService.DeleteAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
