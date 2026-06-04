using SECompass.BusinessLogic.DTOs.Node;

namespace SECompass.BusinessLogic.DTOs.RoadmapNode;

public class RoadmapNodeDto
{
    public Guid Id { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public Guid NodeId { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public int Order { get; set; }
    public string NodeType { get; set; } = string.Empty;
    public string RequirementType { get; set; } = string.Empty;
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
    public DateTime CreatedAt { get; set; }
    public NodeDto Node { get; set; } = null!;
}
