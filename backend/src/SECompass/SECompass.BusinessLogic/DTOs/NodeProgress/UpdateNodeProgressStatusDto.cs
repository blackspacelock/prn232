using SECompass.DataAccess.Enums;

namespace SECompass.BusinessLogic.DTOs.NodeProgress;

public class UpdateNodeProgressStatusDto
{
    public NodeProgressStatus Status { get; set; }
    public string? Note { get; set; }
}
