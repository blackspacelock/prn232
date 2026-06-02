namespace SECompass.DataAccess.Entities;

public class RoadmapNode : BaseAuditableEntity
{
    public Guid CareerRoadmapId { get; set; }
    public Guid NodeId { get; set; }

    public CareerRoadmap CareerRoadmap { get; set; } = null!;
    public Node Node { get; set; } = null!;
}
