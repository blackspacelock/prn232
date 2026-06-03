using SECompass.DataAccess.Enums;

namespace SECompass.DataAccess.Entities;

public class User : BaseAuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHashed { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public string? GoogleId { get; set; }
    public string? AvatarUrl { get; set; }

    public Profile? Profile { get; set; }
    public ICollection<UserRefreshToken> UserRefreshTokens { get; set; } = new List<UserRefreshToken>();
}
