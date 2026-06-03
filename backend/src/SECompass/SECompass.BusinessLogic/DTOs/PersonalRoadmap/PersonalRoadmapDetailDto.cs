using SECompass.BusinessLogic.DTOs.NodeProgress;

namespace SECompass.BusinessLogic.DTOs.PersonalRoadmap;

public class PersonalRoadmapDetailDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public string? Note { get; set; }
    public decimal ProgressPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<NodeProgressDto> NodeProgresses { get; set; } = new();
}
