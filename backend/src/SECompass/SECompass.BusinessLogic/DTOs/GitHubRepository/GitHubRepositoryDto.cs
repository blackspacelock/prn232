namespace SECompass.BusinessLogic.DTOs.GitHubRepository;

public class GitHubRepositoryDto
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string RepoUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
    public DateTime CreatedAt { get; set; }
}
