namespace SECompass.DataAccess.Entities;

public class PublicPortfolio : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public string? Headline { get; set; }
    public string? PublicBio { get; set; }
    public string? Location { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsPublic { get; set; } = true;
    public string? CachedPortfolioAnalysisJson { get; set; }
    public DateTime? LastAnalyzedAt { get; set; }

    public Profile Profile { get; set; } = null!;
}
