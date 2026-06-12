using System.Text.RegularExpressions;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using SECompass.BusinessLogic.DTOs.JobTrend;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class JobTrendScrapingService : IJobTrendScrapingService
{
    // Fallback keyword dictionary used when the TechnicalSkills table has too few entries
    // to produce a meaningful keyword-frequency analysis (FR4.2).
    private static readonly string[] DefaultSkillKeywords =
    {
        "React", "Angular", "Vue", "Node.js", ".NET", "C#", "Java", "Spring", "Python", "Django",
        "JavaScript", "TypeScript", "Go", "Rust", "PHP", "Laravel", "SQL Server", "MySQL", "PostgreSQL",
        "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GraphQL", "REST API",
        "Microservices", "Machine Learning", "Flutter", "Swift", "Kotlin", "Android", "iOS", "HTML", "CSS",
        "Tailwind", "Next.js", "DevOps", "CI/CD", "Agile", "Scrum"
    };

    private static readonly Regex AlphanumericOnly = new(@"^[A-Za-z0-9 ]+$", RegexOptions.Compiled);

    private readonly HttpClient _httpClient;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<JobTrendScrapingService> _logger;

    public JobTrendScrapingService(HttpClient httpClient, IUnitOfWork uow, ILogger<JobTrendScrapingService> logger)
    {
        _httpClient = httpClient;
        _uow = uow;
        _logger = logger;
    }

    public async Task<JobTrendScrapeResultDto> RunScrapingAsync(CancellationToken cancellationToken = default)
    {
        var sources = await _uow.JobScrapingSources.GetAllAsync();
        var today = DateTime.Now.Date;
        var skills = await GetSkillKeywordsAsync();

        var result = new JobTrendScrapeResultDto { SnapshotDate = today };

        foreach (var source in sources.Where(s => s.Enabled))
        {
            var sourceResult = new JobTrendScrapeSourceResultDto { SourceName = source.Name, Region = source.Region };

            try
            {
                var postings = await ScrapeSourceAsync(source, cancellationToken);
                sourceResult.PostingsScraped = postings.Count;
                sourceResult.Success = true;
                result.TotalPostingsScraped += postings.Count;

                if (postings.Count > 0)
                    await UpsertTrendsForSourceAsync(source, postings, skills, today, result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Job trend scrape failed for source {Source} ({Url})", source.Name, source.Url);
                sourceResult.Success = false;
                sourceResult.Error = ex.Message;
            }

            result.Sources.Add(sourceResult);
        }

        if (result.TrendsCreated > 0 || result.TrendsUpdated > 0)
            await _uow.SaveChangesAsync();

        return result;
    }

    private async Task<List<string>> GetSkillKeywordsAsync()
    {
        var dbSkills = (await _uow.TechnicalSkills.GetAllAsync()).Select(s => s.Name);

        return dbSkills.Concat(DefaultSkillKeywords)
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .GroupBy(s => s, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();
    }

    private async Task<List<ScrapedJobPosting>> ScrapeSourceAsync(JobScrapingSource source, CancellationToken cancellationToken)
    {
        var html = await _httpClient.GetStringAsync(source.Url, cancellationToken);

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var cards = doc.DocumentNode.SelectNodes(source.JobCardXPath);
        if (cards == null) return new List<ScrapedJobPosting>();

        var postings = new List<ScrapedJobPosting>();
        foreach (var card in cards)
        {
            if (postings.Count >= source.MaxPostings) break;

            var title = card.SelectNodes(source.TitleXPath)?.FirstOrDefault()?.InnerText;
            if (string.IsNullOrWhiteSpace(title)) continue;

            var tagNodes = card.SelectNodes(source.TagsXPath);
            var tags = tagNodes == null ? string.Empty : string.Join(" ", tagNodes.Select(n => n.InnerText));

            postings.Add(new ScrapedJobPosting(
                HtmlEntity.DeEntitize(title).Trim(),
                HtmlEntity.DeEntitize(tags).Trim()));
        }

        return postings;
    }

    private async Task UpsertTrendsForSourceAsync(
        JobScrapingSource source,
        List<ScrapedJobPosting> postings,
        List<string> skills,
        DateTime today,
        JobTrendScrapeResultDto result)
    {
        var total = postings.Count;

        foreach (var skill in skills)
        {
            var mentionCount = postings.Count(p => PostingMentionsSkill(p.CombinedText, skill));
            if (mentionCount == 0) continue;

            var trendScore = Math.Clamp((int)Math.Round(100.0 * mentionCount / total), 1, 100);
            var description = BuildJobDescription(skill, postings);

            var existing = (await _uow.JobTrends.FindAsync(t =>
                t.TechSkill == skill &&
                t.Source == source.Name &&
                t.Region == source.Region &&
                t.SnapshotDate.Date == today)).FirstOrDefault();

            if (existing != null)
            {
                existing.TrendScore = trendScore;
                existing.Description = description;
                _uow.JobTrends.Update(existing);
                result.TrendsUpdated++;
            }
            else
            {
                await _uow.JobTrends.AddAsync(new JobTrend
                {
                    Id = Guid.NewGuid(),
                    TechSkill = skill,
                    Description = description,
                    Source = source.Name,
                    Region = source.Region,
                    TrendScore = trendScore,
                    SnapshotDate = today
                });
                result.TrendsCreated++;
            }
        }
    }

    // Word-boundary match for plain alphanumeric skill names (so "Java" doesn't match inside "JavaScript");
    // skills containing punctuation (e.g. ".NET", "C#", "Node.js") fall back to a plain substring match.
    private static bool PostingMentionsSkill(string text, string skill)
    {
        if (AlphanumericOnly.IsMatch(skill))
            return Regex.IsMatch(text, $@"(?<![a-zA-Z0-9]){Regex.Escape(skill)}(?![a-zA-Z0-9])", RegexOptions.IgnoreCase);

        return text.Contains(skill, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildJobDescription(string skill, List<ScrapedJobPosting> postings)
    {
        var matchingPostings = postings
            .Where(p => PostingMentionsSkill(p.CombinedText, skill))
            .Select(p => p.CombinedText)
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        return matchingPostings.Count == 0
            ? $"Job postings mention {skill}."
            : string.Join(Environment.NewLine, matchingPostings);
    }

    private record ScrapedJobPosting(string Title, string Tags)
    {
        public string CombinedText => $"{Title} {Tags}";
    }
}
