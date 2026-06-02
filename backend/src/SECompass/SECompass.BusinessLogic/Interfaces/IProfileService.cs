using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Profile;

namespace SECompass.BusinessLogic.Interfaces;

public interface IProfileService
{
    Task<ServiceResult<ProfileDto>> GetByUserIdAsync(Guid userId);
    Task<ServiceResult<ProfileDto>> UpdateAsync(Guid userId, UpdateProfileDto dto);
    Task<ServiceResult<ProfileWithSkillsDto>> GetProfileWithSkillsAsync(Guid userId);
}
