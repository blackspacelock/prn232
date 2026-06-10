using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class JobTrendService : IJobTrendService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public JobTrendService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<JobTrendDto>> CreateAsync(CreateJobTrendDto dto)
    {
        var trend = new JobTrend
        {
            Id = Guid.NewGuid(),
            TechSkill = dto.TechSkill,
            Description = dto.Description,
            Source = dto.Source,
            Region = dto.Region,
            TrendScore = dto.TrendScore,
            SnapshotDate = dto.SnapshotDate
        };
        await _uow.JobTrends.AddAsync(trend);
        await _uow.SaveChangesAsync();
        return ServiceResult<JobTrendDto>.Ok(_mapper.Map<JobTrendDto>(trend));
    }

    public async Task<ServiceResult<List<JobTrendDto>>> GetByRegionAsync(string region)
    {
        var trends = await _uow.JobTrends.FindAsync(t => t.Region == region);
        return ServiceResult<List<JobTrendDto>>.Ok(_mapper.Map<List<JobTrendDto>>(trends));
    }

    public async Task<ServiceResult<List<JobTrendDto>>> GetTopTrendingAsync(int count)
    {
        var all = await _uow.JobTrends.GetAllAsync();
        var top = all.OrderByDescending(t => t.TrendScore).Take(count).ToList();
        return ServiceResult<List<JobTrendDto>>.Ok(_mapper.Map<List<JobTrendDto>>(top));
    }

    public async Task<ServiceResult<List<JobTrendDto>>> GetBySkillAsync(string techSkill)
    {
        var trends = await _uow.JobTrends.FindAsync(t => t.TechSkill.Contains(techSkill));
        return ServiceResult<List<JobTrendDto>>.Ok(_mapper.Map<List<JobTrendDto>>(trends));
    }

    public async Task<ServiceResult<List<JobTrendDto>>> GetBySnapshotDateAsync(DateTime date)
    {
        var trends = await _uow.JobTrends.FindAsync(t => t.SnapshotDate.Date == date.Date);
        return ServiceResult<List<JobTrendDto>>.Ok(_mapper.Map<List<JobTrendDto>>(trends));
    }

    public async Task<ServiceResult<JobTrendDto>> UpdateAsync(Guid id, UpdateJobTrendDto dto)
    {
        var trend = await _uow.JobTrends.GetByIdAsync(id);
        if (trend == null) return ServiceResult<JobTrendDto>.Fail("Job trend not found.");

        if (dto.TechSkill != null) trend.TechSkill = dto.TechSkill;
        if (dto.Description != null) trend.Description = dto.Description;
        if (dto.Source != null) trend.Source = dto.Source;
        if (dto.Region != null) trend.Region = dto.Region;
        if (dto.TrendScore.HasValue) trend.TrendScore = dto.TrendScore.Value;
        if (dto.SnapshotDate.HasValue) trend.SnapshotDate = dto.SnapshotDate.Value;

        _uow.JobTrends.Update(trend);
        await _uow.SaveChangesAsync();
        return ServiceResult<JobTrendDto>.Ok(_mapper.Map<JobTrendDto>(trend));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id, bool physicalDelete = false)
    {
        var trend = await _uow.JobTrends.GetByIdAsync(id);
        if (trend == null) return ServiceResult<bool>.Fail("Job trend not found.");
        _uow.JobTrends.Delete(trend, physicalDelete);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
