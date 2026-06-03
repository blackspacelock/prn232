namespace SECompass.BusinessLogic.DTOs.Skill;

public class AddSkillDto
{
    public Guid ProfileId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string? Note { get; set; }
}
