using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;

namespace SECompass.BusinessLogic.Interfaces;

public interface IJobScrapingSourceService
{
    Task<ServiceResult<List<JobScrapingSourceDto>>> GetAllAsync();
    Task<ServiceResult<JobScrapingSourceDto>> CreateAsync(CreateJobScrapingSourceDto dto);
    Task<ServiceResult<JobScrapingSourceDto>> UpdateAsync(Guid id, UpdateJobScrapingSourceDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
