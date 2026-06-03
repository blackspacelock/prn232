namespace SECompass.BusinessLogic.DTOs.Node;

public class NodeDto
{
    public Guid Id { get; set; }
    public Guid? ParentNodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
}
