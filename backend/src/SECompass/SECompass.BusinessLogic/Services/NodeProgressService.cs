using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.NodeProgress;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Enums;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class NodeProgressService : INodeProgressService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IPersonalRoadmapService _personalRoadmapService;

    public NodeProgressService(IUnitOfWork uow, IMapper mapper, IPersonalRoadmapService personalRoadmapService)
    {
        _uow = uow;
        _mapper = mapper;
        _personalRoadmapService = personalRoadmapService;
    }

    public async Task<ServiceResult<NodeProgressDto>> UpdateStatusAsync(Guid nodeProgressId, NodeProgressStatus status, string? note)
    {
        var np = await _uow.NodeProgresses.GetByIdAsync(nodeProgressId);
        if (np == null) return ServiceResult<NodeProgressDto>.Fail("Node progress not found.");

        np.Status = status;
        if (note != null) np.Note = note;
        _uow.NodeProgresses.Update(np);
        await _uow.SaveChangesAsync();

        await _personalRoadmapService.RecalculateProgressAsync(np.PersonalRoadmapId);

        var roadmapNode = await _uow.RoadmapNodes.GetByIdAsync(np.RoadmapNodeId);
        if (roadmapNode != null)
        {
            roadmapNode.Node = (await _uow.Nodes.GetByIdAsync(roadmapNode.NodeId))!;
            np.RoadmapNode = roadmapNode;
        }

        return ServiceResult<NodeProgressDto>.Ok(_mapper.Map<NodeProgressDto>(np));
    }

    public async Task<ServiceResult<NodeProgressDto>> UpdateDetailsAsync(Guid nodeProgressId, UpdateNodeProgressDetailsDto dto)
    {
        var np = await _uow.NodeProgresses.GetByIdAsync(nodeProgressId);
        if (np == null) return ServiceResult<NodeProgressDto>.Fail("Node progress not found.");

        var roadmapNode = await _uow.RoadmapNodes.GetByIdAsync(np.RoadmapNodeId);
        if (roadmapNode == null) return ServiceResult<NodeProgressDto>.Fail("Roadmap step not found.");

        var node = await _uow.Nodes.GetByIdAsync(roadmapNode.NodeId);
        if (node == null) return ServiceResult<NodeProgressDto>.Fail("Step content not found.");

        if (dto.Name != null)
        {
            var trimmedName = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(trimmedName))
            {
                return ServiceResult<NodeProgressDto>.Fail("Step name is required.");
            }
            node.Name = trimmedName;
        }

        if (dto.Description != null)
        {
            node.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        }

        if (dto.Note != null)
        {
            np.Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        }

        if (dto.TechnicalSkillIds != null)
        {
            var existingSkills = await _uow.NodeTechnicalSkills.FindAsync(nts => nts.NodeId == node.Id);
            foreach (var existingSkill in existingSkills)
            {
                _uow.NodeTechnicalSkills.Delete(existingSkill);
            }

            foreach (var skillId in dto.TechnicalSkillIds.Distinct())
            {
                if (!await _uow.TechnicalSkills.ExistsAsync(skill => skill.Id == skillId)) continue;
                await _uow.NodeTechnicalSkills.AddAsync(new NodeTechnicalSkill
                {
                    Id = Guid.NewGuid(),
                    NodeId = node.Id,
                    TechnicalSkillId = skillId,
                    CreatedAt = DateTime.Now
                });
            }
        }

        node.UpdatedAt = DateTime.Now;
        _uow.Nodes.Update(node);
        _uow.NodeProgresses.Update(np);
        await _uow.SaveChangesAsync();

        roadmapNode.Node = node;
        np.RoadmapNode = roadmapNode;

        return ServiceResult<NodeProgressDto>.Ok(_mapper.Map<NodeProgressDto>(np));
    }

    public async Task<ServiceResult<List<NodeProgressDto>>> GetByPersonalRoadmapAsync(Guid personalRoadmapId)
    {
        var progresses = await _uow.NodeProgresses.GetByPersonalRoadmapAsync(personalRoadmapId);
        return ServiceResult<List<NodeProgressDto>>.Ok(_mapper.Map<List<NodeProgressDto>>(progresses));
    }

    public async Task<ServiceResult<List<NodeProgressDto>>> GetCompletedNodesAsync(Guid personalRoadmapId)
    {
        var progresses = await _uow.NodeProgresses.GetByPersonalRoadmapAsync(personalRoadmapId);
        var completed = progresses.Where(np => np.Status == NodeProgressStatus.Completed).ToList();
        return ServiceResult<List<NodeProgressDto>>.Ok(_mapper.Map<List<NodeProgressDto>>(completed));
    }
}
