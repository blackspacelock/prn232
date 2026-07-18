namespace SECompass.BusinessLogic.DTOs.NodeProgress;

public class UpdateNodeProgressDetailsDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }
    public List<Guid>? TechnicalSkillIds { get; set; }
}
