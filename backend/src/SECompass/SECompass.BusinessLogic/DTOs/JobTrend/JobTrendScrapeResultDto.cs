namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class JobTrendScrapeResultDto
{
    public DateTime SnapshotDate { get; set; }
    public int TotalPostingsScraped { get; set; }
    public int TrendsCreated { get; set; }
    public int TrendsUpdated { get; set; }
    public List<JobTrendScrapeSourceResultDto> Sources { get; set; } = new();
}

public class JobTrendScrapeSourceResultDto
{
    public string SourceName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public int PostingsScraped { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
}
