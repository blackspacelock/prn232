namespace SECompass.BusinessLogic.DTOs.JobTrend;

public class JobScrapingSourceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string Url { get; set; } = string.Empty;
    public string JobCardXPath { get; set; } = string.Empty;
    public string TitleXPath { get; set; } = string.Empty;
    public string TagsXPath { get; set; } = string.Empty;
    public int MaxPostings { get; set; }
}
