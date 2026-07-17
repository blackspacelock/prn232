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

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> CreateAsync(CreatePersonalRoadmapDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Roadmap name is required.");
        if (dto.Steps.Count == 0) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Add at least one roadmap step.");

        var profileExists = await _uow.Profiles.ExistsAsync(p => p.UserId == dto.ProfileId);
        if (!profileExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Profile not found.");

        var roleExists = await _uow.CareerRoles.ExistsAsync(r => r.Id == dto.CareerRoleId);
        if (!roleExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Career role not found.");

        var now = DateTime.Now;
        var careerRoadmap = new CareerRoadmap
        {
            Id = Guid.NewGuid(),
            CareerRoleId = dto.CareerRoleId,
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? dto.Desire?.Trim() : dto.Description.Trim(),
            IsCustom = true,
            CreatedAt = now
        };
        await _uow.CareerRoadmaps.AddAsync(careerRoadmap);

        var roadmapNodes = new List<RoadmapNode>();
        var nodeProgresses = new List<NodeProgress>();
        var personalRoadmap = new PersonalRoadmap
        {
            Id = Guid.NewGuid(),
            ProfileId = dto.ProfileId,
            CareerRoadmapId = careerRoadmap.Id,
            Note = dto.Desire?.Trim(),
            ProgressPercentage = 0,
            IsActive = !(await _uow.PersonalRoadmaps.FindAsync(pr => pr.ProfileId == dto.ProfileId)).Any(pr => pr.IsActive),
            IsShared = false,
            CreatedAt = now
        };
        await _uow.PersonalRoadmaps.AddAsync(personalRoadmap);

        foreach (var step in dto.Steps.Select((value, index) => new { value, index }))
        {
            var name = step.value.Name.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            var node = new Node
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = step.value.Description?.Trim(),
                Order = step.index + 1,
                CreatedAt = now
            };
            await _uow.Nodes.AddAsync(node);

            var roadmapNode = new RoadmapNode
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = careerRoadmap.Id,
                NodeId = node.Id,
                Order = step.index + 1,
                NodeType = "Topic",
                RequirementType = "Required",
                PositionX = 120 + (step.index % 3) * 280,
                PositionY = 120 + (step.index / 3) * 180,
                Node = node,
                CreatedAt = now
            };
            roadmapNodes.Add(roadmapNode);
            await _uow.RoadmapNodes.AddAsync(roadmapNode);

            nodeProgresses.Add(new NodeProgress
            {
                Id = Guid.NewGuid(),
                PersonalRoadmapId = personalRoadmap.Id,
                RoadmapNodeId = roadmapNode.Id,
                Status = NodeProgressStatus.NotStarted,
                CreatedAt = now
            });
        }

        if (roadmapNodes.Count == 0) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Add at least one roadmap step.");

        for (var i = 0; i < roadmapNodes.Count - 1; i++)
        {
            await _uow.RoadmapNodeEdges.AddAsync(new RoadmapNodeEdge
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = careerRoadmap.Id,
                FromRoadmapNodeId = roadmapNodes[i].Id,
                ToRoadmapNodeId = roadmapNodes[i + 1].Id,
                EdgeType = "Next",
                CreatedAt = now
            });
        }

        await _uow.NodeProgresses.BulkInsertAsync(nodeProgresses);
        await _uow.SaveChangesAsync();

        var result = await _uow.PersonalRoadmaps.GetWithNodesAndProgressAsync(personalRoadmap.Id);
        return ServiceResult<PersonalRoadmapDetailDto>.Ok(_mapper.Map<PersonalRoadmapDetailDto>(result));
    }

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> GenerateAsync(Guid profileId, Guid careerRoadmapId)
    {
        var profileExists = await _uow.Profiles.ExistsAsync(p => p.UserId == profileId);
        if (!profileExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Profile not found.");

        var roadmap = await _uow.CareerRoadmaps.GetByIdAsync(careerRoadmapId);
        if (roadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Career roadmap not found.");

        var roadmapNodeIds = await GetRoadmapNodeIdsAsync(careerRoadmapId);

        var existingRoadmaps = await _uow.PersonalRoadmaps.FindAsync(pr => pr.ProfileId == profileId);
        var hasActiveRoadmap = existingRoadmaps.Any(pr => pr.IsActive);

        var personalRoadmap = new PersonalRoadmap
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            CareerRoadmapId = careerRoadmapId,
            ProgressPercentage = 0,
            IsActive = !hasActiveRoadmap
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
        var roadmaps = await _uow.PersonalRoadmaps.GetByProfileWithProgressAsync(profileId);
        var dtos = roadmaps.Select(r =>
        {
            var dto = _mapper.Map<PersonalRoadmapDto>(r);
            dto.InProgressCount = r.NodeProgresses?.Count(np => np.Status == NodeProgressStatus.InProgress) ?? 0;
            return dto;
        }).ToList();
        return ServiceResult<List<PersonalRoadmapDto>>.Ok(dtos);
    }

    public async Task<ServiceResult<List<PersonalRoadmapDto>>> GetSharedAsync()
    {
        var roadmaps = await _uow.PersonalRoadmaps.GetSharedWithProgressAsync();
        var dtos = roadmaps.Select(r =>
        {
            var dto = _mapper.Map<PersonalRoadmapDto>(r);
            dto.InProgressCount = r.NodeProgresses?.Count(np => np.Status == NodeProgressStatus.InProgress) ?? 0;
            return dto;
        }).ToList();
        return ServiceResult<List<PersonalRoadmapDto>>.Ok(dtos);
    }

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> GetWithProgressAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetWithNodesAndProgressAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Personal roadmap not found.");
        return ServiceResult<PersonalRoadmapDetailDto>.Ok(_mapper.Map<PersonalRoadmapDetailDto>(roadmap));
    }

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> GetSharedWithProgressAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetSharedWithNodesAndProgressAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Shared roadmap not found.");
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

    public async Task<ServiceResult<bool>> ToggleActiveAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetByIdAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<bool>.Fail("Personal roadmap not found.");

        roadmap.IsActive = !roadmap.IsActive;
        roadmap.UpdatedAt = DateTime.Now;
        _uow.PersonalRoadmaps.Update(roadmap);

        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> ToggleSharedAsync(Guid personalRoadmapId)
    {
        var roadmap = await _uow.PersonalRoadmaps.GetByIdAsync(personalRoadmapId);
        if (roadmap == null) return ServiceResult<bool>.Fail("Personal roadmap not found.");

        roadmap.IsShared = !roadmap.IsShared;
        roadmap.SharedAt = roadmap.IsShared ? DateTime.Now : null;
        roadmap.UpdatedAt = DateTime.Now;
        _uow.PersonalRoadmaps.Update(roadmap);

        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
