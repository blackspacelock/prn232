namespace SECompass.BusinessLogic.DTOs.PublicPortfolio;

public class UpdatePublicPortfolioDto
{
    public string? Headline { get; set; }
    public string? PublicBio { get; set; }
    public string? Location { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? ContactEmail { get; set; }
    public bool? IsPublic { get; set; }
}
