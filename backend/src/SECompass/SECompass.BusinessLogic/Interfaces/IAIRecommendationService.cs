using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.LearningResource;

namespace SECompass.BusinessLogic.Interfaces;

public interface IAIRecommendationService
{
    Task<ServiceResult<PortfolioAnalysisDto>> AnalyzeGitHubPortfolioAsync(Guid profileId);
    Task<ServiceResult<List<LearningResourceDto>>> RecommendLearningResourcesAsync(Guid profileId, Guid nodeId);
    Task<ServiceResult<List<string>>> GetTrendingSkillRecommendationsAsync(Guid profileId);
}
