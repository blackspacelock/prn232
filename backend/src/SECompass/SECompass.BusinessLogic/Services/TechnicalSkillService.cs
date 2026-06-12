using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class TechnicalSkillService : ITechnicalSkillService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public TechnicalSkillService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<List<TechnicalSkillDto>>> GetAllAsync()
    {
        var skills = await _uow.TechnicalSkills.GetAllAsync();
        var ordered = skills.OrderBy(s => s.Category).ThenBy(s => s.Name).ToList();
        return ServiceResult<List<TechnicalSkillDto>>.Ok(_mapper.Map<List<TechnicalSkillDto>>(ordered));
    }
}
