using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;

namespace SECompass.BusinessLogic.Interfaces;

public interface ITechnicalSkillService
{
    Task<ServiceResult<List<TechnicalSkillDto>>> GetAllAsync();
    Task<ServiceResult<TechnicalSkillDto>> CreateAsync(CreateTechnicalSkillDto dto);
    Task<ServiceResult<TechnicalSkillDto>> UpdateAsync(Guid id, UpdateTechnicalSkillDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
