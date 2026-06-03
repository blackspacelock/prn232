namespace SECompass.BusinessLogic.DTOs.AI;

public class SkillGapAnalysisDto
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public List<string> ExistingSkills { get; set; } = new();
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public double CoveragePercentage { get; set; }
    public string Summary { get; set; } = string.Empty;
}
