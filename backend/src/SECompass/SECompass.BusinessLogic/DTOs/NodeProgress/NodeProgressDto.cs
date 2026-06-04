using SECompass.BusinessLogic.DTOs.Node;
using SECompass.BusinessLogic.DTOs.RoadmapNode;

namespace SECompass.BusinessLogic.DTOs.NodeProgress;

public class NodeProgressDto
{
    public Guid Id { get; set; }
    public Guid PersonalRoadmapId { get; set; }
    public Guid RoadmapNodeId { get; set; }
    public Guid NodeId { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public RoadmapNodeDto RoadmapNode { get; set; } = null!;
    public NodeDto Node { get; set; } = null!;
}
