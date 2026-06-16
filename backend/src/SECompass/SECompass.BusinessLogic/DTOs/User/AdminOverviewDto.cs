using SECompass.BusinessLogic.DTOs.JobTrend;

namespace SECompass.BusinessLogic.DTOs.User;

public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int AdminUsers { get; set; }
    public int MentorUsers { get; set; }
    public int StudentUsers { get; set; }
    public int CareerRoles { get; set; }
    public int RoadmapTemplates { get; set; }
    public int ContentNodes { get; set; }
    public int PersonalRoadmaps { get; set; }
    public int GitHubRepositories { get; set; }
    public int PublicPortfolios { get; set; }
    public int ChatSessions { get; set; }
    public double AverageRoadmapProgress { get; set; }
    public bool ScrapingEnabled { get; set; }
    public int ActiveScrapingSources { get; set; }
    public DateTime? LastScrapingRunAt { get; set; }
    public List<AdminMetricPointDto> MonthlyRegistrations { get; set; } = new();
    public List<AdminMetricPointDto> RoleBreakdown { get; set; } = new();
    public List<AdminMetricPointDto> ContentInventory { get; set; } = new();
    public List<JobTrendDto> TopJobTrends { get; set; } = new();
    public List<UserDto> RecentUsers { get; set; } = new();
}
