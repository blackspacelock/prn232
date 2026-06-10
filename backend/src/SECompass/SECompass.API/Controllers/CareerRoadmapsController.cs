using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.DTOs.RoadmapNode;
using SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/career-roadmaps")]
[Authorize]
public class CareerRoadmapsController : ControllerBase
{
    private readonly ICareerRoadmapService _service;

    public CareerRoadmapsController(ICareerRoadmapService service) => _service = service;

    [HttpPost]
    [ProducesResponseType(typeof(CareerRoadmapDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateCareerRoadmapDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CareerRoadmapDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCareerRoadmapDto dto)
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

    [HttpPost("{id:guid}/nodes/{nodeId:guid}")]
    [ProducesResponseType(typeof(RoadmapNodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignNode(Guid id, Guid nodeId)
    {
        var result = await _service.AssignNodeAsync(id, nodeId);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/roadmap-nodes")]
    [ProducesResponseType(typeof(RoadmapNodeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignRoadmapNode(Guid id, [FromBody] CreateRoadmapNodeDto dto)
    {
        var result = await _service.AssignNodeAsync(id, dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(AssignRoadmapNode), result.Data);
    }

    [HttpPut("{id:guid}/roadmap-nodes/{roadmapNodeId:guid}")]
    [ProducesResponseType(typeof(RoadmapNodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoadmapNode(Guid id, Guid roadmapNodeId, [FromBody] UpdateRoadmapNodeDto dto)
    {
        var result = await _service.UpdateRoadmapNodeAsync(id, roadmapNodeId, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}/roadmap-nodes/{roadmapNodeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRoadmapNode(Guid id, Guid roadmapNodeId, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.RemoveRoadmapNodeAsync(id, roadmapNodeId, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }

    [HttpDelete("{id:guid}/nodes/{nodeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveNode(Guid id, Guid nodeId, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.RemoveNodeAsync(id, nodeId, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }

    [HttpPost("{id:guid}/edges")]
    [ProducesResponseType(typeof(RoadmapNodeEdgeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEdge(Guid id, [FromBody] CreateRoadmapNodeEdgeDto dto)
    {
        var result = await _service.CreateEdgeAsync(id, dto);
        if (!result.Success) return BadRequest(result.Error);
        return CreatedAtAction(nameof(CreateEdge), result.Data);
    }

    [HttpPut("{id:guid}/edges/{edgeId:guid}")]
    [ProducesResponseType(typeof(RoadmapNodeEdgeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEdge(Guid id, Guid edgeId, [FromBody] UpdateRoadmapNodeEdgeDto dto)
    {
        var result = await _service.UpdateEdgeAsync(id, edgeId, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}/edges/{edgeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEdge(Guid id, Guid edgeId, [FromQuery(Name = "delete")] bool physicalDelete = false)
    {
        var result = await _service.DeleteEdgeAsync(id, edgeId, physicalDelete);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
