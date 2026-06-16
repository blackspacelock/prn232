using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class JobScrapingSourceService : IJobScrapingSourceService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public JobScrapingSourceService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<List<JobScrapingSourceDto>>> GetAllAsync()
    {
        var sources = await _uow.JobScrapingSources.GetAllAsync();
        return ServiceResult<List<JobScrapingSourceDto>>.Ok(_mapper.Map<List<JobScrapingSourceDto>>(sources));
    }

    public async Task<ServiceResult<JobScrapingSourceDto>> CreateAsync(CreateJobScrapingSourceDto dto)
    {
        var source = _mapper.Map<JobScrapingSource>(dto);
        source.Id = Guid.NewGuid();

        await _uow.JobScrapingSources.AddAsync(source);
        await _uow.SaveChangesAsync();

        return ServiceResult<JobScrapingSourceDto>.Ok(_mapper.Map<JobScrapingSourceDto>(source));
    }

    public async Task<ServiceResult<JobScrapingSourceDto>> UpdateAsync(Guid id, UpdateJobScrapingSourceDto dto)
    {
        var source = await _uow.JobScrapingSources.GetByIdAsync(id);
        if (source == null) return ServiceResult<JobScrapingSourceDto>.Fail("Job scraping source not found.");

        _mapper.Map(dto, source);

        _uow.JobScrapingSources.Update(source);
        await _uow.SaveChangesAsync();

        return ServiceResult<JobScrapingSourceDto>.Ok(_mapper.Map<JobScrapingSourceDto>(source));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var source = await _uow.JobScrapingSources.GetByIdAsync(id);
        if (source == null) return ServiceResult<bool>.Fail("Job scraping source not found.");

        _uow.JobScrapingSources.Delete(source);
        await _uow.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }
}
