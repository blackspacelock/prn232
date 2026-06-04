namespace SECompass.DataAccess.Entities;

public class RoadmapNode : BaseAuditableEntity
{
    public Guid CareerRoadmapId { get; set; }
    public Guid NodeId { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public int Order { get; set; }
    public string NodeType { get; set; } = "Topic";
    public string RequirementType { get; set; } = "Required";
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }

    public CareerRoadmap CareerRoadmap { get; set; } = null!;
    public Node Node { get; set; } = null!;
    public RoadmapNode? ParentRoadmapNode { get; set; }
    public ICollection<RoadmapNode> Children { get; set; } = new List<RoadmapNode>();
    public ICollection<RoadmapNodeEdge> OutgoingEdges { get; set; } = new List<RoadmapNodeEdge>();
    public ICollection<RoadmapNodeEdge> IncomingEdges { get; set; } = new List<RoadmapNodeEdge>();
    public ICollection<NodeProgress> NodeProgresses { get; set; } = new List<NodeProgress>();
}
