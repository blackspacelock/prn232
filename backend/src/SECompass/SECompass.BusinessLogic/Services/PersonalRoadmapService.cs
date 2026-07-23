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

    public async Task<ServiceResult<PersonalRoadmapDetailDto>> CreateCustomAsync(CreateCustomPersonalRoadmapRequestDto dto)
    {
        var profileExists = await _uow.Profiles.ExistsAsync(p => p.UserId == dto.ProfileId);
        if (!profileExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Profile not found.");

        var roleExists = await _uow.CareerRoles.ExistsAsync(r => r.Id == dto.CareerRoleId);
        if (!roleExists) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Career role not found.");

        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return ServiceResult<PersonalRoadmapDetailDto>.Fail("Roadmap name is required.");

        var validNodes = dto.Nodes
            .Where(n => !string.IsNullOrWhiteSpace(n.ClientId) && !string.IsNullOrWhiteSpace(n.Name))
            .ToList();
        if (validNodes.Count == 0) return ServiceResult<PersonalRoadmapDetailDto>.Fail("At least one roadmap node is required.");

        if (validNodes.Select(n => n.ClientId).Distinct(StringComparer.OrdinalIgnoreCase).Count() != validNodes.Count)
            return ServiceResult<PersonalRoadmapDetailDto>.Fail("Roadmap node client IDs must be unique.");

        var roadmap = new CareerRoadmap
        {
            Id = Guid.NewGuid(),
            CareerRoleId = dto.CareerRoleId,
            Name = name,
            Description = dto.Description,
            IsCustom = true
        };
        await _uow.CareerRoadmaps.AddAsync(roadmap);

        var nodesByClientId = new Dictionary<string, Node>(StringComparer.OrdinalIgnoreCase);
        var roadmapNodesByClientId = new Dictionary<string, RoadmapNode>(StringComparer.OrdinalIgnoreCase);

        foreach (var requestNode in validNodes.OrderBy(n => n.ParentClientId == null ? 0 : 1).ThenBy(n => n.Order))
        {
            Guid? parentNodeId = null;
            Guid? parentRoadmapNodeId = null;
            if (!string.IsNullOrWhiteSpace(requestNode.ParentClientId))
            {
                if (!nodesByClientId.TryGetValue(requestNode.ParentClientId, out var parentNode) ||
                    !roadmapNodesByClientId.TryGetValue(requestNode.ParentClientId, out var parentRoadmapNode))
                {
                    return ServiceResult<PersonalRoadmapDetailDto>.Fail("Parent node must be created before its branch nodes.");
                }
                parentNodeId = parentNode.Id;
                parentRoadmapNodeId = parentRoadmapNode.Id;
            }

            var node = new Node
            {
                Id = Guid.NewGuid(),
                ParentNodeId = parentNodeId,
                Name = requestNode.Name.Trim(),
                Description = requestNode.Description,
                Order = requestNode.Order
            };
            await _uow.Nodes.AddAsync(node);
            nodesByClientId[requestNode.ClientId] = node;

            foreach (var requestSkill in requestNode.TechnicalSkills.Where(s => !string.IsNullOrWhiteSpace(s.Name)))
            {
                var skillName = requestSkill.Name.Trim();
                var skillCategory = string.IsNullOrWhiteSpace(requestSkill.Category) ? "General" : requestSkill.Category.Trim();
                var skill = (await _uow.TechnicalSkills.FindAsync(s => s.Name == skillName)).FirstOrDefault();
                if (skill == null)
                {
                    skill = new TechnicalSkill
                    {
                        Id = Guid.NewGuid(),
                        Name = skillName,
                        Category = skillCategory
                    };
                    await _uow.TechnicalSkills.AddAsync(skill);
                }

                await _uow.NodeTechnicalSkills.AddAsync(new NodeTechnicalSkill
                {
                    Id = Guid.NewGuid(),
                    NodeId = node.Id,
                    TechnicalSkillId = skill.Id
                });
            }

            foreach (var requestResource in requestNode.LearningResources.Where(r => !string.IsNullOrWhiteSpace(r.Name)))
            {
                await _uow.LearningResources.AddAsync(new LearningResource
                {
                    Id = Guid.NewGuid(),
                    NodeId = node.Id,
                    Name = requestResource.Name.Trim(),
                    ResourceUrl = requestResource.ResourceUrl,
                    ResourceType = string.IsNullOrWhiteSpace(requestResource.ResourceType) ? "Article" : requestResource.ResourceType,
                    Provider = requestResource.Provider,
                    IsFree = requestResource.IsFree
                });
            }

            var roadmapNode = new RoadmapNode
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = roadmap.Id,
                NodeId = node.Id,
                ParentRoadmapNodeId = parentRoadmapNodeId,
                Order = requestNode.Order,
                NodeType = string.IsNullOrWhiteSpace(requestNode.NodeType) ? "Topic" : requestNode.NodeType,
                RequirementType = string.IsNullOrWhiteSpace(requestNode.RequirementType) ? "Required" : requestNode.RequirementType,
                PositionX = requestNode.PositionX,
                PositionY = requestNode.PositionY,
                Node = node
            };
            await _uow.RoadmapNodes.AddAsync(roadmapNode);
            roadmapNodesByClientId[requestNode.ClientId] = roadmapNode;
        }

        foreach (var requestEdge in dto.Edges.Where(e => !string.IsNullOrWhiteSpace(e.FromClientId) && !string.IsNullOrWhiteSpace(e.ToClientId)))
        {
            if (!roadmapNodesByClientId.TryGetValue(requestEdge.FromClientId, out var fromNode) ||
                !roadmapNodesByClientId.TryGetValue(requestEdge.ToClientId, out var toNode))
            {
                return ServiceResult<PersonalRoadmapDetailDto>.Fail("Roadmap edges must reference existing nodes.");
            }

            if (fromNode.Id == toNode.Id) return ServiceResult<PersonalRoadmapDetailDto>.Fail("An edge cannot connect a roadmap node to itself.");

            await _uow.RoadmapNodeEdges.AddAsync(new RoadmapNodeEdge
            {
                Id = Guid.NewGuid(),
                CareerRoadmapId = roadmap.Id,
                FromRoadmapNodeId = fromNode.Id,
                ToRoadmapNodeId = toNode.Id,
                EdgeType = string.IsNullOrWhiteSpace(requestEdge.EdgeType) ? "Next" : requestEdge.EdgeType
            });
        }

        var personalRoadmap = new PersonalRoadmap
        {
            Id = Guid.NewGuid(),
            ProfileId = dto.ProfileId,
            CareerRoadmapId = roadmap.Id,
            ProgressPercentage = 0,
            IsActive = false
        };
        await _uow.PersonalRoadmaps.AddAsync(personalRoadmap);

        foreach (var roadmapNode in roadmapNodesByClientId.Values.OrderBy(rn => rn.Order))
        {
            await _uow.NodeProgresses.AddAsync(new NodeProgress
            {
                Id = Guid.NewGuid(),
                PersonalRoadmapId = personalRoadmap.Id,
                RoadmapNodeId = roadmapNode.Id,
                Status = NodeProgressStatus.NotStarted
            });
        }

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
}
