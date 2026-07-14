namespace SECompass.DataAccess.Entities;

public class RoadmapTag : BaseAuditableEntity
{
    public Guid PersonalRoadmapId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }

    public PersonalRoadmap PersonalRoadmap { get; set; } = null!;
}
