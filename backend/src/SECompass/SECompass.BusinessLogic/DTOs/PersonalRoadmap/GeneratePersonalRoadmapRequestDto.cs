namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class GeneratePersonalRoadmapRequestDto
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
}

public class CopySharedRoadmapRequestDto
{
    public Guid ProfileId { get; set; }
}
