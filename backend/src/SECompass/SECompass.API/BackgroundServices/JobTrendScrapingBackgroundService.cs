using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.BackgroundServices;

public class JobTrendScrapingBackgroundService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<JobTrendScrapingBackgroundService> _logger;

    public JobTrendScrapingBackgroundService(IServiceScopeFactory scopeFactory, ILogger<JobTrendScrapingBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndRunAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job trend scrape check failed.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }

    private async Task CheckAndRunAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var settingsService = scope.ServiceProvider.GetRequiredService<IJobScrapingSettingsService>();

        var settingsResult = await settingsService.GetSettingsAsync();
        var settings = settingsResult.Data;
        if (settings == null || !settings.Enabled)
            return;

        if (!Enum.TryParse<DayOfWeek>(settings.DayOfWeek, true, out var targetDay))
            targetDay = DayOfWeek.Sunday;

        if (!TimeSpan.TryParse(settings.TimeOfDay, out var targetTime))
            targetTime = TimeSpan.Zero;

        var now = DateTime.Now;

        var isScheduledDay = settings.Frequency.Equals("Daily", StringComparison.OrdinalIgnoreCase)
            || now.DayOfWeek == targetDay;

        var isPastTargetTime = now.TimeOfDay >= targetTime;
        var hasNotRunToday = settings.LastRunAt == null || settings.LastRunAt.Value.Date < now.Date;

        if (!(isScheduledDay && isPastTargetTime && hasNotRunToday))
            return;

        var scrapingService = scope.ServiceProvider.GetRequiredService<IJobTrendScrapingService>();
        var result = await scrapingService.RunScrapingAsync(stoppingToken);

        await settingsService.MarkRunCompletedAsync(now);

        _logger.LogInformation(
            "Job trend scrape completed: {Postings} postings scraped, {Created} trends created, {Updated} trends updated.",
            result.TotalPostingsScraped, result.TrendsCreated, result.TrendsUpdated);
    }
}
