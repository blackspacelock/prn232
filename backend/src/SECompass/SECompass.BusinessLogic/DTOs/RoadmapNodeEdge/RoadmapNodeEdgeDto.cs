namespace SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;

public class RoadmapNodeEdgeDto
{
    public Guid Id { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public Guid FromRoadmapNodeId { get; set; }
    public Guid ToRoadmapNodeId { get; set; }
    public string EdgeType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
