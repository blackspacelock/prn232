namespace SECompass.DataAccess.Entities;

public class Node : BaseAuditableEntity
{
    public Guid? ParentNodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }

    public Node? ParentNode { get; set; }
    public ICollection<Node> Children { get; set; } = new List<Node>();
    public ICollection<LearningResource> LearningResources { get; set; } = new List<LearningResource>();
    public ICollection<RoadmapNode> RoadmapNodes { get; set; } = new List<RoadmapNode>();
    public ICollection<NodeTechnicalSkill> NodeTechnicalSkills { get; set; } = new List<NodeTechnicalSkill>();
}
