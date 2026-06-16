using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.Node;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/nodes")]
[Authorize(Roles = "0")]
public class NodesController : ControllerBase
{
    private readonly INodeService _nodeService;

    public NodesController(INodeService nodeService) => _nodeService = nodeService;

    [HttpGet]
    [ProducesResponseType(typeof(BusinessLogic.Common.PaginationResponse<NodeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] NodeListRequestDto request)
    {
        var result = await _nodeService.GetPagedAsync(request);
        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(typeof(NodeDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateNodeDto dto)
    {
        var result = await _nodeService.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(NodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNodeDto dto)
    {
        var result = await _nodeService.UpdateAsync(id, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _nodeService.DeleteAsync(id);
        if (!result.Success) return NotFound(result.Error);
        return Ok();
    }
}
