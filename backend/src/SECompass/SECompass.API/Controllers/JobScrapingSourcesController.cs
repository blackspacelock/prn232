using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/job-scraping-sources")]
[Authorize(Roles = "0")]
public class JobScrapingSourcesController : ControllerBase
{
    private readonly IJobScrapingSourceService _service;

    public JobScrapingSourcesController(IJobScrapingSourceService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<JobScrapingSourceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(typeof(JobScrapingSourceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateJobScrapingSourceDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(JobScrapingSourceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateJobScrapingSourceDto dto)
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
}
