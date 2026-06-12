namespace SECompass.BusinessLogic.DTOs.AI;

public class RepositoryAnalysisDto
{
    public Guid RepositoryId { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string Objective { get; set; } = string.Empty;
    public List<string> TechStacks { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}
