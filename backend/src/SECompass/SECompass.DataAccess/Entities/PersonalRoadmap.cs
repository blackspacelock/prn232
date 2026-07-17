namespace SECompass.DataAccess.Entities;

public class PersonalRoadmap : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public Guid CareerRoadmapId { get; set; }
    public string? Note { get; set; }
    public decimal ProgressPercentage { get; set; }
    public bool IsActive { get; set; }
    public bool IsShared { get; set; }
    public DateTime? SharedAt { get; set; }

    public Profile Profile { get; set; } = null!;
    public CareerRoadmap CareerRoadmap { get; set; } = null!;
    public ICollection<NodeProgress> NodeProgresses { get; set; } = new List<NodeProgress>();
    public ICollection<RoadmapTag> Tags { get; set; } = new List<RoadmapTag>();
}
