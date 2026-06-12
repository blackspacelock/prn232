namespace SECompass.DataAccess.Entities;

public class ProfileTechnicalSkill : BaseAuditableEntity
{
    public Guid ProfileId { get; set; }
    public Guid TechnicalSkillId { get; set; }
    public string? Note { get; set; }

    public Profile Profile { get; set; } = null!;
    public TechnicalSkill TechnicalSkill { get; set; } = null!;
}
