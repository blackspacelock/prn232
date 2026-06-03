namespace SECompass.BusinessLogic.DTOs.LearningResource;

public class CreateLearningResourceDto
{
    public string Name { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? Provider { get; set; }
    public bool IsFree { get; set; } = true;
}
