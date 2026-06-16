using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
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

    public async Task<ServiceResult<TechnicalSkillDto>> CreateAsync(CreateTechnicalSkillDto dto)
    {
        var name = dto.Name.Trim();
        var category = dto.Category.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(category))
            return ServiceResult<TechnicalSkillDto>.Fail("Name and category are required.");

        var exists = await _uow.TechnicalSkills.ExistsAsync(s => s.Name == name);
        if (exists) return ServiceResult<TechnicalSkillDto>.Fail("Technical skill already exists.");

        var skill = new TechnicalSkill
        {
            Id = Guid.NewGuid(),
            Name = name,
            Category = category
        };

        await _uow.TechnicalSkills.AddAsync(skill);
        await _uow.SaveChangesAsync();
        return ServiceResult<TechnicalSkillDto>.Ok(_mapper.Map<TechnicalSkillDto>(skill));
    }

    public async Task<ServiceResult<TechnicalSkillDto>> UpdateAsync(Guid id, UpdateTechnicalSkillDto dto)
    {
        var skill = await _uow.TechnicalSkills.GetByIdAsync(id);
        if (skill == null) return ServiceResult<TechnicalSkillDto>.Fail("Technical skill not found.");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            var name = dto.Name.Trim();
            var exists = await _uow.TechnicalSkills.ExistsAsync(s => s.Id != id && s.Name == name);
            if (exists) return ServiceResult<TechnicalSkillDto>.Fail("Technical skill already exists.");
            skill.Name = name;
        }

        if (!string.IsNullOrWhiteSpace(dto.Category)) skill.Category = dto.Category.Trim();

        _uow.TechnicalSkills.Update(skill);
        await _uow.SaveChangesAsync();
        return ServiceResult<TechnicalSkillDto>.Ok(_mapper.Map<TechnicalSkillDto>(skill));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var skill = await _uow.TechnicalSkills.GetByIdAsync(id);
        if (skill == null) return ServiceResult<bool>.Fail("Technical skill not found.");

        _uow.TechnicalSkills.Delete(skill);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
