using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Profile;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class ProfileService : IProfileService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ProfileService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<ProfileDto>> GetByUserIdAsync(Guid userId)
    {
        var profiles = await _uow.Profiles.FindAsync(p => p.UserId == userId);
        var profile = profiles.FirstOrDefault();
        if (profile == null) return ServiceResult<ProfileDto>.Fail("Profile not found.");
        return ServiceResult<ProfileDto>.Ok(_mapper.Map<ProfileDto>(profile));
    }

    public async Task<ServiceResult<ProfileDto>> UpdateAsync(Guid userId, UpdateProfileDto dto)
    {
        var profiles = await _uow.Profiles.FindAsync(p => p.UserId == userId);
        var profile = profiles.FirstOrDefault();
        if (profile == null) return ServiceResult<ProfileDto>.Fail("Profile not found.");

        if (dto.BioDescription != null) profile.BioDescription = dto.BioDescription;
        if (dto.PhoneNumber != null) profile.PhoneNumber = dto.PhoneNumber;
        if (dto.University != null) profile.University = dto.University;
        if (dto.Major != null) profile.Major = dto.Major;
        if (dto.StudiedYear.HasValue) profile.StudiedYear = dto.StudiedYear;

        _uow.Profiles.Update(profile);
        await _uow.SaveChangesAsync();
        return ServiceResult<ProfileDto>.Ok(_mapper.Map<ProfileDto>(profile));
    }

    public async Task<ServiceResult<ProfileWithSkillsDto>> GetProfileWithSkillsAsync(Guid userId)
    {
        var profiles = await _uow.Profiles.FindAsync(p => p.UserId == userId);
        var profile = profiles.FirstOrDefault();
        if (profile == null) return ServiceResult<ProfileWithSkillsDto>.Fail("Profile not found.");

        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<ProfileWithSkillsDto>.Fail("User not found.");
        profile.User = user;

        var profileSkills = (await _uow.ProfileTechnicalSkills.FindAsync(s => s.ProfileId == userId)).ToList();
        if (profileSkills.Count > 0)
        {
            var technicalSkillIds = profileSkills.Select(s => s.TechnicalSkillId).Distinct().ToList();
            var technicalSkills = (await _uow.TechnicalSkills.FindAsync(t => technicalSkillIds.Contains(t.Id)))
                .ToDictionary(t => t.Id);

            foreach (var profileSkill in profileSkills)
            {
                profileSkill.TechnicalSkill = technicalSkills[profileSkill.TechnicalSkillId];
            }
        }
        profile.ProfileTechnicalSkills = profileSkills;

        return ServiceResult<ProfileWithSkillsDto>.Ok(_mapper.Map<ProfileWithSkillsDto>(profile));
    }
}
