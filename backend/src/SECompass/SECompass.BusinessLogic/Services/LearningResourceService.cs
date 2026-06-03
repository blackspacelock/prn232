using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.LearningResource;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class LearningResourceService : ILearningResourceService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public LearningResourceService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<LearningResourceDto>> CreateAsync(Guid nodeId, CreateLearningResourceDto dto)
    {
        var nodeExists = await _uow.Nodes.ExistsAsync(n => n.Id == nodeId);
        if (!nodeExists) return ServiceResult<LearningResourceDto>.Fail("Node not found.");

        var resource = new LearningResource
        {
            Id = Guid.NewGuid(),
            NodeId = nodeId,
            Name = dto.Name,
            ResourceUrl = dto.ResourceUrl,
            ResourceType = dto.ResourceType,
            Provider = dto.Provider,
            IsFree = dto.IsFree
        };
        await _uow.LearningResources.AddAsync(resource);
        await _uow.SaveChangesAsync();
        return ServiceResult<LearningResourceDto>.Ok(_mapper.Map<LearningResourceDto>(resource));
    }

    public async Task<ServiceResult<List<LearningResourceDto>>> GetByNodeAsync(Guid nodeId)
    {
        var resources = await _uow.LearningResources.FindAsync(r => r.NodeId == nodeId);
        return ServiceResult<List<LearningResourceDto>>.Ok(_mapper.Map<List<LearningResourceDto>>(resources));
    }

    public async Task<ServiceResult<List<LearningResourceDto>>> GetFreeByNodeAsync(Guid nodeId)
    {
        var resources = await _uow.LearningResources.FindAsync(r => r.NodeId == nodeId && r.IsFree);
        return ServiceResult<List<LearningResourceDto>>.Ok(_mapper.Map<List<LearningResourceDto>>(resources));
    }

    public async Task<ServiceResult<List<LearningResourceDto>>> GetByTypeAsync(Guid nodeId, string resourceType)
    {
        var resources = await _uow.LearningResources.FindAsync(r => r.NodeId == nodeId && r.ResourceType == resourceType);
        return ServiceResult<List<LearningResourceDto>>.Ok(_mapper.Map<List<LearningResourceDto>>(resources));
    }

    public async Task<ServiceResult<LearningResourceDto>> UpdateAsync(Guid id, UpdateLearningResourceDto dto)
    {
        var resource = await _uow.LearningResources.GetByIdAsync(id);
        if (resource == null) return ServiceResult<LearningResourceDto>.Fail("Learning resource not found.");

        if (dto.Name != null) resource.Name = dto.Name;
        if (dto.ResourceUrl != null) resource.ResourceUrl = dto.ResourceUrl;
        if (dto.ResourceType != null) resource.ResourceType = dto.ResourceType;
        if (dto.Provider != null) resource.Provider = dto.Provider;
        if (dto.IsFree.HasValue) resource.IsFree = dto.IsFree.Value;

        _uow.LearningResources.Update(resource);
        await _uow.SaveChangesAsync();
        return ServiceResult<LearningResourceDto>.Ok(_mapper.Map<LearningResourceDto>(resource));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var resource = await _uow.LearningResources.GetByIdAsync(id);
        if (resource == null) return ServiceResult<bool>.Fail("Learning resource not found.");
        _uow.LearningResources.Delete(resource);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
