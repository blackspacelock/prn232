using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.DTOs.RoadmapNode;
using SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;
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

        var roadmapNodes = await GetRoadmapNodesWithContentAsync(roadmapId);
        var edges = await _uow.RoadmapNodeEdges.FindAsync(e => e.CareerRoadmapId == roadmapId);

        var dto = _mapper.Map<CareerRoadmapWithNodesDto>(roadmap);
        dto.Nodes = _mapper.Map<List<RoadmapNodeDto>>(roadmapNodes);
        dto.Edges = _mapper.Map<List<RoadmapNodeEdgeDto>>(edges.OrderBy(e => e.CreatedAt));
        return ServiceResult<CareerRoadmapWithNodesDto>.Ok(dto);
    }

    private async Task<List<RoadmapNode>> GetRoadmapNodesWithContentAsync(Guid roadmapId)
    {
        var roadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == roadmapId);
        var roadmapNodeList = roadmapNodes
            .OrderBy(rn => rn.Order)
            .ThenBy(rn => rn.CreatedAt)
            .ToList();

        if (roadmapNodeList.Count == 0) return roadmapNodeList;

        var nodeIds = roadmapNodeList.Select(rn => rn.NodeId).Distinct().ToHashSet();
        var nodes = await _uow.Nodes.FindAsync(n => nodeIds.Contains(n.Id));
        var nodesById = nodes.ToDictionary(n => n.Id);

        foreach (var roadmapNode in roadmapNodeList)
        {
            if (nodesById.TryGetValue(roadmapNode.NodeId, out var node))
            {
                roadmapNode.Node = node;
            }
        }

        return roadmapNodeList;
    }

    public async Task<ServiceResult<RoadmapNodeDto>> AssignNodeAsync(Guid roadmapId, Guid nodeId)
        => await AssignNodeAsync(roadmapId, new CreateRoadmapNodeDto { NodeId = nodeId });

    public async Task<ServiceResult<RoadmapNodeDto>> AssignNodeAsync(Guid roadmapId, CreateRoadmapNodeDto dto)
    {
        var roadmapExists = await _uow.CareerRoadmaps.ExistsAsync(r => r.Id == roadmapId);
        if (!roadmapExists) return ServiceResult<RoadmapNodeDto>.Fail("Career roadmap not found.");

        var node = await _uow.Nodes.GetByIdAsync(dto.NodeId);
        if (node == null) return ServiceResult<RoadmapNodeDto>.Fail("Node not found.");

        var exists = await _uow.RoadmapNodes.ExistsAsync(rn => rn.CareerRoadmapId == roadmapId && rn.NodeId == dto.NodeId);
        if (exists) return ServiceResult<RoadmapNodeDto>.Fail("Node already assigned to this roadmap.");

        if (dto.ParentRoadmapNodeId.HasValue)
        {
            var parentExists = await _uow.RoadmapNodes.ExistsAsync(rn =>
                rn.Id == dto.ParentRoadmapNodeId.Value && rn.CareerRoadmapId == roadmapId);
            if (!parentExists) return ServiceResult<RoadmapNodeDto>.Fail("Parent roadmap node not found in this roadmap.");
        }

        var rn = new RoadmapNode
        {
            Id = Guid.NewGuid(),
            CareerRoadmapId = roadmapId,
            NodeId = dto.NodeId,
            ParentRoadmapNodeId = dto.ParentRoadmapNodeId,
            Order = dto.Order,
            NodeType = string.IsNullOrWhiteSpace(dto.NodeType) ? "Topic" : dto.NodeType,
            RequirementType = string.IsNullOrWhiteSpace(dto.RequirementType) ? "Required" : dto.RequirementType,
            PositionX = dto.PositionX,
            PositionY = dto.PositionY,
            Node = node
        };

        await _uow.RoadmapNodes.AddAsync(rn);
        await _uow.SaveChangesAsync();
        return ServiceResult<RoadmapNodeDto>.Ok(_mapper.Map<RoadmapNodeDto>(rn));
    }

    public async Task<ServiceResult<RoadmapNodeDto>> UpdateRoadmapNodeAsync(Guid roadmapId, Guid roadmapNodeId, UpdateRoadmapNodeDto dto)
    {
        var roadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => rn.Id == roadmapNodeId && rn.CareerRoadmapId == roadmapId);
        var roadmapNode = roadmapNodes.FirstOrDefault();
        if (roadmapNode == null) return ServiceResult<RoadmapNodeDto>.Fail("Roadmap node not found.");

        if (dto.ParentRoadmapNodeId.HasValue)
        {
            if (dto.ParentRoadmapNodeId.Value == roadmapNodeId)
                return ServiceResult<RoadmapNodeDto>.Fail("A roadmap node cannot be its own parent.");

            var parentExists = await _uow.RoadmapNodes.ExistsAsync(rn =>
                rn.Id == dto.ParentRoadmapNodeId.Value && rn.CareerRoadmapId == roadmapId);
            if (!parentExists) return ServiceResult<RoadmapNodeDto>.Fail("Parent roadmap node not found in this roadmap.");
        }

        if (dto.ParentRoadmapNodeId.HasValue) roadmapNode.ParentRoadmapNodeId = dto.ParentRoadmapNodeId;
        if (dto.Order.HasValue) roadmapNode.Order = dto.Order.Value;
        if (dto.NodeType != null) roadmapNode.NodeType = dto.NodeType;
        if (dto.RequirementType != null) roadmapNode.RequirementType = dto.RequirementType;
        if (dto.PositionX.HasValue) roadmapNode.PositionX = dto.PositionX;
        if (dto.PositionY.HasValue) roadmapNode.PositionY = dto.PositionY;

        roadmapNode.Node = (await _uow.Nodes.GetByIdAsync(roadmapNode.NodeId))!;
        _uow.RoadmapNodes.Update(roadmapNode);
        await _uow.SaveChangesAsync();
        return ServiceResult<RoadmapNodeDto>.Ok(_mapper.Map<RoadmapNodeDto>(roadmapNode));
    }

    public async Task<ServiceResult<bool>> RemoveRoadmapNodeAsync(Guid roadmapId, Guid roadmapNodeId)
    {
        var rns = await _uow.RoadmapNodes.FindAsync(rn => rn.Id == roadmapNodeId && rn.CareerRoadmapId == roadmapId);
        var rn = rns.FirstOrDefault();
        if (rn == null) return ServiceResult<bool>.Fail("Roadmap node not found.");

        var hasChildren = await _uow.RoadmapNodes.ExistsAsync(child => child.ParentRoadmapNodeId == roadmapNodeId);
        if (hasChildren) return ServiceResult<bool>.Fail("Cannot remove a roadmap node that still has child roadmap nodes.");

        var hasProgress = await _uow.NodeProgresses.ExistsAsync(np => np.RoadmapNodeId == roadmapNodeId);
        if (hasProgress) return ServiceResult<bool>.Fail("Cannot remove a roadmap node that already has personal progress.");

        var edges = await _uow.RoadmapNodeEdges.FindAsync(e =>
            e.CareerRoadmapId == roadmapId &&
            (e.FromRoadmapNodeId == roadmapNodeId || e.ToRoadmapNodeId == roadmapNodeId));
        foreach (var edge in edges)
        {
            _uow.RoadmapNodeEdges.Delete(edge);
        }

        _uow.RoadmapNodes.Delete(rn);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> RemoveNodeAsync(Guid roadmapId, Guid nodeId)
    {
        var rns = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == roadmapId && rn.NodeId == nodeId);
        var rn = rns.FirstOrDefault();
        if (rn == null) return ServiceResult<bool>.Fail("Assignment not found.");
        var result = await RemoveRoadmapNodeAsync(roadmapId, rn.Id);
        if (!result.Success) return result;
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<RoadmapNodeEdgeDto>> CreateEdgeAsync(Guid roadmapId, CreateRoadmapNodeEdgeDto dto)
    {
        if (dto.FromRoadmapNodeId == dto.ToRoadmapNodeId)
            return ServiceResult<RoadmapNodeEdgeDto>.Fail("An edge cannot connect a roadmap node to itself.");

        var fromExists = await _uow.RoadmapNodes.ExistsAsync(rn => rn.Id == dto.FromRoadmapNodeId && rn.CareerRoadmapId == roadmapId);
        var toExists = await _uow.RoadmapNodes.ExistsAsync(rn => rn.Id == dto.ToRoadmapNodeId && rn.CareerRoadmapId == roadmapId);
        if (!fromExists || !toExists) return ServiceResult<RoadmapNodeEdgeDto>.Fail("Both roadmap nodes must belong to this roadmap.");

        var edgeType = string.IsNullOrWhiteSpace(dto.EdgeType) ? "Next" : dto.EdgeType;
        var exists = await _uow.RoadmapNodeEdges.ExistsAsync(e =>
            e.CareerRoadmapId == roadmapId &&
            e.FromRoadmapNodeId == dto.FromRoadmapNodeId &&
            e.ToRoadmapNodeId == dto.ToRoadmapNodeId &&
            e.EdgeType == edgeType);
        if (exists) return ServiceResult<RoadmapNodeEdgeDto>.Fail("Edge already exists.");

        var edge = new RoadmapNodeEdge
        {
            Id = Guid.NewGuid(),
            CareerRoadmapId = roadmapId,
            FromRoadmapNodeId = dto.FromRoadmapNodeId,
            ToRoadmapNodeId = dto.ToRoadmapNodeId,
            EdgeType = edgeType
        };

        await _uow.RoadmapNodeEdges.AddAsync(edge);
        await _uow.SaveChangesAsync();
        return ServiceResult<RoadmapNodeEdgeDto>.Ok(_mapper.Map<RoadmapNodeEdgeDto>(edge));
    }

    public async Task<ServiceResult<RoadmapNodeEdgeDto>> UpdateEdgeAsync(Guid roadmapId, Guid edgeId, UpdateRoadmapNodeEdgeDto dto)
    {
        var edges = await _uow.RoadmapNodeEdges.FindAsync(e => e.Id == edgeId && e.CareerRoadmapId == roadmapId);
        var edge = edges.FirstOrDefault();
        if (edge == null) return ServiceResult<RoadmapNodeEdgeDto>.Fail("Roadmap node edge not found.");

        if (dto.EdgeType != null) edge.EdgeType = dto.EdgeType;
        _uow.RoadmapNodeEdges.Update(edge);
        await _uow.SaveChangesAsync();
        return ServiceResult<RoadmapNodeEdgeDto>.Ok(_mapper.Map<RoadmapNodeEdgeDto>(edge));
    }

    public async Task<ServiceResult<bool>> DeleteEdgeAsync(Guid roadmapId, Guid edgeId)
    {
        var edges = await _uow.RoadmapNodeEdges.FindAsync(e => e.Id == edgeId && e.CareerRoadmapId == roadmapId);
        var edge = edges.FirstOrDefault();
        if (edge == null) return ServiceResult<bool>.Fail("Roadmap node edge not found.");

        _uow.RoadmapNodeEdges.Delete(edge);
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
