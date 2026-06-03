namespace SECompass.BusinessLogic.Common;

public class FilterRequest
{
    public string? SearchTerm { get; set; }
    public Dictionary<string, string>? Filters { get; set; }
}
