using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class SkillService : ISkillService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public SkillService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<SkillDto>> AddSkillAsync(AddSkillDto dto)
    {
        var skill = new Skill
        {
            Id = Guid.NewGuid(),
            ProfileId = dto.ProfileId,
            SkillName = dto.SkillName,
            Note = dto.Note
        };
        await _uow.Skills.AddAsync(skill);
        await _uow.SaveChangesAsync();
        return ServiceResult<SkillDto>.Ok(_mapper.Map<SkillDto>(skill));
    }

    public async Task<ServiceResult<bool>> RemoveSkillAsync(Guid skillId)
    {
        var skill = await _uow.Skills.GetByIdAsync(skillId);
        if (skill == null) return ServiceResult<bool>.Fail("Skill not found.");
        _uow.Skills.Delete(skill);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<List<SkillDto>>> GetSkillsByProfileAsync(Guid profileId)
    {
        var skills = await _uow.Skills.FindAsync(s => s.ProfileId == profileId);
        return ServiceResult<List<SkillDto>>.Ok(_mapper.Map<List<SkillDto>>(skills));
    }
}
