using AutoMapper;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.Auth;
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
using SECompass.BusinessLogic.DTOs.PublicPortfolio;
using SECompass.BusinessLogic.DTOs.RoadmapNode;
using SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.DTOs.User;
using SECompass.DataAccess.Entities;

namespace SECompass.BusinessLogic.Mappings;

public class MappingProfile : AutoMapper.Profile
{
    public MappingProfile()
    {
        // User
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => (int)s.Role));
        CreateMap<RegisterUserDto, User>()
            .ForMember(d => d.PasswordHashed, o => o.Ignore())
            .ForMember(d => d.Role, o => o.Ignore());

        // Profile
        CreateMap<DataAccess.Entities.Profile, ProfileDto>()
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.UserId));
        CreateMap<DataAccess.Entities.Profile, ProfileWithSkillsDto>()
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.UserId))
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.User.FullName))
            .ForMember(d => d.AvatarUrl, o => o.MapFrom(s => s.User.AvatarUrl))
            .ForMember(d => d.Skills, o => o.MapFrom(s => s.ProfileTechnicalSkills));
        CreateMap<UpdateProfileDto, DataAccess.Entities.Profile>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Skill
        CreateMap<TechnicalSkill, TechnicalSkillDto>();
        CreateMap<ProfileTechnicalSkill, SkillDto>()
            .ForMember(d => d.SkillName, o => o.MapFrom(s => s.TechnicalSkill.Name))
            .ForMember(d => d.Category, o => o.MapFrom(s => s.TechnicalSkill.Category));

        // CareerRole
        CreateMap<CareerRole, CareerRoleDto>();
        CreateMap<CreateCareerRoleDto, CareerRole>();
        CreateMap<UpdateCareerRoleDto, CareerRole>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // CareerRoadmap
        CreateMap<CareerRoadmap, CareerRoadmapDto>();
        CreateMap<CareerRoadmap, CareerRoadmapWithNodesDto>()
            .ForMember(d => d.Nodes, o => o.Ignore());
        CreateMap<CreateCareerRoadmapDto, CareerRoadmap>();
        CreateMap<UpdateCareerRoadmapDto, CareerRoadmap>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Node
        CreateMap<Node, NodeDto>();
        CreateMap<Node, NodeHierarchyDto>()
            .ForMember(d => d.Children, o => o.MapFrom(s => s.Children));
        CreateMap<CreateNodeDto, Node>();
        CreateMap<UpdateNodeDto, Node>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // RoadmapNode
        CreateMap<RoadmapNode, RoadmapNodeDto>();
        CreateMap<CreateRoadmapNodeDto, RoadmapNode>();
        CreateMap<UpdateRoadmapNodeDto, RoadmapNode>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // RoadmapNodeEdge
        CreateMap<RoadmapNodeEdge, RoadmapNodeEdgeDto>();
        CreateMap<CreateRoadmapNodeEdgeDto, RoadmapNodeEdge>();
        CreateMap<UpdateRoadmapNodeEdgeDto, RoadmapNodeEdge>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // PersonalRoadmap
        CreateMap<PersonalRoadmap, PersonalRoadmapDto>()
            .ForMember(d => d.CareerRoadmapName, o => o.MapFrom(s => s.CareerRoadmap.Name))
            .ForMember(d => d.CareerRoadmapDescription, o => o.MapFrom(s => s.CareerRoadmap.Description));
        CreateMap<PersonalRoadmap, PersonalRoadmapDetailDto>()
            .ForMember(d => d.CareerRoadmapName, o => o.MapFrom(s => s.CareerRoadmap.Name))
            .ForMember(d => d.CareerRoadmapDescription, o => o.MapFrom(s => s.CareerRoadmap.Description))
            .ForMember(d => d.NodeProgresses, o => o.MapFrom(s => s.NodeProgresses));

        // NodeProgress
        CreateMap<NodeProgress, NodeProgressDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => (int)s.Status))
            .ForMember(d => d.NodeId, o => o.MapFrom(s => s.RoadmapNode.NodeId))
            .ForMember(d => d.Node, o => o.MapFrom(s => s.RoadmapNode.Node));

        // LearningResource
        CreateMap<LearningResource, LearningResourceDto>();
        CreateMap<CreateLearningResourceDto, LearningResource>();
        CreateMap<UpdateLearningResourceDto, LearningResource>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // GitHubRepository
        CreateMap<GitHubRepository, GitHubRepositoryDto>();
        CreateMap<AddGitHubRepoDto, GitHubRepository>();
        CreateMap<UpdateGitHubRepoDto, GitHubRepository>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // PublicPortfolio
        CreateMap<PublicPortfolio, PublicPortfolioDto>()
            .ForMember(d => d.CachedPortfolioAnalysis, o => o.Ignore());
        CreateMap<UpdatePublicPortfolioDto, PublicPortfolio>()
            .ForMember(d => d.IsPublic, o => o.MapFrom((src, dest) => src.IsPublic ?? dest.IsPublic))
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // ChatSession
        CreateMap<ChatSession, ChatSessionDto>();
        CreateMap<ChatSession, ChatSessionDetailDto>()
            .ForMember(d => d.Messages, o => o.MapFrom(s => s.ChatMessages));
        CreateMap<CreateChatSessionDto, ChatSession>();

        // ChatMessage
        CreateMap<ChatMessage, ChatMessageDto>();
        CreateMap<SendMessageDto, ChatMessage>();

        // JobTrend
        CreateMap<JobTrend, JobTrendDto>();
        CreateMap<CreateJobTrendDto, JobTrend>();
        CreateMap<UpdateJobTrendDto, JobTrend>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // JobScrapingSetting
        CreateMap<JobScrapingSetting, JobScrapingSettingDto>();
        CreateMap<UpdateJobScrapingSettingDto, JobScrapingSetting>();

        // JobScrapingSource
        CreateMap<JobScrapingSource, JobScrapingSourceDto>();
        CreateMap<CreateJobScrapingSourceDto, JobScrapingSource>();
        CreateMap<UpdateJobScrapingSourceDto, JobScrapingSource>()
            .ForMember(d => d.Name, o => o.MapFrom((src, dest) => src.Name ?? dest.Name))
            .ForMember(d => d.Region, o => o.MapFrom((src, dest) => src.Region ?? dest.Region))
            .ForMember(d => d.Enabled, o => o.MapFrom((src, dest) => src.Enabled ?? dest.Enabled))
            .ForMember(d => d.Url, o => o.MapFrom((src, dest) => src.Url ?? dest.Url))
            .ForMember(d => d.JobCardXPath, o => o.MapFrom((src, dest) => src.JobCardXPath ?? dest.JobCardXPath))
            .ForMember(d => d.TitleXPath, o => o.MapFrom((src, dest) => src.TitleXPath ?? dest.TitleXPath))
            .ForMember(d => d.TagsXPath, o => o.MapFrom((src, dest) => src.TagsXPath ?? dest.TagsXPath))
            .ForMember(d => d.MaxPostings, o => o.MapFrom((src, dest) => src.MaxPostings ?? dest.MaxPostings));
    }
}
