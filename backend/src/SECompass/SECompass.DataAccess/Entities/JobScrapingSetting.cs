namespace SECompass.DataAccess.Entities;

public class JobScrapingSetting : BaseAuditableEntity
{
    public bool Enabled { get; set; } = true;

    // "Daily" or "Weekly"
    public string Frequency { get; set; } = "Weekly";

    public string TimeOfDay { get; set; } = "00:00:00";

    // Used when Frequency == "Weekly"
    public string DayOfWeek { get; set; } = "Sunday";

    public DateTime? LastRunAt { get; set; }
}
