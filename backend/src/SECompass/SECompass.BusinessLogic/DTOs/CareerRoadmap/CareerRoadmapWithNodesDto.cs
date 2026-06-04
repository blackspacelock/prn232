using SECompass.BusinessLogic.DTOs.RoadmapNode;
using SECompass.BusinessLogic.DTOs.RoadmapNodeEdge;

namespace SECompass.BusinessLogic.DTOs.CareerRoadmap;

public class CareerRoadmapWithNodesDto
{
    public Guid Id { get; set; }
    public Guid CareerRoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCustom { get; set; }
    public List<RoadmapNodeDto> Nodes { get; set; } = new();
    public List<RoadmapNodeEdgeDto> Edges { get; set; } = new();
}
