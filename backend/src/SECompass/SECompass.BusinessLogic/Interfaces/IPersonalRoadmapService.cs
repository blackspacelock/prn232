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
    Task<ServiceResult<PersonalRoadmapDetailDto>> UpdateAsync(Guid personalRoadmapId, UpdatePersonalRoadmapDto dto);
    Task<ServiceResult<PersonalRoadmapDetailDto>> AddStepAsync(Guid personalRoadmapId, AddPersonalRoadmapStepDto dto);
    Task<ServiceResult<bool>> DeleteStepAsync(Guid personalRoadmapId, Guid roadmapNodeId);
    Task<ServiceResult<bool>> UpdateStepPositionAsync(Guid personalRoadmapId, Guid roadmapNodeId, UpdatePersonalRoadmapStepPositionDto dto);
    Task<ServiceResult<bool>> UpdateStepConnectionAsync(Guid personalRoadmapId, Guid roadmapNodeId, UpdatePersonalRoadmapStepConnectionDto dto);
    Task<ServiceResult<decimal>> RecalculateProgressAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> DeleteAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> ToggleActiveAsync(Guid personalRoadmapId);
    Task<ServiceResult<bool>> ToggleSharedAsync(Guid personalRoadmapId);
}
