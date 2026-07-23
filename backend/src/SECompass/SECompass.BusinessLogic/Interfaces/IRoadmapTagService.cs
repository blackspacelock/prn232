using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.RoadmapTag;

namespace SECompass.BusinessLogic.Interfaces;

public interface IRoadmapTagService
{
    Task<ServiceResult<List<RoadmapTagDto>>> GetByRoadmapAsync(Guid personalRoadmapId);
    Task<ServiceResult<RoadmapTagDto>> AddAsync(Guid personalRoadmapId, AddRoadmapTagDto dto);
    Task<ServiceResult<RoadmapTagDto>> UpdateAsync(Guid tagId, UpdateRoadmapTagDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid tagId);
}
