using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Node;

namespace SECompass.BusinessLogic.Interfaces;

public interface INodeService
{
    Task<ServiceResult<NodeDto>> CreateAsync(CreateNodeDto dto);
    Task<ServiceResult<NodeDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<List<NodeDto>>> GetChildrenAsync(Guid parentId);
    Task<ServiceResult<NodeHierarchyDto>> GetHierarchyAsync(Guid rootId);
    Task<ServiceResult<NodeDto>> UpdateAsync(Guid id, UpdateNodeDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
