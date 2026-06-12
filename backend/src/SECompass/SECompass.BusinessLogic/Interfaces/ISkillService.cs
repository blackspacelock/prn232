using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;

namespace SECompass.BusinessLogic.Interfaces;

public interface ISkillService
{
    Task<ServiceResult<SkillDto>> AddSkillAsync(AddSkillDto dto);
    Task<ServiceResult<bool>> RemoveSkillAsync(Guid skillId);
    Task<ServiceResult<List<SkillDto>>> GetSkillsByProfileAsync(Guid profileId);
}
