using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.User;

namespace SECompass.BusinessLogic.Interfaces;

public interface IUserService
{
    Task<ServiceResult<List<UserDto>>> GetAllAsync();
    Task<ServiceResult<UserDto>> GetByIdAsync(Guid userId);
    Task<ServiceResult<AdminOverviewDto>> GetAdminOverviewAsync();
    Task<ServiceResult<UserDto>> UpdateAsync(Guid userId, UpdateUserDto dto);
    Task<ServiceResult<UserDto>> AdminUpdateAsync(Guid userId, AdminUpdateUserDto dto);
    Task<ServiceResult<bool>> DeactivateAsync(Guid userId);
}
