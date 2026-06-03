using SECompass.DataAccess.Enums;

namespace SECompass.DataAccess.Entities;

public class NodeProgress : BaseAuditableEntity
{
    public Guid PersonalRoadmapId { get; set; }
    public Guid NodeId { get; set; }
    public NodeProgressStatus Status { get; set; }
    public string? Note { get; set; }

    public PersonalRoadmap PersonalRoadmap { get; set; } = null!;
    public Node Node { get; set; } = null!;
}
