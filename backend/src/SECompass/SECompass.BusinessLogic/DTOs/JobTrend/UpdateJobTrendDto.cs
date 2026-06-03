namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class UpdateJobTrendDto
{
    public string? TechSkill { get; set; }
    public string? Description { get; set; }
    public string? Source { get; set; }
    public string? Region { get; set; }
    public int? TrendScore { get; set; }
    public DateTime? SnapshotDate { get; set; }
}
