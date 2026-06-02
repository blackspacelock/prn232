namespace SECompass.BusinessLogic.DTOs.LearningResource;

public class LearningResourceDto
{
    public Guid Id { get; set; }
    public Guid NodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? Provider { get; set; }
    public bool IsFree { get; set; }
    public DateTime CreatedAt { get; set; }
}
