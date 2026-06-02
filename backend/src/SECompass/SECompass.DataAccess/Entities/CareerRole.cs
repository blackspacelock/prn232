namespace SECompass.DataAccess.Entities;

public class CareerRole : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<CareerRoadmap> CareerRoadmaps { get; set; } = new List<CareerRoadmap>();
}
