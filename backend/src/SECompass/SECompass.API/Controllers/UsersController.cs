using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.User;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    [HttpGet]
    [Authorize(Roles = "0")]
    [ProducesResponseType(typeof(List<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _userService.GetAllAsync();
        return Ok(result.Data);
    }

    [HttpGet("admin-overview")]
    [Authorize(Roles = "0")]
    [ProducesResponseType(typeof(AdminOverviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminOverview()
    {
        var result = await _userService.GetAdminOverviewAsync();
        return Ok(result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var result = await _userService.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpPut("{id:guid}/admin")]
    [Authorize(Roles = "0")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdminUpdate(Guid id, [FromBody] AdminUpdateUserDto dto)
    {
        var result = await _userService.AdminUpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "0")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var result = await _userService.DeactivateAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
