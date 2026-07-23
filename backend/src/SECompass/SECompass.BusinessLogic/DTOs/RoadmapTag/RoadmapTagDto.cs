namespace SECompass.BusinessLogic.DTOs.RoadmapTag;

public class RoadmapTagDto
{
    public Guid Id { get; set; }
    public Guid PersonalRoadmapId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
}
