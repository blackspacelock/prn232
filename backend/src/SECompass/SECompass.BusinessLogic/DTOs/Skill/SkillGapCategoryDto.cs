namespace SECompass.BusinessLogic.DTOs.Skill;

public class SkillGapCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public double YourLevel { get; set; }
    public double RequiredLevel { get; set; } = 100;
}
