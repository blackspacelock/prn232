namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class AddPersonalRoadmapStepDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public List<Guid> TechnicalSkillIds { get; set; } = new();
    public List<CreatePersonalRoadmapLearningResourceDto> LearningResources { get; set; } = new();
}
