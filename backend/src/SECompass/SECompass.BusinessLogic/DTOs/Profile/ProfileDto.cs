namespace SECompass.BusinessLogic.DTOs.Profile;

public class ProfileDto
{
    public Guid UserId { get; set; }
    public string? BioDescription { get; set; }
    public string? PhoneNumber { get; set; }
    public string? University { get; set; }
    public string? Major { get; set; }
    public int? StudiedYear { get; set; }
    public DateTime CreatedAt { get; set; }
}
