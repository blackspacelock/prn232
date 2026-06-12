namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class UpdateJobScrapingSourceDto
{
    public string? Name { get; set; }
    public string? Region { get; set; }
    public bool? Enabled { get; set; }
    public string? Url { get; set; }
    public string? JobCardXPath { get; set; }
    public string? TitleXPath { get; set; }
    public string? TagsXPath { get; set; }
    public int? MaxPostings { get; set; }
}
