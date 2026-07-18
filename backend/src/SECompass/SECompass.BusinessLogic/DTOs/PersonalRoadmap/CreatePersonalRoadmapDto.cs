namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class CreatePersonalRoadmapDto
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Desire { get; set; }
    public List<CreatePersonalRoadmapStepDto> Steps { get; set; } = new();
}

public class CreatePersonalRoadmapStepDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentStepIndex { get; set; }
    public int? BranchStepIndex { get; set; }
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
    public List<Guid> TechnicalSkillIds { get; set; } = new();
    public List<CreatePersonalRoadmapLearningResourceDto> LearningResources { get; set; } = new();
}

public class CreatePersonalRoadmapLearningResourceDto
{
    public string Name { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "Article";
    public string? Provider { get; set; }
    public bool IsFree { get; set; } = true;
}
