namespace SECompass.DataAccess.Entities;

public class NodeTechnicalSkill : BaseAuditableEntity
{
    public Guid NodeId { get; set; }
    public Guid TechnicalSkillId { get; set; }

    public Node Node { get; set; } = null!;
    public TechnicalSkill TechnicalSkill { get; set; } = null!;
}
