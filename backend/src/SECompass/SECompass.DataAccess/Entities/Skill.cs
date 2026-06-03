namespace SECompass.DataAccess.Entities;

public class Skill : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string? Note { get; set; }

    public Profile Profile { get; set; } = null!;
}
