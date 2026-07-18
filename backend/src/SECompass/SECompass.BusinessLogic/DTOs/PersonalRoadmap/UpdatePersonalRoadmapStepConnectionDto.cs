namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class UpdatePersonalRoadmapStepConnectionDto
{
    public Guid? PreviousRoadmapNodeId { get; set; }
    public Guid? ParentRoadmapNodeId { get; set; }
    public Guid? BranchRoadmapNodeId { get; set; }
}
