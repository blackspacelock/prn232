namespace SECompass.DataAccess.Entities;

public class GitHubRepository : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string RepoUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }

    public Profile Profile { get; set; } = null!;
}
