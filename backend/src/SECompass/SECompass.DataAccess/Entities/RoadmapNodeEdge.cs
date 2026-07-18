namespace SECompass.DataAccess.Entities;

public class RoadmapNodeEdge : BaseAuditableEntity
{
    public Guid CareerRoadmapId { get; set; }
    public Guid FromRoadmapNodeId { get; set; }
    public Guid ToRoadmapNodeId { get; set; }
    public string EdgeType { get; set; } = "Branch";

    public CareerRoadmap CareerRoadmap { get; set; } = null!;
    public RoadmapNode FromRoadmapNode { get; set; } = null!;
    public RoadmapNode ToRoadmapNode { get; set; } = null!;
}
