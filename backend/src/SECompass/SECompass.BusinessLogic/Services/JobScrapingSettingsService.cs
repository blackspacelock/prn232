using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class JobScrapingSettingsService : IJobScrapingSettingsService
{
    private static readonly string[] AllowedFrequencies = { "Daily", "Weekly" };
    private static readonly string[] AllowedDays =
        { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public JobScrapingSettingsService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<JobScrapingSettingDto>> GetSettingsAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        return ServiceResult<JobScrapingSettingDto>.Ok(_mapper.Map<JobScrapingSettingDto>(settings));
    }

    public async Task<ServiceResult<JobScrapingSettingDto>> UpdateSettingsAsync(UpdateJobScrapingSettingDto dto)
    {
        if (!AllowedFrequencies.Contains(dto.Frequency, StringComparer.OrdinalIgnoreCase))
            return ServiceResult<JobScrapingSettingDto>.Fail("Frequency must be 'Daily' or 'Weekly'.");

        if (!AllowedDays.Contains(dto.DayOfWeek, StringComparer.OrdinalIgnoreCase))
            return ServiceResult<JobScrapingSettingDto>.Fail("DayOfWeek must be a valid day name.");

        if (!TimeSpan.TryParse(dto.TimeOfDay, out _))
            return ServiceResult<JobScrapingSettingDto>.Fail("TimeOfDay must be a valid time (HH:mm:ss).");

        var settings = await GetOrCreateSettingsAsync();
        settings.Enabled = dto.Enabled;
        settings.Frequency = dto.Frequency;
        settings.TimeOfDay = dto.TimeOfDay;
        settings.DayOfWeek = dto.DayOfWeek;

        _uow.JobScrapingSettings.Update(settings);
        await _uow.SaveChangesAsync();

        return ServiceResult<JobScrapingSettingDto>.Ok(_mapper.Map<JobScrapingSettingDto>(settings));
    }

    public async Task MarkRunCompletedAsync(DateTime runAt)
    {
        var settings = await GetOrCreateSettingsAsync();
        settings.LastRunAt = runAt;
        _uow.JobScrapingSettings.Update(settings);
        await _uow.SaveChangesAsync();
    }

    private async Task<JobScrapingSetting> GetOrCreateSettingsAsync()
    {
        var existing = (await _uow.JobScrapingSettings.GetAllAsync()).FirstOrDefault();
        if (existing != null) return existing;

        var settings = new JobScrapingSetting
        {
            Id = Guid.NewGuid(),
            Enabled = true,
            Frequency = "Weekly",
            TimeOfDay = "00:00:00",
            DayOfWeek = "Sunday"
        };
        await _uow.JobScrapingSettings.AddAsync(settings);
        await _uow.SaveChangesAsync();
        return settings;
    }
}
