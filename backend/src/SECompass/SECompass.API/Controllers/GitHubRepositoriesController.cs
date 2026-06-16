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

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(GitHubRepositoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGitHubRepoDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid id)
    {
        var result = await _service.RemoveAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
