namespace SECompass.BusinessLogic.DTOs.Node;

public class UpdateNodeDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? Order { get; set; }
    public Guid? ParentNodeId { get; set; }
}
