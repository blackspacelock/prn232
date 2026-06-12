namespace SECompass.DataAccess.Entities;

public class JobScrapingSource : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public string Url { get; set; } = string.Empty;
    public string JobCardXPath { get; set; } = string.Empty;
    public string TitleXPath { get; set; } = string.Empty;
    public string TagsXPath { get; set; } = string.Empty;
    public int MaxPostings { get; set; } = 40;
}
