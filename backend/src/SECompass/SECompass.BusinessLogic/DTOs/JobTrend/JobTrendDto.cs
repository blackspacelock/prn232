namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class JobTrendDto
{
    public Guid Id { get; set; }
    public string TechSkill { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Source { get; set; }
    public string? Region { get; set; }
    public int TrendScore { get; set; }
    public DateTime SnapshotDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
