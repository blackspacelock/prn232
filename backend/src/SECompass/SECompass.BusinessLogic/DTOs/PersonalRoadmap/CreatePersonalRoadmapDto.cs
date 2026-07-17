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
}
