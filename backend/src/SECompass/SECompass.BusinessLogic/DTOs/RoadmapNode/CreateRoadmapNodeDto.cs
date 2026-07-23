namespace SECompass.BusinessLogic.DTOs.RoadmapNode;

public class CreateRoadmapNodeDto
{
    public Guid NodeId { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public int Order { get; set; }
    public string NodeType { get; set; } = "Topic";
    public string RequirementType { get; set; } = "Required";
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
}
