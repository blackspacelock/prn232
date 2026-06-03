namespace SECompass.DataAccess.Entities;

public class Profile : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string? BioDescription { get; set; }
    public string? PhoneNumber { get; set; }
    public string? University { get; set; }
    public string? Major { get; set; }
    public int? StudiedYear { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
    public ICollection<GitHubRepository> GitHubRepositories { get; set; } = new List<GitHubRepository>();
    public ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public ICollection<PersonalRoadmap> PersonalRoadmaps { get; set; } = new List<PersonalRoadmap>();
}
