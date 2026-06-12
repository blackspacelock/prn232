namespace SECompass.BusinessLogic.DTOs.Skill;

public class SkillGapAnalysisDto
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public List<TechnicalSkillDto> RequiredSkills { get; set; } = new();
    public List<TechnicalSkillDto> MatchedSkills { get; set; } = new();
    public List<TechnicalSkillDto> MissingSkills { get; set; } = new();
    public List<SkillGapCategoryDto> CategoryBreakdown { get; set; } = new();
    public double CoveragePercentage { get; set; }
    public string Summary { get; set; } = string.Empty;
}
