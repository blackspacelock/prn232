using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.RoadmapTag;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class RoadmapTagService : IRoadmapTagService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RoadmapTagService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<List<RoadmapTagDto>>> GetByRoadmapAsync(Guid personalRoadmapId)
    {
        var tags = await _uow.RoadmapTags.FindAsync(t => t.PersonalRoadmapId == personalRoadmapId);
        return ServiceResult<List<RoadmapTagDto>>.Ok(_mapper.Map<List<RoadmapTagDto>>(tags.OrderBy(t => t.Name).ToList()));
    }

    public async Task<ServiceResult<RoadmapTagDto>> AddAsync(Guid personalRoadmapId, AddRoadmapTagDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ServiceResult<RoadmapTagDto>.Fail("Tag name is required.");

        var roadmapExists = await _uow.PersonalRoadmaps.ExistsAsync(r => r.Id == personalRoadmapId);
        if (!roadmapExists)
            return ServiceResult<RoadmapTagDto>.Fail("Personal roadmap not found.");

        var duplicate = await _uow.RoadmapTags.ExistsAsync(
            t => t.PersonalRoadmapId == personalRoadmapId && t.Name.ToLower() == name.ToLower());
        if (duplicate)
            return ServiceResult<RoadmapTagDto>.Fail("A tag with that name already exists on this roadmap.");

        var tag = new RoadmapTag
        {
            Id = Guid.NewGuid(),
            PersonalRoadmapId = personalRoadmapId,
            Name = name,
            Color = dto.Color?.Trim()
        };

        await _uow.RoadmapTags.AddAsync(tag);
        await _uow.SaveChangesAsync();

        return ServiceResult<RoadmapTagDto>.Ok(_mapper.Map<RoadmapTagDto>(tag));
    }

    public async Task<ServiceResult<RoadmapTagDto>> UpdateAsync(Guid tagId, UpdateRoadmapTagDto dto)
    {
        var tag = await _uow.RoadmapTags.GetByIdAsync(tagId);
        if (tag == null)
            return ServiceResult<RoadmapTagDto>.Fail("Tag not found.");

        if (dto.Name != null)
        {
            var name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return ServiceResult<RoadmapTagDto>.Fail("Tag name cannot be empty.");

            var duplicate = await _uow.RoadmapTags.ExistsAsync(
                t => t.PersonalRoadmapId == tag.PersonalRoadmapId
                  && t.Name.ToLower() == name.ToLower()
                  && t.Id != tagId);
            if (duplicate)
                return ServiceResult<RoadmapTagDto>.Fail("A tag with that name already exists on this roadmap.");

            tag.Name = name;
        }

        if (dto.Color != null)
            tag.Color = dto.Color.Trim();

        tag.UpdatedAt = DateTime.Now;
        _uow.RoadmapTags.Update(tag);
        await _uow.SaveChangesAsync();

        return ServiceResult<RoadmapTagDto>.Ok(_mapper.Map<RoadmapTagDto>(tag));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid tagId)
    {
        var tag = await _uow.RoadmapTags.GetByIdAsync(tagId);
        if (tag == null)
            return ServiceResult<bool>.Fail("Tag not found.");

        _uow.RoadmapTags.Delete(tag);
        await _uow.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }
}
