using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Node;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class NodeService : INodeService
{
    private readonly IUnitOfWork _uow;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public NodeService(IUnitOfWork uow, AppDbContext context, IMapper mapper)
    {
        _uow = uow;
        _context = context;
        _mapper = mapper;
    }

    public async Task<ServiceResult<NodeDto>> CreateAsync(CreateNodeDto dto)
    {
        var node = new Node
        {
            Id = Guid.NewGuid(),
            ParentNodeId = dto.ParentNodeId,
            Name = dto.Name,
            Description = dto.Description,
            Order = dto.Order
        };
        await _uow.Nodes.AddAsync(node);
        await _uow.SaveChangesAsync();
        return ServiceResult<NodeDto>.Ok(_mapper.Map<NodeDto>(node));
    }

    public async Task<ServiceResult<NodeDto>> GetByIdAsync(Guid id)
    {
        var node = await _uow.Nodes.GetByIdAsync(id);
        if (node == null) return ServiceResult<NodeDto>.Fail("Node not found.");
        return ServiceResult<NodeDto>.Ok(_mapper.Map<NodeDto>(node));
    }

    public async Task<ServiceResult<PaginationResponse<NodeDto>>> GetPagedAsync(NodeListRequestDto request)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var sortBy = request.SortBy?.Trim().ToLowerInvariant();
        var descending = string.Equals(request.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        var query = _context.Nodes.AsNoTracking().Where(n => n.ParentNodeId == request.ParentNodeId);

        var search = request.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(n =>
                n.Name.Contains(search) ||
                (n.Description != null && n.Description.Contains(search)));
        }

        query = sortBy switch
        {
            "name" => descending ? query.OrderByDescending(n => n.Name) : query.OrderBy(n => n.Name),
            "createdat" => descending ? query.OrderByDescending(n => n.CreatedAt) : query.OrderBy(n => n.CreatedAt),
            _ => descending ? query.OrderByDescending(n => n.Order) : query.OrderBy(n => n.Order)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return ServiceResult<PaginationResponse<NodeDto>>.Ok(new PaginationResponse<NodeDto>
        {
            Items = _mapper.Map<List<NodeDto>>(items),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResult<List<NodeDto>>> GetRootNodesAsync()
    {
        var roots = await _uow.Nodes.FindAsync(n => n.ParentNodeId == null);
        return ServiceResult<List<NodeDto>>.Ok(_mapper.Map<List<NodeDto>>(roots.OrderBy(n => n.Order)));
    }

    public async Task<ServiceResult<List<NodeDto>>> GetChildrenAsync(Guid parentId)
    {
        var children = await _uow.Nodes.FindAsync(n => n.ParentNodeId == parentId);
        return ServiceResult<List<NodeDto>>.Ok(_mapper.Map<List<NodeDto>>(children.OrderBy(n => n.Order)));
    }

    public async Task<ServiceResult<NodeHierarchyDto>> GetHierarchyAsync(Guid rootId)
    {
        var root = await _uow.Nodes.GetByIdAsync(rootId);
        if (root == null) return ServiceResult<NodeHierarchyDto>.Fail("Node not found.");

        var hierarchy = await BuildHierarchyAsync(root);
        return ServiceResult<NodeHierarchyDto>.Ok(hierarchy);
    }

    private async Task<NodeHierarchyDto> BuildHierarchyAsync(Node node)
    {
        var dto = _mapper.Map<NodeHierarchyDto>(node);
        var children = await _uow.Nodes.FindAsync(n => n.ParentNodeId == node.Id);
        foreach (var child in children.OrderBy(n => n.Order))
            dto.Children.Add(await BuildHierarchyAsync(child));
        return dto;
    }

    public async Task<ServiceResult<NodeDto>> UpdateAsync(Guid id, UpdateNodeDto dto)
    {
        var node = await _uow.Nodes.GetByIdAsync(id);
        if (node == null) return ServiceResult<NodeDto>.Fail("Node not found.");

        if (dto.Name != null) node.Name = dto.Name;
        if (dto.Description != null) node.Description = dto.Description;
        if (dto.Order.HasValue) node.Order = dto.Order.Value;
        if (dto.ParentNodeId.HasValue) node.ParentNodeId = dto.ParentNodeId;

        _uow.Nodes.Update(node);
        await _uow.SaveChangesAsync();
        return ServiceResult<NodeDto>.Ok(_mapper.Map<NodeDto>(node));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var node = await _uow.Nodes.GetByIdAsync(id);
        if (node == null) return ServiceResult<bool>.Fail("Node not found.");
        _uow.Nodes.Delete(node);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
