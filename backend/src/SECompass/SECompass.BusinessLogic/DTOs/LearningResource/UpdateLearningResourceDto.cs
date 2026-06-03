namespace SECompass.BusinessLogic.DTOs.LearningResource;

public class UpdateLearningResourceDto
{
    public string? Name { get; set; }
    public string? ResourceUrl { get; set; }
    public string? ResourceType { get; set; }
    public string? Provider { get; set; }
    public bool? IsFree { get; set; }
}
