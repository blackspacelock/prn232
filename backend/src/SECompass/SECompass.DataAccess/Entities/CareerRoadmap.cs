namespace SECompass.DataAccess.Entities;

public class CareerRoadmap : BaseAuditableEntity
{
    public Guid CareerRoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCustom { get; set; }

    public CareerRole CareerRole { get; set; } = null!;
    public ICollection<RoadmapNode> RoadmapNodes { get; set; } = new List<RoadmapNode>();
    public ICollection<RoadmapNodeEdge> RoadmapNodeEdges { get; set; } = new List<RoadmapNodeEdge>();
    public ICollection<PersonalRoadmap> PersonalRoadmaps { get; set; } = new List<PersonalRoadmap>();
}
