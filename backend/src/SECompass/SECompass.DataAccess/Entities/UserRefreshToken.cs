namespace SECompass.DataAccess.Entities;

public class UserRefreshToken : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }

    public User User { get; set; } = null!;
}
