namespace SECompass.BusinessLogic.DTOs.RoadmapNode;

public class UpdateRoadmapNodeDto
{
    public Guid? PreviousRoadmapNodeId { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public Guid? BranchRoadmapNodeId { get; set; }
    public int? Order { get; set; }
    public string? NodeType { get; set; }
    public string? RequirementType { get; set; }
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
    public List<Guid>? TechnicalSkillIds { get; set; }
}
