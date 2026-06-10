using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.LearningResource;

namespace SECompass.BusinessLogic.Interfaces;

public interface ILearningResourceService
{
    Task<ServiceResult<LearningResourceDto>> CreateAsync(Guid nodeId, CreateLearningResourceDto dto);
    Task<ServiceResult<List<LearningResourceDto>>> GetByNodeAsync(Guid nodeId);
    Task<ServiceResult<List<LearningResourceDto>>> GetFreeByNodeAsync(Guid nodeId);
    Task<ServiceResult<List<LearningResourceDto>>> GetByTypeAsync(Guid nodeId, string resourceType);
    Task<ServiceResult<LearningResourceDto>> UpdateAsync(Guid id, UpdateLearningResourceDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id, bool physicalDelete = false);
}
