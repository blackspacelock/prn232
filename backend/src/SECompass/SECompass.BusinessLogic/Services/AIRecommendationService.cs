using AutoMapper;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.LearningResource;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class AIRecommendationService : IAIRecommendationService
{
    private const int MaxReadmeChars = 12000;

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIRecommendationService> _logger;

    public AIRecommendationService(
        IUnitOfWork uow,
        IMapper mapper,
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AIRecommendationService> logger)
    {
        _uow = uow;
        _mapper = mapper;
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ServiceResult<PortfolioAnalysisDto>> AnalyzeGitHubPortfolioAsync(Guid profileId)
    {
        var repos = await _uow.GitHubRepositories.FindAsync(r => r.ProfileId == profileId);
        var repoList = repos.ToList();
        var publicRepos = repoList.Where(r => !r.IsPrivate).ToList();
        var readmeAnalyses = new List<RepositoryAnalysisDto>();

        foreach (var repo in repoList)
        {
            var readme = await FetchReadmeAsync(repo.RepoUrl);
            var repoAnalysis = await AnalyzeRepositoryReadmeAsync(repo, readme);
            readmeAnalyses.Add(repoAnalysis);

            repo.Description = repoAnalysis.Objective;
            _uow.GitHubRepositories.Update(repo);
        }

        var documentedRepos = readmeAnalyses.Where(a => !string.IsNullOrWhiteSpace(a.Objective)).ToList();
        var inferredStacks = readmeAnalyses
            .SelectMany(a => a.TechStacks)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s)
            .ToList();

        var dto = new PortfolioAnalysisDto
        {
            ProfileId = profileId,
            RepositoryNames = repoList.Select(r => r.RepositoryName).ToList(),
            OverallSummary = BuildOverallSummary(repoList.Count, publicRepos.Count, documentedRepos.Count, inferredStacks),
            Strengths = BuildStrengths(repoList.Count, publicRepos.Count, documentedRepos.Count, inferredStacks),
            Recommendations = BuildRecommendations(repoList.Count, publicRepos.Count, documentedRepos.Count, inferredStacks),
            RepositoryAnalyses = readmeAnalyses
        };

        await UpdatePublicPortfolioFromAnalysisAsync(profileId, dto, inferredStacks);
        return ServiceResult<PortfolioAnalysisDto>.Ok(dto);
    }

    private async Task<string?> FetchReadmeAsync(string repoUrl)
    {
        var repoPath = TryParseGitHubRepoPath(repoUrl);
        if (repoPath == null) return null;

        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.github.com/repos/{repoPath}/readme");
        request.Headers.UserAgent.ParseAdd("SECompass/1.0");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.raw"));

        try
        {
            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch README for {RepoPath}: {StatusCode}", repoPath, response.StatusCode);
                return null;
            }

            var readme = await response.Content.ReadAsStringAsync();
            return readme.Length > MaxReadmeChars ? readme[..MaxReadmeChars] : readme;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "README fetch failed for {RepoPath}", repoPath);
            return null;
        }
    }

    private async Task<RepositoryAnalysisDto> AnalyzeRepositoryReadmeAsync(GitHubRepository repo, string? readme)
    {
        if (string.IsNullOrWhiteSpace(readme))
        {
            var fallbackStack = InferTechStack($"{repo.RepositoryName} {repo.Description}").ToList();
            var fallbackObjective = BuildRepositoryObjective(repo.RepositoryName, repo.Description);
            return new RepositoryAnalysisDto
            {
                RepositoryId = repo.Id,
                RepositoryName = repo.RepositoryName,
                Objective = fallbackObjective,
                TechStacks = fallbackStack,
                Summary = BuildRepositorySummary(repo.RepositoryName, fallbackObjective, repo.IsPrivate, fallbackStack)
            };
        }

        var aiResult = await TryAnalyzeReadmeWithOpenAiAsync(repo.RepositoryName, readme);
        if (aiResult != null)
        {
            aiResult.RepositoryId = repo.Id;
            aiResult.RepositoryName = repo.RepositoryName;
            if (string.IsNullOrWhiteSpace(aiResult.Summary))
            {
                aiResult.Summary = BuildRepositorySummary(repo.RepositoryName, aiResult.Objective, repo.IsPrivate, aiResult.TechStacks);
            }
            return aiResult;
        }

        var stack = InferTechStack(readme).ToList();
        var objective = ExtractObjectiveFromReadme(repo.RepositoryName, readme);
        return new RepositoryAnalysisDto
        {
            RepositoryId = repo.Id,
            RepositoryName = repo.RepositoryName,
            Objective = objective,
            TechStacks = stack,
            Summary = BuildRepositorySummary(repo.RepositoryName, objective, repo.IsPrivate, stack)
        };
    }

    private async Task<RepositoryAnalysisDto?> TryAnalyzeReadmeWithOpenAiAsync(string repositoryName, string readme)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) return null;

        var prompt = """
            Extract a concise project objective and technology stack from this GitHub README.
            Return only valid JSON with this schema:
            {"objective":"one sentence project objective","techStacks":["tech","tech"],"summary":"two sentence recruiter-facing summary"}
            Do not include markdown fences.
            """;

        var requestBody = new
        {
            model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = "You analyze GitHub README files for student software engineering portfolios." },
                new { role = "user", content = $"{prompt}\n\nRepository: {repositoryName}\n\nREADME:\n{readme}" }
            },
            temperature = 0.2,
            max_tokens = 500
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("OpenAI README analysis failed for {RepositoryName}: {StatusCode}", repositoryName, response.StatusCode);
                return null;
            }

            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content)) return null;
            return JsonSerializer.Deserialize<RepositoryAnalysisDto>(
                content.Trim(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "OpenAI README analysis threw for {RepositoryName}", repositoryName);
            return null;
        }
    }

    public async Task<ServiceResult<PortfolioAnalysisDto?>> GetCachedPortfolioAnalysisAsync(Guid profileId)
    {
        var portfolios = await _uow.PublicPortfolios.FindAsync(p => p.ProfileId == profileId);
        var portfolio = portfolios.FirstOrDefault();
        if (portfolio == null || string.IsNullOrWhiteSpace(portfolio.CachedPortfolioAnalysisJson))
        {
            return ServiceResult<PortfolioAnalysisDto?>.Ok(null);
        }

        var analysis = JsonSerializer.Deserialize<PortfolioAnalysisDto>(
            portfolio.CachedPortfolioAnalysisJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return ServiceResult<PortfolioAnalysisDto?>.Ok(analysis);
    }

    private async Task UpdatePublicPortfolioFromAnalysisAsync(Guid profileId, PortfolioAnalysisDto analysis, List<string> inferredStacks)
    {
        var portfolios = await _uow.PublicPortfolios.FindAsync(p => p.ProfileId == profileId);
        var portfolio = portfolios.FirstOrDefault();
        if (portfolio == null)
        {
            var profileExists = await _uow.Profiles.ExistsAsync(p => p.UserId == profileId);
            if (!profileExists) return;

            portfolio = new PublicPortfolio
            {
                Id = Guid.NewGuid(),
                ProfileId = profileId,
                IsPublic = true
            };
            await _uow.PublicPortfolios.AddAsync(portfolio);
        }

        portfolio.CachedPortfolioAnalysisJson = JsonSerializer.Serialize(analysis);
        portfolio.Headline = BuildPublicHeadline(inferredStacks);
        portfolio.PublicBio = analysis.OverallSummary;
        portfolio.LastAnalyzedAt = DateTime.Now;
        _uow.PublicPortfolios.Update(portfolio);
        await _uow.SaveChangesAsync();
    }

    private static string BuildOverallSummary(int repoCount, int publicCount, int documentedCount, List<string> inferredStacks)
    {
        if (repoCount == 0)
        {
            return "No repositories have been linked yet, so the portfolio story is not ready for employer review.";
        }

        var visibility = publicCount == repoCount
            ? "all visible to public viewers"
            : $"{publicCount} visible to public viewers";
        var documentation = documentedCount == repoCount
            ? "each project has a short description"
            : $"{documentedCount} include descriptions";
        var stackText = inferredStacks.Count == 0
            ? "No clear technology focus is detectable from names or descriptions yet."
            : $"Detected focus areas include {string.Join(", ", inferredStacks.Take(5))}.";

        return $"This portfolio contains {repoCount} repositories, with {visibility}; {documentation}. {stackText}";
    }

    private static List<string> BuildStrengths(int repoCount, int publicCount, int documentedCount, List<string> inferredStacks)
    {
        var strengths = new List<string>();
        if (repoCount > 0) strengths.Add("Active GitHub presence");
        if (publicCount >= 2) strengths.Add("Multiple projects are visible to recruiters");
        if (documentedCount >= Math.Max(1, repoCount / 2)) strengths.Add("Project descriptions help explain intent");
        if (inferredStacks.Count >= 3) strengths.Add("Diverse technical stack signals adaptability");
        if (inferredStacks.Any(s => s.Contains("API", StringComparison.OrdinalIgnoreCase) || s.Contains("Backend", StringComparison.OrdinalIgnoreCase)))
            strengths.Add("Backend or API work is represented");
        if (inferredStacks.Any(s => s.Contains("Frontend", StringComparison.OrdinalIgnoreCase) || s.Contains("React", StringComparison.OrdinalIgnoreCase)))
            strengths.Add("Frontend experience is represented");

        return strengths.Count > 0 ? strengths : new List<string> { "Portfolio foundation has been started" };
    }

    private static List<string> BuildRecommendations(int repoCount, int publicCount, int documentedCount, List<string> inferredStacks)
    {
        var recommendations = new List<string>();
        if (repoCount == 0)
        {
            return new List<string>
            {
                "Add two or three representative GitHub projects.",
                "Write descriptions that explain the problem, your role, and the main technologies.",
                "Make at least one polished project public for recruiters."
            };
        }

        if (publicCount == 0) recommendations.Add("Make at least one polished repository public so the shared portfolio has visible work.");
        if (documentedCount < repoCount) recommendations.Add("Add concise descriptions or README summaries for repositories that lack context.");
        if (inferredStacks.Count == 0) recommendations.Add("Mention core technologies in project names or descriptions to make your specialization easier to understand.");
        if (!inferredStacks.Any(s => s.Contains("Test", StringComparison.OrdinalIgnoreCase))) recommendations.Add("Highlight testing, deployment, or quality practices where applicable.");
        if (repoCount < 3) recommendations.Add("Add another focused project to make the portfolio story feel more complete.");

        return recommendations.Count > 0 ? recommendations : new List<string> { "Add live demo links and measurable outcomes to strengthen recruiter impact." };
    }

    private static string BuildPublicHeadline(List<string> inferredStacks)
    {
        return inferredStacks.Count == 0
            ? "Software Engineering Portfolio"
            : $"Software Engineering Portfolio focused on {string.Join(", ", inferredStacks.Take(3))}";
    }

    private static string BuildRepositoryObjective(string name, string? description)
    {
        return string.IsNullOrWhiteSpace(description)
            ? $"Showcases a software project named {name}. Add a clearer description to explain the problem, users, and outcome."
            : description.Trim();
    }

    private static string ExtractObjectiveFromReadme(string name, string readme)
    {
        var lines = readme
            .Split('\n')
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Where(line => !line.StartsWith("#"))
            .Where(line => !line.StartsWith("!["))
            .Where(line => !line.StartsWith("[!"))
            .Take(4)
            .ToList();

        if (lines.Count == 0)
        {
            return $"Showcases a software project named {name}.";
        }

        var objective = string.Join(" ", lines);
        return objective.Length > 280 ? $"{objective[..277]}..." : objective;
    }

    private static string BuildRepositorySummary(string name, string objective, bool isPrivate, List<string> stack)
    {
        var visibility = isPrivate ? "private portfolio project" : "public portfolio project";
        var stackText = stack.Count == 0 ? "The technology stack is not explicit yet" : $"Likely stack: {string.Join(", ", stack)}";

        return $"{name} is a {visibility}. Objective: {objective} {stackText}.";
    }

    private static IEnumerable<string> InferTechStack(string text)
    {
        var normalized = text.ToLowerInvariant();
        var signals = new Dictionary<string, string[]>
        {
            ["React"] = new[] { "react", "vite", "tsx", "jsx" },
            ["Frontend"] = new[] { "frontend", "ui", "tailwind", "css", "html" },
            [".NET"] = new[] { ".net", "dotnet", "aspnet", "asp.net", "c#" },
            ["Backend/API"] = new[] { "api", "backend", "server", "rest", "graphql" },
            ["Database"] = new[] { "sql", "database", "postgres", "mysql", "mongodb", "sqlite", "ef core", "entity framework" },
            ["Mobile"] = new[] { "flutter", "dart", "android", "ios", "mobile" },
            ["AI/Data"] = new[] { "ai", "ml", "machine learning", "data", "python", "notebook" },
            ["Testing"] = new[] { "test", "testing", "unit", "integration" },
            ["DevOps"] = new[] { "docker", "deploy", "pipeline", "azure", "aws", "ci/cd" }
        };

        foreach (var signal in signals)
        {
            if (signal.Value.Any(keyword => normalized.Contains(keyword)))
            {
                yield return signal.Key;
            }
        }
    }

    private static string? TryParseGitHubRepoPath(string repoUrl)
    {
        if (!Uri.TryCreate(repoUrl, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (!uri.Host.Equals("github.com", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var segments = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length < 2) return null;

        var owner = segments[0];
        var repo = segments[1].EndsWith(".git", StringComparison.OrdinalIgnoreCase)
            ? segments[1][..^4]
            : segments[1];

        return $"{owner}/{repo}";
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
