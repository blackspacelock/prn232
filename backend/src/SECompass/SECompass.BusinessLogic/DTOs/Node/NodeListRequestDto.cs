namespace SECompass.BusinessLogic.DTOs.Node;

public class NodeListRequestDto
{
    public Guid? ParentNodeId { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
