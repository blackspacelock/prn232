using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/job-trends")]
[Authorize]
public class JobTrendsController : ControllerBase
{
    private readonly IJobTrendService _service;

    public JobTrendsController(IJobTrendService service) => _service = service;

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
    public async Task<IActionResult> Delete(Guid id, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.DeleteAsync(id, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
