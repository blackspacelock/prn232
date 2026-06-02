namespace SECompass.DataAccess.Entities;

public class LearningResource : BaseAuditableEntity
{
    public Guid NodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? Provider { get; set; }
    public bool IsFree { get; set; } = true;

    public Node Node { get; set; } = null!;
}
