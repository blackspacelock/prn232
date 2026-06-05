namespace SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;

public class CreateRoadmapNodeEdgeDto
{
    public Guid FromRoadmapNodeId { get; set; }
    public Guid ToRoadmapNodeId { get; set; }
    public string EdgeType { get; set; } = "Next";
}
