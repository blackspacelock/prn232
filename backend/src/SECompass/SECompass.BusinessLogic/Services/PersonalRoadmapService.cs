using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Enums;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class PersonalRoadmapService : IPersonalRoadmapService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public PersonalRoadmapService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> GenerateAsync(Guid profileId, Guid careerRoadmapId)
    {
        var profileExists = await _uow.Profiles.ExistsAsync(p => p.UserId == profileId);
        if (!profileExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Profile not found.");

        var roadmap = await _uow.CareerRoadmaps.GetByIdAsync(careerRoadmapId);
        if (roadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Career roadmap not found.");

        var roadmapNodeIds = await GetRoadmapNodeIdsAsync(careerRoadmapId);

        var personalRoadmap = new PersonalRoadmap
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            CareerRoadmapId = careerRoadmapId,
            ProgressPercentage = 0,
            IsActive = false
        };
        await _uow.PersonalRoadmaps.AddAsync(personalRoadmap);

        var nodeProgresses = roadmapNodeIds.Select(nodeId => new NodeProgress
        {
            Id = Guid.NewGuid(),
            PersonalRoadmapId = personalRoadmap.Id,
            RoadmapNodeId = nodeId,
            Status = NodeProgressStatus.NotStarted
        }).ToList();

        await _uow.NodeProgresses.BulkInsertAsync(nodeProgresses);
        await _uow.SaveChangesAsync();

        var result = await _uow.PersonalRoadmaps.GetWithNodesAndProgressAsync(personalRoadmap.Id);
        return ServiceResult<PersonalRoadmapDetailDto>.Ok(_mapper.Map<PersonalRoadmapDetailDto>(result));
    }

    private async Task<List<Guid>> GetRoadmapNodeIdsAsync(Guid careerRoadmapId)
    {
        var roadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == careerRoadmapId);
        return roadmapNodes
            .OrderBy(rn => rn.Order)
            .ThenBy(rn => rn.CreatedAt)
            .Select(rn => rn.Id)
            .ToList();
    }

    public async Task<ServiceResult<List<PersonalRoadmapDto>>> GetByProfileAsync(Guid profileId)
    {
        var roadmaps = await _uow.PersonalRoadmaps.GetByProfileWithCareerRoadmapAsync(profileId);
        return ServiceResult<List<PersonalRoadmapDto>>.Ok(_mapper.Map<List<PersonalRoadmapDto>>(roadmaps));
    }

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> GetWithProgressAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetWithNodesAndProgressAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Personal roadmap not found.");
        return ServiceResult<PersonalRoadmapDetailDto>.Ok(_mapper.Map<PersonalRoadmapDetailDto>(roadmap));
    }

    public async Task<ServiceResult<decimal>> RecalculateProgressAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetByIdAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<decimal>.Fail("Personal roadmap not found.");

        var allProgress = await _uow.NodeProgresses.GetByPersonalRoadmapAsync(personalRoadmapId);
        var total = allProgress.Count();
        var completed = allProgress.Count(np => np.Status == NodeProgressStatus.Completed);

        var percentage = total == 0 ? 0m : Math.Round((decimal)completed / total * 100, 2);
        roadmap.ProgressPercentage = percentage;
        roadmap.UpdatedAt = DateTime.Now;
        _uow.PersonalRoadmaps.Update(roadmap);
        await _uow.SaveChangesAsync();

        return ServiceResult<decimal>.Ok(percentage);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetByIdAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<bool>.Fail("Personal roadmap not found.");
        _uow.PersonalRoadmaps.Delete(roadmap);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> SetActiveAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetByIdAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<bool>.Fail("Personal roadmap not found.");

        roadmap.IsActive = !roadmap.IsActive;
        roadmap.UpdatedAt = DateTime.Now;
        _uow.PersonalRoadmaps.Update(roadmap);

        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
