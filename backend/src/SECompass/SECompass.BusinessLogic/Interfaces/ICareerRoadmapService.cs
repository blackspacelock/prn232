using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;

namespace SECompass.BusinessLogic.Interfaces;

public interface ICareerRoadmapService
{
    Task<ServiceResult<CareerRoadmapDto>> CreateAsync(CreateCareerRoadmapDto dto);
    Task<ServiceResult<CareerRoadmapDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<List<CareerRoadmapDto>>> GetByCareerRoleAsync(Guid careerRoleId);
    Task<ServiceResult<CareerRoadmapWithNodesDto>> GetRoadmapWithNodesAsync(Guid roadmapId);
    Task<ServiceResult<bool>> AssignNodeAsync(Guid roadmapId, Guid nodeId);
    Task<ServiceResult<bool>> RemoveNodeAsync(Guid roadmapId, Guid nodeId);
    Task<ServiceResult<CareerRoadmapDto>> UpdateAsync(Guid id, UpdateCareerRoadmapDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
