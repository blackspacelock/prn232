using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.CareerRole;
using SECompass.BusinessLogic.DTOs.CareerRoadmap;
using SECompass.BusinessLogic.DTOs.Chat;
using SECompass.BusinessLogic.DTOs.GitHubRepository;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.DTOs.LearningResource;
using SECompass.BusinessLogic.DTOs.Node;
using SECompass.BusinessLogic.DTOs.NodeProgress;
using SECompass.BusinessLogic.DTOs.PersonalRoadmap;
using SECompass.BusinessLogic.DTOs.Profile;
using SECompass.BusinessLogic.DTOs.User;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.API.GraphQL.Queries;

public class Query
{
    // User
    public async Task<UserDto?> GetUserById([Service] IUserService userService, Guid id)
    {
        var result = await userService.GetByIdAsync(id);
        return result.Success ? result.Data : null;
    }

    // Profile
    public async Task<ProfileDto?> GetProfileByUserId([Service] IProfileService profileService, Guid userId)
    {
        var result = await profileService.GetByUserIdAsync(userId);
        return result.Success ? result.Data : null;
    }

    public async Task<ProfileWithSkillsDto?> GetProfileWithSkills([Service] IProfileService profileService, Guid userId)
    {
        var result = await profileService.GetProfileWithSkillsAsync(userId);
        return result.Success ? result.Data : null;
    }

    public async Task<List<SECompass.BusinessLogic.DTOs.Skill.SkillDto>> GetSkillsByProfile([Service] ISkillService skillService, Guid profileId)
    {
        var result = await skillService.GetSkillsByProfileAsync(profileId);
        return result.Success ? result.Data! : new();
    }

    // Career Roles
    public async Task<CareerRoleDto?> GetCareerRoleById([Service] ICareerRoleService service, Guid id)
    {
        var result = await service.GetByIdAsync(id);
        return result.Success ? result.Data : null;
    }

    public async Task<List<CareerRoleDto>> GetCareerRoles([Service] ICareerRoleService service)
    {
        var result = await service.GetAllAsync();
        return result.Success ? result.Data! : new();
    }

    // Career Roadmaps
    public async Task<CareerRoadmapDto?> GetCareerRoadmapById([Service] ICareerRoadmapService service, Guid id)
    {
        var result = await service.GetByIdAsync(id);
        return result.Success ? result.Data : null;
    }

    public async Task<List<CareerRoadmapDto>> GetCareerRoadmapsByRole([Service] ICareerRoadmapService service, Guid careerRoleId)
    {
        var result = await service.GetByCareerRoleAsync(careerRoleId);
        return result.Success ? result.Data! : new();
    }

    public async Task<CareerRoadmapWithNodesDto?> GetCareerRoadmapWithNodes([Service] ICareerRoadmapService service, Guid roadmapId)
    {
        var result = await service.GetRoadmapWithNodesAsync(roadmapId);
        return result.Success ? result.Data : null;
    }

    // Personal Roadmaps
    public async Task<List<PersonalRoadmapDto>> GetPersonalRoadmapsByProfile([Service] IPersonalRoadmapService service, Guid profileId)
    {
        var result = await service.GetByProfileAsync(profileId);
        return result.Success ? result.Data! : new();
    }

    public async Task<PersonalRoadmapDetailDto?> GetPersonalRoadmapWithProgress([Service] IPersonalRoadmapService service, Guid personalRoadmapId)
    {
        var result = await service.GetWithProgressAsync(personalRoadmapId);
        return result.Success ? result.Data : null;
    }

    // Nodes
    public async Task<NodeDto?> GetNodeById([Service] INodeService service, Guid id)
    {
        var result = await service.GetByIdAsync(id);
        return result.Success ? result.Data : null;
    }

    public async Task<List<NodeDto>> GetNodeChildren([Service] INodeService service, Guid parentId)
    {
        var result = await service.GetChildrenAsync(parentId);
        return result.Success ? result.Data! : new();
    }

    public async Task<NodeHierarchyDto?> GetNodeHierarchy([Service] INodeService service, Guid rootId)
    {
        var result = await service.GetHierarchyAsync(rootId);
        return result.Success ? result.Data : null;
    }

    // Node Progress
    public async Task<List<NodeProgressDto>> GetNodeProgress([Service] INodeProgressService service, Guid personalRoadmapId)
    {
        var result = await service.GetByPersonalRoadmapAsync(personalRoadmapId);
        return result.Success ? result.Data! : new();
    }

    public async Task<List<NodeProgressDto>> GetCompletedNodes([Service] INodeProgressService service, Guid personalRoadmapId)
    {
        var result = await service.GetCompletedNodesAsync(personalRoadmapId);
        return result.Success ? result.Data! : new();
    }

    // Learning Resources
    public async Task<List<LearningResourceDto>> GetLearningResourcesByNode([Service] ILearningResourceService service, Guid nodeId)
    {
        var result = await service.GetByNodeAsync(nodeId);
        return result.Success ? result.Data! : new();
    }

    public async Task<List<LearningResourceDto>> GetFreeResourcesByNode([Service] ILearningResourceService service, Guid nodeId)
    {
        var result = await service.GetFreeByNodeAsync(nodeId);
        return result.Success ? result.Data! : new();
    }

    // GitHub Repositories
    public async Task<List<GitHubRepositoryDto>> GetGitHubRepositoriesByProfile([Service] IGitHubRepositoryService service, Guid profileId)
    {
        var result = await service.GetByProfileAsync(profileId);
        return result.Success ? result.Data! : new();
    }

    // Chat
    public async Task<List<ChatSessionDto>> GetChatSessionsByProfile([Service] IChatService service, Guid profileId)
    {
        var result = await service.GetSessionsByProfileAsync(profileId);
        return result.Success ? result.Data! : new();
    }

    public async Task<ChatSessionDetailDto?> GetChatSessionWithMessages([Service] IChatService service, Guid sessionId)
    {
        var result = await service.GetSessionWithMessagesAsync(sessionId);
        return result.Success ? result.Data : null;
    }

    // Job Trends
    public async Task<List<JobTrendDto>> GetJobTrendsByRegion([Service] IJobTrendService service, string region)
    {
        var result = await service.GetByRegionAsync(region);
        return result.Success ? result.Data! : new();
    }

    public async Task<List<JobTrendDto>> GetTopTrendingSkills([Service] IJobTrendService service, int count)
    {
        var result = await service.GetTopTrendingAsync(count);
        return result.Success ? result.Data! : new();
    }

    // AI
    public async Task<SkillGapAnalysisDto?> GetSkillGapAnalysis([Service] IAIRecommendationService service, Guid profileId, Guid careerRoadmapId)
    {
        var result = await service.AnalyzeSkillGapAsync(profileId, careerRoadmapId);
        return result.Success ? result.Data : null;
    }

    public async Task<PortfolioAnalysisDto?> GetPortfolioAnalysis([Service] IAIRecommendationService service, Guid profileId)
    {
        var result = await service.AnalyzeGitHubPortfolioAsync(profileId);
        return result.Success ? result.Data : null;
    }

    public async Task<List<string>> GetTrendingSkillRecommendations([Service] IAIRecommendationService service, Guid profileId)
    {
        var result = await service.GetTrendingSkillRecommendationsAsync(profileId);
        return result.Success ? result.Data! : new();
    }

    public async Task<List<LearningResourceDto>> GetRecommendedResources([Service] IAIRecommendationService service, Guid profileId, Guid nodeId)
    {
        var result = await service.RecommendLearningResourcesAsync(profileId, nodeId);
        return result.Success ? result.Data! : new();
    }
}
