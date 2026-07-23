namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class CreateCustomPersonalRoadmapRequestDto
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CustomPersonalRoadmapNodeDto> Nodes { get; set; } = new();
    public List<CustomPersonalRoadmapEdgeDto> Edges { get; set; } = new();
}

public class CustomPersonalRoadmapNodeDto
{
    public string ClientId { get; set; } = string.Empty;
    public string? ParentClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public string NodeType { get; set; } = "Topic";
    public string RequirementType { get; set; } = "Required";
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
    public List<CustomPersonalRoadmapSkillDto> TechnicalSkills { get; set; } = new();
    public List<CustomPersonalRoadmapResourceDto> LearningResources { get; set; } = new();
}

public class CustomPersonalRoadmapSkillDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
}

public class CustomPersonalRoadmapResourceDto
{
    public string Name { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "Article";
    public string? Provider { get; set; }
    public bool IsFree { get; set; } = true;
}

public class CustomPersonalRoadmapEdgeDto
{
    public string FromClientId { get; set; } = string.Empty;
    public string ToClientId { get; set; } = string.Empty;
    public string EdgeType { get; set; } = "Next";
}
