using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.LearningResource;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class AIRecommendationService : IAIRecommendationService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public AIRecommendationService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<PortfolioAnalysisDto>> AnalyzeGitHubPortfolioAsync(Guid profileId)
    {
        var repos = await _uow.GitHubRepositories.FindAsync(r => r.ProfileId == profileId);
        var repoList = repos.ToList();

        var dto = new PortfolioAnalysisDto
        {
            ProfileId = profileId,
            RepositoryNames = repoList.Select(r => r.RepositoryName).ToList(),
            OverallSummary = $"Portfolio contains {repoList.Count} repositories. [AI analysis coming soon]",
            Strengths = new List<string> { "Active GitHub presence", "Project diversity" },
            Recommendations = new List<string> { "Add README to all repositories", "Include live demo links" }
        };

        return ServiceResult<PortfolioAnalysisDto>.Ok(dto);
    }

    public async Task<ServiceResult<List<LearningResourceDto>>> RecommendLearningResourcesAsync(Guid profileId, Guid nodeId)
    {
        var resources = await _uow.LearningResources.FindAsync(r => r.NodeId == nodeId);
        var ordered = resources.OrderByDescending(r => r.IsFree).ToList();
        return ServiceResult<List<LearningResourceDto>>.Ok(_mapper.Map<List<LearningResourceDto>>(ordered));
    }

    public async Task<ServiceResult<List<string>>> GetTrendingSkillRecommendationsAsync(Guid profileId)
    {
        var profileSkillLinks = await _uow.ProfileTechnicalSkills.FindAsync(s => s.ProfileId == profileId);
        var profileSkillIds = profileSkillLinks.Select(s => s.TechnicalSkillId).ToList();
        var technicalSkills = await _uow.TechnicalSkills.FindAsync(t => profileSkillIds.Contains(t.Id));
        var skillNames = technicalSkills.Select(t => t.Name.ToLower()).ToHashSet();

        var trends = await _uow.JobTrends.GetAllAsync();
        var recommendations = trends
            .OrderByDescending(t => t.TrendScore)
            .Where(t => !skillNames.Contains(t.TechSkill.ToLower()))
            .Select(t => t.TechSkill)
            .Take(10)
            .ToList();

        return ServiceResult<List<string>>.Ok(recommendations);
    }
}
