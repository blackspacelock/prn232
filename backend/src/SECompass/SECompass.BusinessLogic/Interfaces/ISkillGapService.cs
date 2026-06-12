using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;

namespace SECompass.BusinessLogic.Interfaces;

public interface ISkillGapService
{
    Task<ServiceResult<SkillGapAnalysisDto>> AnalyzeSkillGapAsync(Guid profileId);
}
