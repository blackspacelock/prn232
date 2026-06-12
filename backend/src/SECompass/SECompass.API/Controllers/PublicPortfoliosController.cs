using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.PublicPortfolio;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/public-portfolios")]
public class PublicPortfoliosController : ControllerBase
{
    private readonly IPublicPortfolioService _service;

    public PublicPortfoliosController(IPublicPortfolioService service) => _service = service;

    [HttpGet("{profileId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PublicPortfolioDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid profileId)
    {
        var result = await _service.GetByProfileAsync(profileId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }

    [HttpPut("{profileId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PublicPortfolioDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid profileId, [FromBody] UpdatePublicPortfolioDto dto)
    {
        var result = await _service.UpdateAsync(profileId, dto);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Data);
    }
}
