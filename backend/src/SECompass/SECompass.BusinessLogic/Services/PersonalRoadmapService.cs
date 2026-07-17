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
            var parentRoadmapNode = step.value.ParentStepIndex.HasValue &&
                step.value.ParentStepIndex.Value >= 0 &&
                step.value.ParentStepIndex.Value < roadmapNodes.Count
                    ? roadmapNodes[step.value.ParentStepIndex.Value]
                    : null;

            var node = new Node
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = step.value.Description?.Trim(),
                Order = step.index + 1,
                CreatedAt = now
            };
            await _uow.Nodes.AddAsync(node);

            foreach (var skillId in step.value.TechnicalSkillIds.Distinct())
            {
                if (!await _uow.TechnicalSkills.ExistsAsync(skill => skill.Id == skillId)) continue;
                await _uow.NodeTechnicalSkills.AddAsync(new NodeTechnicalSkill
                {
                    Id = Guid.NewGuid(),
                    NodeId = node.Id,
                    TechnicalSkillId = skillId,
                    CreatedAt = now
                });
            }

            foreach (var resourceDto in step.value.LearningResources)
            {
                var resourceName = resourceDto.Name.Trim();
                var resourceUrl = resourceDto.ResourceUrl.Trim();
                if (string.IsNullOrWhiteSpace(resourceName) || string.IsNullOrWhiteSpace(resourceUrl)) continue;

                await _uow.LearningResources.AddAsync(new LearningResource
                {
                    Id = Guid.NewGuid(),
                    NodeId = node.Id,
                    Name = resourceName,
                    ResourceUrl = resourceUrl,
                    ResourceType = string.IsNullOrWhiteSpace(resourceDto.ResourceType) ? "Article" : resourceDto.ResourceType.Trim(),
                    Provider = string.IsNullOrWhiteSpace(resourceDto.Provider) ? null : resourceDto.Provider.Trim(),
                    IsFree = resourceDto.IsFree,
                    CreatedAt = now
                });
            }

            var roadmapNode = new RoadmapNode
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = careerRoadmap.Id,
                NodeId = node.Id,
                ParentRoadmapNodeId = parentRoadmapNode?.Id,
                Order = step.index + 1,
                NodeType = "Topic",
                RequirementType = "Required",
                PositionX = parentRoadmapNode == null ? 120 + (step.index % 3) * 280 : (parentRoadmapNode.PositionX ?? 120) + 280,
                PositionY = parentRoadmapNode == null ? 120 + (step.index / 3) * 180 : (parentRoadmapNode.PositionY ?? 120) + ((step.index % 2 == 0) ? -110 : 110),
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

        for (var i = 1; i < roadmapNodes.Count; i++)
        {
            var parentRoadmapNodeId = roadmapNodes[i].ParentRoadmapNodeId ?? roadmapNodes[i - 1].Id;
            await _uow.RoadmapNodeEdges.AddAsync(new RoadmapNodeEdge
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = careerRoadmap.Id,
                FromRoadmapNodeId = parentRoadmapNodeId,
                ToRoadmapNodeId = roadmapNodes[i].Id,
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

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> CopySharedAsync(Guid profileId, Guid sharedPersonalRoadmapId)
    {
        var sharedRoadmap = await _uow.PersonalRoadmaps.GetSharedWithNodesAndProgressAsync(sharedPersonalRoadmapId);
        if (sharedRoadmap == null) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Shared roadmap not found.");

        return await GenerateAsync(profileId, sharedRoadmap.CareerRoadmapId);
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
