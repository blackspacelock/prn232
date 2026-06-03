namespace SECompass.BusinessLogic.DTOs.AI;

public class PortfolioAnalysisDto
{
    public Guid ProfileId { get; set; }
    public List<string> RepositoryNames { get; set; } = new();
    public string OverallSummary { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}
