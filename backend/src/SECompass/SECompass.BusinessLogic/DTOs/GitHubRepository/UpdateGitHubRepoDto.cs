namespace SECompass.BusinessLogic.DTOs.GitHubRepository;

public class UpdateGitHubRepoDto
{
    public string? RepositoryName { get; set; }
    public string? RepoUrl { get; set; }
    public string? Description { get; set; }
    public bool? IsPrivate { get; set; }
}
