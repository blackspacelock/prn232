using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SECompass.API.BackgroundServices;
using SECompass.API.GraphQL.Queries;
using SECompass.BusinessLogic.Interfaces;
using SECompass.BusinessLogic.Mappings;
using SECompass.BusinessLogic.Services;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Repositories;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // CORS
        var allowedOrigins = (configuration["Cors:AllowedOrigins"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                if (allowedOrigins.Length > 0)
                    policy.WithOrigins(allowedOrigins);

                policy
                    .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .WithHeaders("Authorization", "Content-Type", "X-Requested-With")
                    .AllowCredentials();
            });
        });

        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlOptions => sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null)));

        // Unit of Work & Repositories
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPersonalRoadmapRepository, PersonalRoadmapRepository>();
        services.AddScoped<INodeProgressRepository, NodeProgressRepository>();
        services.AddScoped<IChatRepository, ChatRepository>();

        // Business Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ISkillService, SkillService>();
        services.AddScoped<ITechnicalSkillService, TechnicalSkillService>();
        services.AddScoped<ICareerRoleService, CareerRoleService>();
        services.AddScoped<ICareerRoadmapService, CareerRoadmapService>();
        services.AddScoped<IPersonalRoadmapService, PersonalRoadmapService>();
        services.AddScoped<INodeService, NodeService>();
        services.AddScoped<INodeProgressService, NodeProgressService>();
        services.AddScoped<ILearningResourceService, LearningResourceService>();
        services.AddScoped<IGitHubRepositoryService, GitHubRepositoryService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IAIRecommendationService, AIRecommendationService>();
        services.AddScoped<ISkillGapService, SkillGapService>();
        services.AddScoped<IJobTrendService, JobTrendService>();
        services.AddScoped<IJobScrapingSettingsService, JobScrapingSettingsService>();
        services.AddScoped<IJobScrapingSourceService, JobScrapingSourceService>();

        // AI Virtual Mentor (OpenAI gpt-4o-mini)
        services.AddHttpClient<IAiMentorService, OpenAiMentorService>(client =>
        {
            var baseUrl = configuration["OpenAI:BaseUrl"];
            client.BaseAddress = new Uri(string.IsNullOrWhiteSpace(baseUrl) ? "https://api.openai.com/v1/" : baseUrl);
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        // Job Trend scraping (Market Pulse weekly job board scrape)
        services.AddHttpClient<IJobTrendScrapingService, JobTrendScrapingService>(client =>
        {
            client.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddHostedService<JobTrendScrapingBackgroundService>();

        // AutoMapper
        services.AddAutoMapper(typeof(MappingProfile).Assembly);

        // JWT Authentication
        var jwtSecret = configuration["Jwt:Secret"]!;
        var jwtIssuer = configuration["Jwt:Issuer"];
        var jwtAudience = configuration["Jwt:Audience"];

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
                };
            });

        services.AddAuthorization();

        // GraphQL
        services.AddGraphQLServer()
            .AddQueryType<Query>()
            .AddFiltering()
            .AddSorting()
            .AddProjections();

        // Swagger
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "SECompass API", Version = "v1" });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });
        });

        services.AddControllers();

        return services;
    }
}
