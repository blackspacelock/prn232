using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/job-trends")]
[Authorize(Roles = "0")]
public class JobTrendsController : ControllerBase
{
    private readonly IJobTrendService _service;
    private readonly IJobTrendScrapingService _scrapingService;
    private readonly IJobScrapingSettingsService _settingsService;

    public JobTrendsController(IJobTrendService service, IJobTrendScrapingService scrapingService, IJobScrapingSettingsService settingsService)
    {
        _service = service;
        _scrapingService = scrapingService;
        _settingsService = settingsService;
    }

    [HttpPost("scrape")]
    [ProducesResponseType(typeof(JobTrendScrapeResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Scrape(CancellationToken cancellationToken)
    {
        var result = await _scrapingService.RunScrapingAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("scraping-settings")]
    [ProducesResponseType(typeof(JobScrapingSettingDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScrapingSettings()
    {
        var result = await _settingsService.GetSettingsAsync();
        return Ok(result.Data);
    }

    [HttpPut("scraping-settings")]
    [ProducesResponseType(typeof(JobScrapingSettingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateScrapingSettings([FromBody] UpdateJobScrapingSettingDto dto)
    {
        var result = await _settingsService.UpdateSettingsAsync(dto);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(typeof(JobTrendDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateJobTrendDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(JobTrendDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateJobTrendDto dto)
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
