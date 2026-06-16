using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;

namespace SECompass.BusinessLogic.Interfaces;

public interface IJobScrapingSettingsService
{
    Task<ServiceResult<JobScrapingSettingDto>> GetSettingsAsync();
    Task<ServiceResult<JobScrapingSettingDto>> UpdateSettingsAsync(UpdateJobScrapingSettingDto dto);
    Task MarkRunCompletedAsync(DateTime runAt);
}
