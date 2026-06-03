namespace SECompass.DataAccess.Entities;

public class JobTrend : BaseAuditableEntity
{
    public string TechSkill { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Source { get; set; }
    public string? Region { get; set; }
    public int TrendScore { get; set; }
    public DateTime SnapshotDate { get; set; }
}
