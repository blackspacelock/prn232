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
            .ForMember(d => d.Skills, o => o.MapFrom(s => s.Skills));
        CreateMap<UpdateProfileDto, DataAccess.Entities.Profile>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Skill
        CreateMap<Skill, SkillDto>();
        CreateMap<AddSkillDto, Skill>()
            .ForMember(d => d.ProfileId, o => o.MapFrom(s => s.ProfileId));

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

        // PersonalRoadmap
        CreateMap<PersonalRoadmap, PersonalRoadmapDto>();
        CreateMap<PersonalRoadmap, PersonalRoadmapDetailDto>()
            .ForMember(d => d.NodeProgresses, o => o.MapFrom(s => s.NodeProgresses));

        // NodeProgress
        CreateMap<NodeProgress, NodeProgressDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => (int)s.Status))
            .ForMember(d => d.Node, o => o.MapFrom(s => s.Node));

        // LearningResource
        CreateMap<LearningResource, LearningResourceDto>();
        CreateMap<CreateLearningResourceDto, LearningResource>();
        CreateMap<UpdateLearningResourceDto, LearningResource>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // GitHubRepository
        CreateMap<GitHubRepository, GitHubRepositoryDto>();
        CreateMap<AddGitHubRepoDto, GitHubRepository>();

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
    }
}
