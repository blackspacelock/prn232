using SECompass.BusinessLogic.DTOs.Node;

namespace SECompass.BusinessLogic.DTOs.NodeProgress;

public class NodeProgressDto
{
    public Guid Id { get; set; }
    public Guid PersonalRoadmapId { get; set; }
    public Guid NodeId { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public NodeDto Node { get; set; } = null!;
}
