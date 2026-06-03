using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class CareerRoadmapService : ICareerRoadmapService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CareerRoadmapService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<CareerRoadmapDto>> CreateAsync(CreateCareerRoadmapDto dto)
    {
        var roadmap = new CareerRoadmap
        {
            Id = Guid.NewGuid(),
            CareerRoleId = dto.CareerRoleId,
            Name = dto.Name,
            Description = dto.Description,
            IsCustom = dto.IsCustom
        };
        await _uow.CareerRoadmaps.AddAsync(roadmap);
        await _uow.SaveChangesAsync();
        return ServiceResult<CareerRoadmapDto>.Ok(_mapper.Map<CareerRoadmapDto>(roadmap));
    }

    public async Task<ServiceResult<CareerRoadmapDto>> GetByIdAsync(Guid id)
    {
        var roadmap = await _uow.CareerRoadmaps.GetByIdAsync(id);
        if (roadmap == null) return ServiceResult<CareerRoadmapDto>.Fail("Career roadmap not found.");
        return ServiceResult<CareerRoadmapDto>.Ok(_mapper.Map<CareerRoadmapDto>(roadmap));
    }

    public async Task<ServiceResult<List<CareerRoadmapDto>>> GetByCareerRoleAsync(Guid careerRoleId)
    {
        var roadmaps = await _uow.CareerRoadmaps.FindAsync(r => r.CareerRoleId == careerRoleId);
        return ServiceResult<List<CareerRoadmapDto>>.Ok(_mapper.Map<List<CareerRoadmapDto>>(roadmaps));
    }

    public async Task<ServiceResult<CareerRoadmapWithNodesDto>> GetRoadmapWithNodesAsync(Guid roadmapId)
    {
        var roadmaps = await _uow.CareerRoadmaps.FindAsync(r => r.Id == roadmapId);
        var roadmap = roadmaps.FirstOrDefault();
        if (roadmap == null) return ServiceResult<CareerRoadmapWithNodesDto>.Fail("Career roadmap not found.");

        var nodes = await GetExpandedRoadmapNodesAsync(roadmapId);

        var dto = _mapper.Map<CareerRoadmapWithNodesDto>(roadmap);
        dto.Nodes = _mapper.Map<List<DTOs.Node.NodeDto>>(nodes);
        return ServiceResult<CareerRoadmapWithNodesDto>.Ok(dto);
    }

    private async Task<List<Node>> GetExpandedRoadmapNodesAsync(Guid roadmapId)
    {
        var roadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == roadmapId);
        var assignedNodeIds = roadmapNodes.Select(rn => rn.NodeId).Distinct().ToHashSet();
        if (assignedNodeIds.Count == 0) return new List<Node>();

        var allNodes = (await _uow.Nodes.GetAllAsync()).ToList();
        var nodesById = allNodes.ToDictionary(n => n.Id);
        var childrenByParent = allNodes
            .Where(n => n.ParentNodeId.HasValue)
            .GroupBy(n => n.ParentNodeId!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(n => n.Order).ThenBy(n => n.Name).ToList());

        var expanded = new List<Node>();
        var visited = new HashSet<Guid>();

        void AddNodeAndDescendants(Node node)
        {
            if (!visited.Add(node.Id)) return;

            expanded.Add(node);
            if (!childrenByParent.TryGetValue(node.Id, out var children)) return;

            foreach (var child in children)
            {
                AddNodeAndDescendants(child);
            }
        }

        var assignedNodes = assignedNodeIds
            .Select(id => nodesById.GetValueOrDefault(id))
            .Where(n => n != null)
            .Cast<Node>()
            .OrderBy(n => n.Order)
            .ThenBy(n => n.Name);

        foreach (var node in assignedNodes)
        {
            AddNodeAndDescendants(node);
        }

        return expanded;
    }

    public async Task<ServiceResult<bool>> AssignNodeAsync(Guid roadmapId, Guid nodeId)
    {
        var exists = await _uow.RoadmapNodes.ExistsAsync(rn => rn.CareerRoadmapId == roadmapId && rn.NodeId == nodeId);
        if (exists) return ServiceResult<bool>.Fail("Node already assigned to this roadmap.");

        var rn = new RoadmapNode { Id = Guid.NewGuid(), CareerRoadmapId = roadmapId, NodeId = nodeId };
        await _uow.RoadmapNodes.AddAsync(rn);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> RemoveNodeAsync(Guid roadmapId, Guid nodeId)
    {
        var rns = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == roadmapId && rn.NodeId == nodeId);
        var rn = rns.FirstOrDefault();
        if (rn == null) return ServiceResult<bool>.Fail("Assignment not found.");
        _uow.RoadmapNodes.Delete(rn);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<CareerRoadmapDto>> UpdateAsync(Guid id, UpdateCareerRoadmapDto dto)
    {
        var roadmap = await _uow.CareerRoadmaps.GetByIdAsync(id);
        if (roadmap == null) return ServiceResult<CareerRoadmapDto>.Fail("Career roadmap not found.");

        if (dto.Name != null) roadmap.Name = dto.Name;
        if (dto.Description != null) roadmap.Description = dto.Description;
        if (dto.IsCustom.HasValue) roadmap.IsCustom = dto.IsCustom.Value;

        _uow.CareerRoadmaps.Update(roadmap);
        await _uow.SaveChangesAsync();
        return ServiceResult<CareerRoadmapDto>.Ok(_mapper.Map<CareerRoadmapDto>(roadmap));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var roadmap = await _uow.CareerRoadmaps.GetByIdAsync(id);
        if (roadmap == null) return ServiceResult<bool>.Fail("Career roadmap not found.");
        _uow.CareerRoadmaps.Delete(roadmap);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
