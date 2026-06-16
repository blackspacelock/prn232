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
        var skillName = dto.SkillName.Trim();
        if (string.IsNullOrWhiteSpace(skillName))
            return ServiceResult<SkillDto>.Fail("Skill name is required.");

        var matches = await _uow.TechnicalSkills.FindAsync(
            t => t.Name.ToLower() == skillName.ToLower());
        var technicalSkill = matches.FirstOrDefault();

        if (technicalSkill == null)
        {
            technicalSkill = new TechnicalSkill
            {
                Id = Guid.NewGuid(),
                Name = skillName,
                Category = "Other"
            };
            await _uow.TechnicalSkills.AddAsync(technicalSkill);
        }

        var alreadyAdded = await _uow.ProfileTechnicalSkills.ExistsAsync(
            p => p.ProfileId == dto.ProfileId && p.TechnicalSkillId == technicalSkill.Id);
        if (alreadyAdded)
            return ServiceResult<SkillDto>.Fail("This skill is already in your profile.");

        var profileSkill = new ProfileTechnicalSkill
        {
            Id = Guid.NewGuid(),
            ProfileId = dto.ProfileId,
            TechnicalSkillId = technicalSkill.Id,
            Note = dto.Note,
            TechnicalSkill = technicalSkill
        };
        await _uow.ProfileTechnicalSkills.AddAsync(profileSkill);
        await _uow.SaveChangesAsync();

        return ServiceResult<SkillDto>.Ok(_mapper.Map<SkillDto>(profileSkill));
    }

    public async Task<ServiceResult<bool>> RemoveSkillAsync(Guid skillId)
    {
        var profileSkill = await _uow.ProfileTechnicalSkills.GetByIdAsync(skillId);
        if (profileSkill == null) return ServiceResult<bool>.Fail("Skill not found.");
        _uow.ProfileTechnicalSkills.Delete(profileSkill);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<List<SkillDto>>> GetSkillsByProfileAsync(Guid profileId)
    {
        var profileSkills = (await _uow.ProfileTechnicalSkills.FindAsync(p => p.ProfileId == profileId)).ToList();
        if (profileSkills.Count == 0) return ServiceResult<List<SkillDto>>.Ok(new List<SkillDto>());

        var technicalSkillIds = profileSkills.Select(p => p.TechnicalSkillId).Distinct().ToList();
        var technicalSkills = (await _uow.TechnicalSkills.FindAsync(t => technicalSkillIds.Contains(t.Id)))
            .ToDictionary(t => t.Id);

        foreach (var profileSkill in profileSkills)
        {
            profileSkill.TechnicalSkill = technicalSkills[profileSkill.TechnicalSkillId];
        }

        return ServiceResult<List<SkillDto>>.Ok(_mapper.Map<List<SkillDto>>(profileSkills));
    }
}
