using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.DTOs.RoadmapNode;
using SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;

namespace SECompass.BusinessLogic.Interfaces;

public interface ICareerRoadmapService
{
    Task<ServiceResult<CareerRoadmapDto>> CreateAsync(CreateCareerRoadmapDto dto);
    Task<ServiceResult<List<CareerRoadmapDto>>> GetAllAsync();
    Task<ServiceResult<CareerRoadmapDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<List<CareerRoadmapDto>>> GetByCareerRoleAsync(Guid careerRoleId);
    Task<ServiceResult<CareerRoadmapWithNodesDto>> GetRoadmapWithNodesAsync(Guid roadmapId);
    Task<ServiceResult<RoadmapNodeDto>> AssignNodeAsync(Guid roadmapId, CreateRoadmapNodeDto dto);
    Task<ServiceResult<RoadmapNodeDto>> AssignNodeAsync(Guid roadmapId, Guid nodeId);
    Task<ServiceResult<RoadmapNodeDto>> UpdateRoadmapNodeAsync(Guid roadmapId, Guid roadmapNodeId, UpdateRoadmapNodeDto dto);
    Task<ServiceResult<bool>> RemoveRoadmapNodeAsync(Guid roadmapId, Guid roadmapNodeId);
    Task<ServiceResult<bool>> RemoveNodeAsync(Guid roadmapId, Guid nodeId);
    Task<ServiceResult<RoadmapNodeEdgeDto>> CreateEdgeAsync(Guid roadmapId, CreateRoadmapNodeEdgeDto dto);
    Task<ServiceResult<RoadmapNodeEdgeDto>> UpdateEdgeAsync(Guid roadmapId, Guid edgeId, UpdateRoadmapNodeEdgeDto dto);
    Task<ServiceResult<bool>> DeleteEdgeAsync(Guid roadmapId, Guid edgeId);
    Task<ServiceResult<CareerRoadmapDto>> UpdateAsync(Guid id, UpdateCareerRoadmapDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
