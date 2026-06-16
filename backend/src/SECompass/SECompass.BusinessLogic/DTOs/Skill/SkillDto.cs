namespace SECompass.BusinessLogic.DTOs.Skill;

public class SkillDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Guid TechnicalSkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}
