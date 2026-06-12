using SECompass.BusinessLogic.DTOs.JobTrend;

namespace SECompass.BusinessLogic.Interfaces;

public interface IJobTrendScrapingService
{
    Task<JobTrendScrapeResultDto> RunScrapingAsync(CancellationToken cancellationToken = default);
}
