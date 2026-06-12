namespace SECompass.DataAccess.Entities;

public class TechnicalSkill : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public ICollection<NodeTechnicalSkill> NodeTechnicalSkills { get; set; } = new List<NodeTechnicalSkill>();
    public ICollection<ProfileTechnicalSkill> ProfileTechnicalSkills { get; set; } = new List<ProfileTechnicalSkill>();
}
