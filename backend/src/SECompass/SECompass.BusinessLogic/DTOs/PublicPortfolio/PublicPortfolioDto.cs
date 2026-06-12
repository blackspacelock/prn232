using SECompass.BusinessLogic.DTOs.AI;

namespace SECompass.BusinessLogic.DTOs.PublicPortfolio;

public class PublicPortfolioDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public string? Headline { get; set; }
    public string? PublicBio { get; set; }
    public string? Location { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsPublic { get; set; }
    public DateTime? LastAnalyzedAt { get; set; }
    public PortfolioAnalysisDto? CachedPortfolioAnalysis { get; set; }
}
