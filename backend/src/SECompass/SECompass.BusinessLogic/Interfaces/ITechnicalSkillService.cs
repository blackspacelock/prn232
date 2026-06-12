using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;

namespace SECompass.BusinessLogic.Interfaces;

public interface ITechnicalSkillService
{
    Task<ServiceResult<List<TechnicalSkillDto>>> GetAllAsync();
}
