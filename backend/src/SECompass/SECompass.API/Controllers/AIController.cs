using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IAIRecommendationService _service;

    public AIController(IAIRecommendationService service) => _service = service;

    [HttpPost("portfolio-analysis/{profileId:guid}")]
    [ProducesResponseType(typeof(PortfolioAnalysisDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzePortfolio(Guid profileId)
    {
        var result = await _service.AnalyzeGitHubPortfolioAsync(profileId);
        return Ok(result.Data);
    }
}
