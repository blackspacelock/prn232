namespace SECompass.BusinessLogic.DTOs.GitHubRepository;

public class AddGitHubRepoDto
{
    public Guid ProfileId { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string RepoUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
}
