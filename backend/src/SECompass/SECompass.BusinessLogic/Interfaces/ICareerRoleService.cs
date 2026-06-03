using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRole;

namespace SECompass.BusinessLogic.Interfaces;

public interface ICareerRoleService
{
    Task<ServiceResult<CareerRoleDto>> CreateAsync(CreateCareerRoleDto dto);
    Task<ServiceResult<List<CareerRoleDto>>> GetAllAsync();
    Task<ServiceResult<CareerRoleDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<CareerRoleDto>> UpdateAsync(Guid id, UpdateCareerRoleDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
