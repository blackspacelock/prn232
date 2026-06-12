namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class JobScrapingSettingDto
{
    public Guid Id { get; set; }
    public bool Enabled { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public string TimeOfDay { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public DateTime? LastRunAt { get; set; }
}

public class UpdateJobScrapingSettingDto
{
    public bool Enabled { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public string TimeOfDay { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
}
