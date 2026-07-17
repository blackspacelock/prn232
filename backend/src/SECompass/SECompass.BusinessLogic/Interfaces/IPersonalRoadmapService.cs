using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;

namespace SECompass.BusinessLogic.Interfaces;

public interface IPersonalRoadmapService
{
    Task<ServiceResult<PersonalRoadmapDetailDto>> CreateAsync(CreatePersonalRoadmapDto dto);
    Task<ServiceResult<PersonalRoadmapDetailDto>> GenerateAsync(Guid profileId, Guid careerRoadmapId);
    Task<ServiceResult<PersonalRoadmapDetailDto>> CopySharedAsync(Guid profileId, Guid sharedPersonalRoadmapId);
    Task<ServiceResult<List<PersonalRoadmapDto>>> GetByProfileAsync(Guid profileId);
    Task<ServiceResult<List<PersonalRoadmapDto>>> GetSharedAsync();
    Task<ServiceResult<PersonalRoadmapDetailDto>> GetWithProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<PersonalRoadmapDetailDto>> GetSharedWithProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<decimal>> RecalculateProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> DeleteAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> ToggleActiveAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> ToggleSharedAsync(Guid personalRoadmapId);
}
