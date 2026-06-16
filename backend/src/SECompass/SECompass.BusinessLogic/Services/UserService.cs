using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.DTOs.User;
using SECompass.DataAccess.Enums;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<List<UserDto>>> GetAllAsync()
    {
        var users = (await _uow.Users.GetAllAsync())
            .OrderByDescending(u => u.CreatedAt)
            .ToList();
        return ServiceResult<List<UserDto>>.Ok(_mapper.Map<List<UserDto>>(users));
    }

    public async Task<ServiceResult<UserDto>> GetByIdAsync(Guid userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<UserDto>.Fail("User not found.");
        return ServiceResult<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ServiceResult<AdminOverviewDto>> GetAdminOverviewAsync()
    {
        var users = (await _uow.Users.GetAllAsync()).ToList();
        var roles = (await _uow.CareerRoles.GetAllAsync()).ToList();
        var templates = (await _uow.CareerRoadmaps.GetAllAsync()).ToList();
        var nodes = (await _uow.Nodes.GetAllAsync()).ToList();
        var personalRoadmaps = (await _uow.PersonalRoadmaps.GetAllAsync()).ToList();
        var repositories = (await _uow.GitHubRepositories.GetAllAsync()).ToList();
        var portfolios = (await _uow.PublicPortfolios.GetAllAsync()).ToList();
        var chats = (await _uow.ChatSessions.GetAllAsync()).ToList();
        var trends = (await _uow.JobTrends.GetAllAsync()).ToList();
        var scrapingSources = (await _uow.JobScrapingSources.GetAllAsync()).ToList();
        var scrapingSettings = (await _uow.JobScrapingSettings.GetAllAsync()).FirstOrDefault();

        var now = DateTime.UtcNow;
        var monthlyRegistrations = Enumerable.Range(0, 6)
            .Select(offset => new DateTime(now.Year, now.Month, 1).AddMonths(-5 + offset))
            .Select(month => new AdminMetricPointDto
            {
                Label = month.ToString("MMM yy"),
                Value = users.Count(u => u.CreatedAt.Year == month.Year && u.CreatedAt.Month == month.Month)
            })
            .ToList();

        var overview = new AdminOverviewDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.IsActive),
            InactiveUsers = users.Count(u => !u.IsActive),
            AdminUsers = users.Count(u => u.Role == UserRole.Admin),
            MentorUsers = users.Count(u => u.Role == UserRole.Manager),
            StudentUsers = users.Count(u => u.Role == UserRole.RoadmapUser),
            CareerRoles = roles.Count,
            RoadmapTemplates = templates.Count,
            ContentNodes = nodes.Count,
            PersonalRoadmaps = personalRoadmaps.Count,
            GitHubRepositories = repositories.Count,
            PublicPortfolios = portfolios.Count(p => p.IsPublic),
            ChatSessions = chats.Count,
            AverageRoadmapProgress = personalRoadmaps.Count == 0
                ? 0
                : Math.Round((double)personalRoadmaps.Average(r => r.ProgressPercentage), 1),
            ScrapingEnabled = scrapingSettings?.Enabled ?? false,
            ActiveScrapingSources = scrapingSources.Count(s => s.Enabled),
            LastScrapingRunAt = scrapingSettings?.LastRunAt,
            MonthlyRegistrations = monthlyRegistrations,
            RoleBreakdown = new List<AdminMetricPointDto>
            {
                new() { Label = "Admins", Value = users.Count(u => u.Role == UserRole.Admin) },
                new() { Label = "Mentors", Value = users.Count(u => u.Role == UserRole.Manager) },
                new() { Label = "Students", Value = users.Count(u => u.Role == UserRole.RoadmapUser) },
            },
            ContentInventory = new List<AdminMetricPointDto>
            {
                new() { Label = "Roles", Value = roles.Count },
                new() { Label = "Templates", Value = templates.Count },
                new() { Label = "Nodes", Value = nodes.Count },
                new() { Label = "Resources", Value = (await _uow.LearningResources.GetAllAsync()).Count() },
            },
            TopJobTrends = _mapper.Map<List<JobTrendDto>>(trends.OrderByDescending(t => t.TrendScore).Take(8).ToList()),
            RecentUsers = _mapper.Map<List<UserDto>>(users.OrderByDescending(u => u.CreatedAt).Take(6).ToList()),
        };

        return ServiceResult<AdminOverviewDto>.Ok(overview);
    }

    public async Task<ServiceResult<UserDto>> UpdateAsync(Guid userId, UpdateUserDto dto)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<UserDto>.Fail("User not found.");

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;

        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return ServiceResult<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ServiceResult<UserDto>> AdminUpdateAsync(Guid userId, AdminUpdateUserDto dto)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<UserDto>.Fail("User not found.");

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        if (dto.Role.HasValue && Enum.IsDefined(typeof(UserRole), dto.Role.Value))
        {
            user.Role = (UserRole)dto.Role.Value;
        }

        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return ServiceResult<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ServiceResult<bool>> DeactivateAsync(Guid userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<bool>.Fail("User not found.");

        _uow.Users.Delete(user);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
