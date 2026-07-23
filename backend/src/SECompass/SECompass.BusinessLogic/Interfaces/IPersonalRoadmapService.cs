using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;

namespace SECompass.BusinessLogic.Interfaces;

public interface IPersonalRoadmapService
{
    Task<ServiceResult<PersonalRoadmapDetailDto>> GenerateAsync(Guid profileId, Guid careerRoadmapId);
    Task<ServiceResult<PersonalRoadmapDetailDto>> CreateCustomAsync(CreateCustomPersonalRoadmapRequestDto dto);
    Task<ServiceResult<List<PersonalRoadmapDto>>> GetByProfileAsync(Guid profileId);
    Task<ServiceResult<PersonalRoadmapDetailDto>> GetWithProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<decimal>> RecalculateProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> DeleteAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> ToggleActiveAsync(Guid personalRoadmapId);
}
