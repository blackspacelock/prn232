using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;

namespace SECompass.BusinessLogic.Interfaces;

public interface IJobTrendService
{
    Task<ServiceResult<JobTrendDto>> CreateAsync(CreateJobTrendDto dto);
    Task<ServiceResult<List<JobTrendDto>>> GetByRegionAsync(string region);
    Task<ServiceResult<List<JobTrendDto>>> GetTopTrendingAsync(int count);
    Task<ServiceResult<List<JobTrendDto>>> GetBySkillAsync(string techSkill);
    Task<ServiceResult<List<JobTrendDto>>> GetBySnapshotDateAsync(DateTime date);
    Task<ServiceResult<JobTrendDto>> UpdateAsync(Guid id, UpdateJobTrendDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
