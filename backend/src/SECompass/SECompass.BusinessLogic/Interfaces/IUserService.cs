using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.User;

namespace SECompass.BusinessLogic.Interfaces;

public interface IUserService
{
    Task<ServiceResult<UserDto>> GetByIdAsync(Guid userId);
    Task<ServiceResult<UserDto>> UpdateAsync(Guid userId, UpdateUserDto dto);
    Task<ServiceResult<bool>> DeactivateAsync(Guid userId, bool physicalDelete = false);
}
