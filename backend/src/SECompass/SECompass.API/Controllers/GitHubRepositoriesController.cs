using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.GitHubRepository;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/github-repositories")]
[Authorize]
public class GitHubRepositoriesController : ControllerBase
{
    private readonly IGitHubRepositoryService _service;

    public GitHubRepositoriesController(IGitHubRepositoryService service) => _service = service;

    [HttpPost]
    [ProducesResponseType(typeof(GitHubRepositoryDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Add([FromBody] AddGitHubRepoDto dto)
    {
        var result = await _service.AddAsync(dto);
        return CreatedAtAction(nameof(Add), result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid id, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.RemoveAsync(id, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
