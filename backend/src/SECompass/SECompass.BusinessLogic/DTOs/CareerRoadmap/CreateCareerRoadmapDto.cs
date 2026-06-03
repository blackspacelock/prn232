namespace SECompass.BusinessLogic.DTOs.CareerRoadmap;

public class CreateCareerRoadmapDto
{
    public Guid CareerRoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCustom { get; set; }
}
