using SECompass.BusinessLogic.DTOs.RoadmapTag;

namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class PersonalRoadmapDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public string CareerRoadmapName { get; set; } = string.Empty;
    public string? CareerRoadmapDescription { get; set; }
    public string? Note { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int InProgressCount { get; set; }
    public bool IsActive { get; set; }
    public bool IsShared { get; set; }
    public DateTime? SharedAt { get; set; }
    public string? OwnerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RoadmapTagDto> Tags { get; set; } = new();
}
