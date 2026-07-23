using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.NodeProgress;
using SECompass.DataAccess.Enums;

namespace SECompass.BusinessLogic.Interfaces;

public interface INodeProgressService
{
    Task<ServiceResult<NodeProgressDto>> UpdateStatusAsync(Guid nodeProgressId, NodeProgressStatus status, string? note);
    Task<ServiceResult<NodeProgressDto>> UpdateDetailsAsync(Guid nodeProgressId, UpdateNodeProgressDetailsDto dto);
    Task<ServiceResult<List<NodeProgressDto>>> GetByPersonalRoadmapAsync(Guid personalRoadmapId);
    Task<ServiceResult<List<NodeProgressDto>>> GetCompletedNodesAsync(Guid personalRoadmapId);
}
